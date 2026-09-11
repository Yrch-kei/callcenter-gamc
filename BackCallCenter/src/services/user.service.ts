import { Repository, In, Not } from 'typeorm';
import { AppDataSource } from '../config/db';
import { User } from '../models/user.entity';
import { Mandated } from '../models/mandated.entity';
import { UserDTO } from '../types/user';
import { legalAge,
          isValidPhone,
          isValidCI,
          eliminateSpaces} from '../validations/user.validation';
import { securePassword } from '../utils/password';
import { encryptPassword, comparePassword } from '../utils/encrypt';
import { sendEmail } from '../utils/email';

import { Role } from '../models/role.entity';

export class UserService {
  private userRepository = AppDataSource.getRepository(User);
  private mandatedRepository = AppDataSource.getRepository(Mandated);
  private roleRepository = AppDataSource.getRepository(Role);

  private async validateAndPrepareUserData(
    userData: UserDTO,
    userId: number,
    isUpdate: boolean = false,
    currentUserId?: number
  ): Promise<UserDTO> {
    // Validar CI
    if (!userData.ci) {
      throw new Error('El CI es obligatorio.');
    }
    if (!isValidCI(userData.ci)) {
      throw new Error('Ingrese un número de cédula válido.');
    }
    const existingCiUser = await this.userRepository.findOne({ where: { ci: userData.ci } });
    if (existingCiUser && (!isUpdate || existingCiUser.id !== currentUserId)) {
      throw new Error('El CI ingresado ya se encuentra registrado en el sistema.');
    }

    // Validar Email
    if (!userData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      throw new Error('Ingrese un correo electrónico válido.');
    }
    const existingEmailUser = await this.userRepository.findOne({ where: { email: userData.email } });
    if (existingEmailUser && (!isUpdate || existingEmailUser.id !== currentUserId)) {
      throw new Error('Este correo electrónico ya está en uso por otro usuario.');
    }

    // Validar Nombres y Apellidos (sin números)
    if (!userData.names || /\d/.test(userData.names)) {
      throw new Error('Los nombres son obligatorios y no deben contener números.');
    }
    if (!userData.lastname || /\d/.test(userData.lastname)) {
      throw new Error('El primer apellido es obligatorio y no debe contener números.');
    }

    // Validar Teléfono (mínimo 7 dígitos)
    if (!userData.phone || userData.phone.replace(/\D/g, '').length < 7) {
      throw new Error('El número de teléfono debe tener al menos 7 dígitos.');
    }

    // Validar Rol
    if (!userData.roleId) {
      throw new Error('La selección de rol es obligatoria.');
    }
    const roleExists = await this.roleRepository.findOneBy({ id: userData.roleId });
    if (!roleExists) {
      throw new Error('El rol seleccionado no existe en el sistema.');
    }

    // Verificar mayoría de edad si se provee fecha
    if (userData.birthdate && !legalAge(userData.birthdate)) {
      throw new Error('No se puede registrar a un usuario menor de edad.');
    }

    // Eliminar los espacios sobrantes
    if (userData.names) {
      userData.names = eliminateSpaces(userData.names)!;
    }
    if (userData.lastname) {
      userData.lastname = eliminateSpaces(userData.lastname)!;
    }
    if (userData.secondLastname) {
      userData.secondLastname = eliminateSpaces(userData.secondLastname);
    }

    // Asignar el ID del usuario que realiza la acción
    userData.userId = userId;

    return userData;
  }


  // Crear un nuevos usuarios
  async createUser(userData: UserDTO, userId: number): Promise<User> {
    userData = await this.validateAndPrepareUserData(userData, userId);
    const plainPassword = securePassword();
    userData.password = await encryptPassword(plainPassword);

    const newUser = this.userRepository.create(userData);
    await this.userRepository.save(newUser);

    try {
      await sendEmail(
        userData.email!,
        'Bienvenido a la plataforma de la Alcaldia de Cochabamba',
        `Hola ${userData.names}, tu contraseña es: ${plainPassword}`
      );
    } catch (emailError: any) {
      console.warn('⚠️ No se pudo enviar el correo de bienvenida (SMTP):', emailError.message || emailError);
    }

    return newUser;
  }

  async createMandated(userData: UserDTO, userId: number): Promise<User & { speciality: string }> {
    userData = await this.validateAndPrepareUserData(userData, userId);
    const plainPassword = securePassword();
    userData.password = await encryptPassword(plainPassword);

    const newUser = this.userRepository.create(userData);
    await this.userRepository.save(newUser);

    const mandated = new Mandated();
    mandated.id = newUser.id;
    mandated.speciality = userData.speciality!;
    await this.mandatedRepository.save(mandated);

    try {
      await sendEmail(
        userData.email!,
        'Bienvenido a la plataforma de la Alcaldia de Cochabamba',
        `Hola ${userData.names}, tu contraseña es: ${plainPassword}`
      );
    } catch (emailError: any) {
      console.warn('⚠️ No se pudo enviar el correo de bienvenida (SMTP):', emailError.message || emailError);
    }

    return { ...newUser, speciality: mandated.speciality };
  }

  // Obtener todos los usuarios
  async findAllUsers(): Promise<User[]> {
    // Excluir los que tienen registro en Mandated
    const mandatedIds = (await this.mandatedRepository.find()).map(m => m.id);
    return await this.userRepository.find({
      where: { id: Not(In(mandatedIds))},
      relations: ['role', 'unit'],
    });
  }

  async findTechnicians(unitId?: number): Promise<User[]> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.unit', 'unit')
      .where('user.status = :status', { status: 1 });

    if (unitId) {
      query.andWhere('unit.id = :unitId', { unitId });
    }

    const allUsers = await query.getMany();
    return allUsers.filter(u => {
      const roleName = u.role?.name?.toLowerCase() || '';
      return roleName.includes('tecnico') || roleName.includes('campo') || roleName.includes('personal') || Boolean(u.unit);
    });
  }

  async findAllMandateds(): Promise<(User & { speciality: string })[]> {
  const mandateds = await this.mandatedRepository
    .createQueryBuilder('mandated')
    .innerJoinAndSelect('mandated.user', 'user')
    .where('user.status = :status', { status: 1 })
    .getMany();

  const users = mandateds.map(m => ({
    ...m.user,
    speciality: m.speciality,
  }));

  return users;
}

  // Obtener un usuario por ID (solo User, no Mandated)
  async findUserById(id: number): Promise<User | null> {
    const mandated = await this.mandatedRepository.findOneBy({ id });
    if (mandated) return null;
    return await this.userRepository.findOne({
      where: { id, status: 1 },
      relations: ['role', 'unit'],
    });
  }

    // Obtener un Mandated por ID
  async findMandatedById(id: number): Promise<(User & { speciality: string }) | null> {
    const mandated = await this.mandatedRepository.findOneBy({ id });
    if (!mandated) return null;
    const user = await this.userRepository.findOne({
      where: { id, status: 1 },
      relations: ['role', 'unit'],
    });
    if (!user) return null;
    return { ...user, speciality: mandated.speciality };
  }

  // Actualizar un usuario
  async updateUser(id: number, userData: UserDTO, userId: number): Promise<User | null> {
    userData = await this.validateAndPrepareUserData(userData, userId, true, id);
    userData.updateDate = new Date();
    await this.userRepository.update(id, userData);
    return await this.findUserById(id);
  }

  async updateMandated(id: number, userData: UserDTO, userId: number): Promise<(User & { speciality: string }) | null> {
    userData = await this.validateAndPrepareUserData(userData, userId, true, id);
    userData.updateDate = new Date();
    await this.userRepository.update(id, userData);

    let mandated = await this.mandatedRepository.findOneBy({ id });
    if (mandated) {
      mandated.speciality = userData.speciality!;
      await this.mandatedRepository.save(mandated);
    } else {
      mandated = new Mandated();
      mandated.id = id;
      mandated.speciality = userData.speciality!;
      await this.mandatedRepository.save(mandated);
    }
    return await this.findMandatedById(id);
  }

  // Eliminar un usuario logicamente
  async deleteUser(id: number, userEliminateId: number): Promise<void> {
    await this.userRepository.update(id, {
      deleteDate: new Date(),
      status: 0,
      userId: userEliminateId,
    });
  }

  async deleteMandated(id: number, userEliminateId: number): Promise<void> {
    await this.userRepository.update(id, {
      deleteDate: new Date(),
      status: 0,
      userId: userEliminateId,
    });
    await this.mandatedRepository.delete({ id });
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
    repeatNewPassword: string
  ): Promise<void> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new Error('Usuario no encontrado');

    // Validar contraseña actual
    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) throw new Error('La contraseña actual es incorrecta');

    // Comparar las nuevas contraseñas
    if (newPassword !== repeatNewPassword) {
      throw new Error('Las nuevas contraseñas no coinciden');
    }

    // Validar seguridad de la nueva contraseña
    if (
      newPassword.length < 10 ||
      !/[A-Z]/.test(newPassword) ||
      !/[a-z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword) ||
      !/[@#$%!?\.]/.test(newPassword)
    ) {
      throw new Error('La nueva contraseña no es segura');
    }

    // Encriptar y guardar la nueva contraseña
    user.password = await encryptPassword(newPassword);
    await this.userRepository.save(user);
  }
}