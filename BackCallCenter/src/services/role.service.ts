import { AppDataSource } from "../config/db";
import { Role } from "../models/role.entity";

export class RoleService{
    private roleRepository = AppDataSource.getRepository(Role);
    
    // Obtener todos los roles
    async getAll(): Promise<Role[]> {
        return await this.roleRepository.find();
    }
    
    // Obtener un rol por ID
    async getById(id: number): Promise<Role | null> {
        return await this.roleRepository.findOne({ where: { id } });
    }

}