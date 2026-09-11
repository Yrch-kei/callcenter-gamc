import { AppDataSource } from '../config/db';
import { Repository } from 'typeorm';

import { Complaint } from '../models/complaint.entity';
import { User }      from '../models/user.entity';
import { Company }   from '../models/company.entity';
import { Category }  from '../models/category.entity';
import { Mandated }  from '../models/mandated.entity';
import { Location }  from '../models/location.entity';
import { ComplaintImage } from '../models/complaintImage.entity';
import { PushSubscription } from '../models/pushSubscription.entity';
import { webpush } from '../utils/push';

import {
  isValidLatitude,
  isValidLongitude,
  isValidRisk,
  isValidAmount,
  isValidEvidence,
} from '../validations/complaint.Validation';

import { CreateComplaintDto } from '../dtos/complaint/createComplaint.dto';
import { UpdateComplaintDto } from '../dtos/complaint/updateComplaint.dto';

import { searchDistrict } from '../utils/district';
import { sendEmail } from '../utils/email';
import { ComplaintHistoryService } from './complaintHistory.service';

export class ComplaintService {
  private repo: Repository<Complaint>      = AppDataSource.getRepository(Complaint);
  private userRepo: Repository<User>       = AppDataSource.getRepository(User);
  private companyRepo: Repository<Company> = AppDataSource.getRepository(Company);
  private catRepo: Repository<Category>    = AppDataSource.getRepository(Category);
  private mandRepo: Repository<Mandated>   = AppDataSource.getRepository(Mandated);
  private locRepo: Repository<Location>    = AppDataSource.getRepository(Location);
  private imageRepo: Repository<ComplaintImage> = AppDataSource.getRepository(ComplaintImage);

  private validate(data: Partial<Complaint>) {
    if (data.latitude !== undefined && !isValidLatitude(data.latitude.toString()))
      throw new Error('Latitud inválida');
    if (data.longitude !== undefined && !isValidLongitude(data.longitude.toString()))
      throw new Error('Longitud inválida');
    if (data.risk !== undefined && !isValidRisk(Number(data.risk)))
      throw new Error('Riesgo inválido');
    if (data.amount !== undefined && !isValidAmount(data.amount))
      throw new Error('Monto inválido');
    if (data.evidence !== undefined && !isValidEvidence(data.evidence))
      throw new Error('Evidencia inválida');
  }

  async create(dto: CreateComplaintDto, userId: number): Promise<Complaint> {
    // Coordenadas por defecto (Centro de Cochabamba)
    const lat = dto.latitude && !isNaN(Number(dto.latitude)) && Number(dto.latitude) !== 0 ? Number(dto.latitude) : -17.3895;
    const lon = dto.longitude && !isNaN(Number(dto.longitude)) && Number(dto.longitude) !== 0 ? Number(dto.longitude) : -66.1568;

    dto.latitude = lat.toString();
    dto.longitude = lon.toString();

    this.validate(dto as any);

    // 1. Usuario Creador (fallback a ID 1 o primer usuario existente)
    let user = await this.userRepo.findOneBy({ id: userId || 1 });
    if (!user) {
      const users = await this.userRepo.find({ take: 1 });
      if (users.length > 0) {
        user = users[0];
      } else {
        throw new Error('No existe ningún usuario registrado en la base de datos.');
      }
    }

    // 2. Categorización con Normalización de Aliases e ILIKE
    let category: Category | null = null;
    const rawCategory = (dto as any).category || (dto as any).categoryName || (dto as any).categoria;

    const categoryAliases: Record<string, string> = {
      // Áreas verdes / Forestal
      'AREAS_VERDES_Y_FORESTAL': 'Árbol peligroso',
      'ARBOL_RIESGO_CAIDA': 'Árbol peligroso',
      'TALA_CLANDESTINA': 'Árbol peligroso',
      'PODA_POR_CABLES': 'Árbol peligroso',
      'DANOS_A_JARDINERAS': 'Árbol peligroso',
      'ARBOL_PELIGROSO': 'Árbol peligroso',
      'Árbol peligroso': 'Árbol peligroso',

      // Alumbrado Público
      'ALUMBRADO_PUBLICO': 'Poste sin luz',
      'POSTE_DANADO': 'Poste sin luz',
      'LUMINARIA_APAGADA': 'Poste sin luz',
      'CORTO_CIRCUITO': 'Poste sin luz',
      'CABLE_EXPUESTO': 'Poste sin luz',
      'POSTE_SIN_LUZ': 'Poste sin luz',
      'Poste sin luz': 'Poste sin luz',

      // Bacheo y Vías
      'BACHEO_Y_VIAS': 'Bache en calzada',
      'BACHE_PROFUNDO': 'Bache en calzada',
      'HUNDIMIENTO_DE_CALZADA': 'Bache en calzada',
      'SOLICITUD_ROMPEMUELLES': 'Bache en calzada',
      'PAVIMENTO_DETERIORADO': 'Bache en calzada',
      'BACHE_EN_CALZADA': 'Bache en calzada',
      'Bache en calzada': 'Bache en calzada',

      // Agua y Alcantarillado
      'AGUA_Y_ALCANTARILLADO': 'Fuga de agua',
      'FUGA_DE_AGUA': 'Fuga de agua',
      'ALCANTARILLADO_COLAPSADO': 'Fuga de agua',
      'TAPA_DESAGUE_ROTURA': 'Fuga de agua',
      'SIFONAMIENTO': 'Fuga de agua',
      'Fuga de agua': 'Fuga de agua',

      // Residuos Sólidos
      'RESIDUOS_SOLIDOS': 'Basura acumulada',
      'BASURA_ACUMULADA': 'Basura acumulada',
      'CONTENEDOR_DESBORDADO': 'Basura acumulada',
      'RECOJO_NO_REALIZADO': 'Basura acumulada',
      'ESCOMBROS_EN_VIA': 'Basura acumulada',
      'Basura acumulada': 'Basura acumulada',

      // Intendencia / Orden Público
      'CONTROL_ACTIVIDADES_E_INTENDENCIA': 'Comercio informal',
      'VENTA_ALCOHOL_CLANDESTINO': 'Comercio informal',
      'EXPENDIO_ALIMENTOS_DESCOMPUESTOS': 'Comercio informal',
      'OCUPACION_COMERCIAL_ACERA': 'Comercio informal',
      'BALANZA_ADULTERADA': 'Comercio informal',
      'COMERCIO_INFORMAL': 'Comercio informal',
      'Comercio informal': 'Comercio informal',

      // Resto de áreas municipales (Mapeo a categorías activas)
      'TRANSPORTE_PUBLICO': 'Comercio informal',
      'ESTACIONAMIENTO_TARIFADO': 'Comercio informal',
      'MEDIO_AMBIENTE': 'Árbol peligroso',
      'URBANISMO_Y_OBRAS': 'Bache en calzada',
      'ZOONOSIS': 'Comercio informal'
    };

    if (rawCategory && typeof rawCategory === 'string' && rawCategory.trim().length > 0) {
      const targetName = categoryAliases[rawCategory.trim()] || categoryAliases[rawCategory.trim().toUpperCase()] || rawCategory.trim();
      category = await this.catRepo
        .createQueryBuilder('category')
        .leftJoinAndSelect('category.unit', 'unit')
        .where('LOWER(category.name) = LOWER(:name)', { name: targetName })
        .orWhere('category.name ILIKE :partial', { partial: `%${targetName}%` })
        .getOne();

      if (!category) {
        console.warn("Categoría IA no encontrada:", rawCategory);
      }
    }

    if (!category && dto.categoryId) {
      category = await this.catRepo.findOne({
        where: { id: dto.categoryId },
        relations: ['unit'],
      });
    }

    if (!category) {
      category = await this.catRepo.findOne({
        where: {},
        relations: ['unit'],
      });
    }

    if (!category) {
      throw new Error('No existen categorías configuradas en la base de datos.');
    }

    const mandated = dto.mandatedId !== undefined
      ? await this.mandRepo.findOneBy({ id: dto.mandatedId }) ?? undefined
      : undefined;

    // 3. Ubicación y Distrito con Fallback
    let location: Location | null = null;
    try {
      const districtResult = await searchDistrict(lat, lon);
      if (districtResult && districtResult.distrito) {
        location = await this.locRepo.findOne({ where: { district: districtResult.distrito } });
      }
    } catch (e) {
      console.warn('[ComplaintService] searchDistrict no estuvo disponible, utilizando ubicación fallback:', (e as Error).message);
    }

    if (!location) {
      const locations = await this.locRepo.find({ take: 1 });
      if (locations.length > 0) {
        location = locations[0];
      } else {
        location = this.locRepo.create({
          district: 'Distrito 1',
          deputtyMajor: 'Subalcaldía Comunal',
        });
        location = await this.locRepo.save(location);
      }
    }

    const complaint = new Complaint();
    complaint.names        = dto.names || 'Ciudadano';
    complaint.lastname     = dto.lastname || '';
    complaint.phone        = dto.phone || '0000000';
    complaint.title        = dto.title || dto.incident || 'Denuncia Ciudadana';
    complaint.incident     = dto.incident || dto.title || 'Sin descripción adicional';
    complaint.citizenEmail = dto.citizenEmail ? dto.citizenEmail.trim() : null;
    complaint.notifyEmail  = dto.notifyEmail === true || (dto.notifyEmail as any) === 'true';
    complaint.reopenStatus = 'NONE';
    
    // Guardado Geoespacial compatible con PostGIS
    complaint.ubicacion  = (() => `ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)`) as any;
    complaint.latitude   = lat;
    complaint.longitude  = lon;
    
    complaint.address    = dto.address || 'Dirección no especificada';
    complaint.risk       = dto.risk     ?? 1;
    complaint.amount     = dto.amount   ?? 1;
    complaint.evidence   = dto.evidence ?? '';
    complaint.status     = dto.status   ?? 'Pendiente';
    complaint.createdBy  = user;
    complaint.category   = category;
    if (dto.companyId !== undefined) {
      complaint.company = await this.companyRepo.findOneBy({ id: dto.companyId }) ?? undefined;
    }
    if (mandated) complaint.mandated = mandated;
    complaint.location   = location;

    // 4. Generación de Código Único Oficial GAMC-YYYY-XXXXX bajo Transacción Segura
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const year = new Date().getFullYear();
      
      const lastComplaint = await queryRunner.manager
        .createQueryBuilder(Complaint, 'complaint')
        .setLock('pessimistic_write')
        .where('complaint.code LIKE :patternGAMC OR complaint.code LIKE :patternDEN', {
          patternGAMC: `GAMC-${year}-%`,
          patternDEN: `DEN-${year}-%`,
        })
        .orderBy('complaint.id', 'DESC')
        .getOne();

      let nextNumber = 1;
      if (lastComplaint && lastComplaint.code) {
        const parts = lastComplaint.code.split('-');
        if (parts.length === 3) {
          const numParsed = parseInt(parts[2], 10);
          if (!isNaN(numParsed)) {
            nextNumber = numParsed + 1;
          }
        }
      }

      complaint.code = dto.code || `GAMC-${year}-${nextNumber.toString().padStart(5, '0')}`;
      
      const savedComplaint = await queryRunner.manager.save(complaint);
      await queryRunner.commitTransaction();
      return savedComplaint;
    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      throw new Error('Error al guardar la denuncia y generar su código: ' + err.message);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(userId: number): Promise<Complaint[]> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['role', 'unit']
    });

    const roleName = (user?.role?.name || '').toLowerCase();
    const esCampo = roleName.includes('campo') || roleName.includes('tecnico') || roleName.includes('técnico') || roleName.includes('personal');

    if (esCampo && userId) {
      const conditions: any[] = [{ attendedBy: { id: userId } }];

      if (user?.unit?.id) {
        conditions.push({ category: { unit: { id: user.unit.id } } });
      }

      return this.repo.find({
        where: conditions,
        relations: ['createdBy','editBy','attendedBy','category','category.unit','mandated','company','location','images'],
        order: { registerDate: 'DESC' },
      });
    }

    return this.repo.find({
      relations: ['createdBy','editBy','attendedBy','category','category.unit','mandated','company','location','images'],
      order: { registerDate: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Complaint|null> {
    return this.repo.findOne({
      where: { id },
      relations: ['createdBy','editBy','attendedBy','category','category.unit','mandated','company','location','images']
    });
  }

  async update(idOrCode: number | string, dto: UpdateComplaintDto, userId: number): Promise<Complaint|null> {
    this.validate(dto as any);

    const param = String(idOrCode).trim();
    const isNumeric = !isNaN(Number(param));
    const complaint = await this.repo.findOne({
      where: isNumeric ? { id: Number(param) } : { code: param.toUpperCase() },
      relations: ['company','category','mandated','location']
    });
    if (!complaint) return null;

    if (['Resuelta', 'Atendida', 'Cancelada'].includes(complaint.status) && complaint.status === dto.status) {
      throw new Error('La denuncia ya ha sido cerrada.');
    }

    if (dto.names)     complaint.names     = dto.names;
    if (dto.lastname)  complaint.lastname  = dto.lastname;
    if (dto.phone)     complaint.phone     = dto.phone;
    if (dto.title)     complaint.title     = dto.title;
    if (dto.incident)  complaint.incident  = dto.incident;
    if (dto.latitude)  complaint.latitude  = Number(dto.latitude);
    if (dto.longitude) complaint.longitude = Number(dto.longitude);
    if (dto.address)   complaint.address   = dto.address;
    if (dto.risk !== undefined)   complaint.risk   = dto.risk;
    if (dto.amount !== undefined) complaint.amount = dto.amount;
    if (dto.evidence)  complaint.evidence  = dto.evidence;
    if (dto.status)    complaint.status    = dto.status;

    if (dto.companyId)  {
      complaint.company  = await this.companyRepo.findOneByOrFail({ id: dto.companyId });
    }
    
    if (dto.categoryId) {
      const category = await this.catRepo.findOneOrFail({
        where: { id: dto.categoryId },
        relations: ['unit']
      });
      if (!category.unit) throw new Error('Jerarquía inválida: La categoría seleccionada no tiene un Sub-área (Unidad) asignada.');
      complaint.category = category;
    }
    
    if (dto.mandatedId) complaint.mandated = await this.mandRepo.findOneByOrFail({ id: dto.mandatedId });

    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      const districtResult = await searchDistrict(Number(dto.latitude), Number(dto.longitude));
      if (!districtResult) {
        throw new Error('La coordenada no corresponde a un distrito válido');
      }
      const location = await this.locRepo.findOne({ where: { district: districtResult.distrito! } });
      if (!location) {
        throw new Error(`No se encontró el distrito ${districtResult.distrito} en la base de datos`);
      }
      complaint.location = location;
      // Actualizar PostGIS Point
      complaint.ubicacion = (() => `ST_SetSRID(ST_MakePoint(${Number(dto.longitude)}, ${Number(dto.latitude)}), 4326)`) as any;
    }

    if (userId) {
      const user = await this.userRepo.findOneBy({ id: userId });
      if (user) complaint.editBy = user;
    }
    complaint.updateDate = new Date();

    return this.repo.save(complaint);
  }

  async startIntervention(
    complaintId: number, 
    userId: number, 
    latitude: number, 
    longitude: number,
    photosUrls: string[]
  ): Promise<Complaint> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['unit']
    });
    if (!user) throw new Error('Usuario no encontrado');

    const complaint = await this.repo.findOne({
      where: { id: complaintId },
      relations: ['category']
    });

    if (!complaint) throw new Error('Denuncia no encontrada');

    const category = await this.catRepo.findOne({
      where: { id: complaint.category.id },
      relations: ['unit']
    });

    if (complaint.status !== 'Pendiente' && complaint.status !== 'Derivada') {
      throw new Error('Solo se puede iniciar una intervención si la denuncia está Pendiente o Derivada');
    }

    if (!category || !category.unit || !user.unit || category.unit.id !== user.unit.id) {
       throw new Error('No autorizado: El técnico no pertenece a la misma sub-área que la denuncia asignada.');
    }

    complaint.status = 'En proceso';
    complaint.arrivalTime = new Date();
    complaint.arrivalLocation = (() => `ST_SetSRID(ST_MakePoint(${Number(longitude)}, ${Number(latitude)}), 4326)`) as any;
    complaint.attendedBy = user;

    const savedComplaint = await this.repo.save(complaint);

    if (photosUrls && photosUrls.length > 0) {
       const imagesToSave = photosUrls.map(url => {
         const img = new ComplaintImage();
         img.url = url;
         img.type = 'BEFORE';
         img.complaint = savedComplaint;
         return img;
       });
       await this.imageRepo.save(imagesToSave);
    }

    return savedComplaint;
  }

  async finishIntervention(
    complaintId: number,
    userId: number,
    technicalNotes: string,
    materialsUsed: string,
    resolutionResult: string,
    operatorSignature: string | undefined,
    photosUrls: string[]
  ): Promise<Complaint> {
    const complaint = await this.repo.findOne({
      where: { id: complaintId },
      relations: ['category']
    });

    if (!complaint) throw new Error('Denuncia no encontrada');

    if (complaint.status !== 'En proceso') {
      throw new Error('Solo se puede finalizar una denuncia que esté En proceso');
    }

    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['unit']
    });
    
    const category = await this.catRepo.findOne({
      where: { id: complaint.category.id },
      relations: ['unit']
    });

    if (!user || !user.unit || !category || !category.unit || category.unit.id !== user.unit.id) {
       throw new Error('No autorizado: El técnico no pertenece a la misma sub-área que la denuncia asignada.');
    }

    complaint.status = 'Resuelta';
    complaint.finishTime = new Date();
    complaint.technicalNotes = technicalNotes;
    complaint.materialsUsed  = materialsUsed;
    complaint.resolutionResult = resolutionResult;
    complaint.operatorSignature = operatorSignature?.trim() || undefined;
    complaint.attendedBy = user;

    const savedComplaint = await this.repo.save(complaint);

    if (photosUrls && photosUrls.length > 0) {
       const imagesToSave = photosUrls.map(url => {
         const img = new ComplaintImage();
         img.url = url;
         img.type = 'AFTER';
         img.complaint = savedComplaint;
         return img;
       });
       await this.imageRepo.save(imagesToSave);
    }

    if (savedComplaint.notifyEmail && savedComplaint.citizenEmail) {
      this.sendResolutionNotification(savedComplaint);
    }

    return savedComplaint;
  }

  async sendResolutionNotification(complaint: Complaint) {
    if (!complaint.notifyEmail || !complaint.citizenEmail) return;

    const landingUrl = process.env.LANDING_URL || 'http://localhost:5174';
    const trackingLink = `${landingUrl}#consultar?code=${complaint.code}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="background-color: #16a34a; padding: 16px; border-radius: 8px 8px 0 0; text-align: center; color: white;">
          <h2 style="margin: 0; font-size: 20px;">Gobierno Autónomo Municipal de Cochabamba</h2>
          <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">Atención Ciudadana y Mantenimiento Urbano</p>
        </div>
        <div style="padding: 24px;">
          <p>Hola <strong>${complaint.names}</strong>:</p>
          <p>Le informamos que su reporte con código <strong>${complaint.code}</strong> ha sido atendido y marcado como <strong>RESUELTO</strong> por nuestras cuadrillas técnicas.</p>
          <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e2e8f0;">
            <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #334155;">Detalles del Reporte:</p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Título:</strong> ${complaint.title}</p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Dirección:</strong> ${complaint.address}</p>
            ${complaint.technicalNotes ? `<p style="margin: 4px 0; font-size: 13px;"><strong>Nota Técnica:</strong> ${complaint.technicalNotes}</p>` : ''}
          </div>
          <p>Por favor, ingrese al sistema para evaluar la atención recibida o solicitar la reapertura si el problema persiste:</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${trackingLink}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Ver Estado y Encuesta</a>
          </div>
        </div>
      </div>
    `;

    try {
      await sendEmail(
        complaint.citizenEmail,
        `✅ Su reporte GAMC [${complaint.code}] ha sido atendido y resuelto`,
        `Su reporte ${complaint.code} ha sido resuelto. Consulte los detalles aquí: ${trackingLink}`,
        html
      );
    } catch (e: any) {
      console.warn('[ComplaintService] No se pudo enviar el correo de resolución:', e.message);
    }
  }

  async getPublicStatus(code: string): Promise<any | null> {
    const cleanCode = code ? code.trim().toUpperCase() : '';
    let complaint = await this.repo.findOne({
      where: { code: cleanCode },
      relations: ['category', 'category.unit', 'location', 'images']
    });

    if (!complaint && code) {
      complaint = await this.repo.findOne({
        where: { code: code.trim() },
        relations: ['category', 'category.unit', 'location', 'images']
      });
    }

    if (!complaint) return null;

    const result: any = {
      code: complaint.code,
      title: complaint.title || complaint.incident,
      status: complaint.status,
      risk: complaint.risk,
      registerDate: complaint.registerDate,
      updateDate: complaint.updateDate,
      incident: complaint.incident || complaint.title,
      address: complaint.address,
      categoryName: complaint.category?.name ?? null,
      areaName: complaint.category?.unit?.name ?? null,
      distrito: complaint.location?.district ?? null,
      comuna: complaint.location?.deputtyMajor ?? null,
      citizenEmail: complaint.citizenEmail,
      notifyEmail: complaint.notifyEmail,
      satisfactionRating: complaint.satisfactionRating,
      reopenReason: complaint.reopenReason,
      reopenStatus: complaint.reopenStatus || 'NONE',
      reopenResolution: complaint.reopenResolution,
    };

    // Datos de resolución solo si está resuelta
    if (complaint.status === 'Resuelta' || complaint.status === 'Atendida') {
      result.technicalNotes = complaint.technicalNotes;
      result.resolutionResult = complaint.resolutionResult;
      result.finishTime = complaint.finishTime;
    }

    if (complaint.images) {
      result.imagesBefore = complaint.images.filter(img => img.type === 'BEFORE').map(img => img.url);
      result.imagesAfter  = complaint.images.filter(img => img.type === 'AFTER').map(img => img.url);
    }

    return result;
  }

  async updateStatus(idOrCode: number | string, status: string, userId: number): Promise<Complaint|null> {
    const param = String(idOrCode).trim();
    const isNumeric = !isNaN(Number(param));
    const complaint = await this.repo.findOne({
      where: isNumeric ? { id: Number(param) } : { code: param.toUpperCase() }
    });
    if (!complaint) return null;
    const oldStatus = complaint.status;
    complaint.status = status;
    const authUserId = userId || 1;
    const user = await this.userRepo.findOneBy({ id: authUserId });
    if (user) complaint.editBy = user;

    complaint.updateDate = new Date();
    const saved = await this.repo.save(complaint);

    if (status === 'Resuelta' && oldStatus !== 'Resuelta' && saved.notifyEmail && saved.citizenEmail) {
      this.sendResolutionNotification(saved);
    }

    return saved;
  }

  async rateComplaint(code: string, rating: number): Promise<Complaint | null> {
    const complaint = await this.repo.findOneBy({ code: code.trim().toUpperCase() });
    if (!complaint) return null;
    complaint.satisfactionRating = Number(rating);
    return await this.repo.save(complaint);
  }

  async requestReopen(code: string, reason: string): Promise<Complaint | null> {
    const complaint = await this.repo.findOneBy({ code: code.trim().toUpperCase() });
    if (!complaint) return null;

    complaint.reopenReason = reason.trim();
    complaint.reopenStatus = 'REQUESTED';
    const saved = await this.repo.save(complaint);

    try {
      const historyService = new ComplaintHistoryService();
      await historyService.create({
        complaintId: saved.id,
        description: `El ciudadano solicitó la reapertura del caso por disconformidad. Motivo: ${reason.trim()}`,
        tipo: 'solicitud_reapertura',
        userId: 1,
      });
    } catch (e: any) {
      console.warn('[ComplaintService] No se pudo crear el historial de reapertura:', e.message);
    }

    return saved;
  }

  async evaluateReopen(id: number, action: 'APPROVE' | 'REJECT', note: string, operatorUserId: number): Promise<Complaint | null> {
    const complaint = await this.repo.findOneBy({ id });
    if (!complaint) return null;

    const historyService = new ComplaintHistoryService();

    if (action === 'APPROVE') {
      complaint.status = 'En proceso';
      complaint.reopenStatus = 'APPROVED';
      const saved = await this.repo.save(complaint);

      try {
        await historyService.create({
          complaintId: saved.id,
          description: `Solicitud de reapertura APROBADA por el operador. ${note ? 'Nota: ' + note : ''}`,
          tipo: 'reapertura_aprobada',
          userId: operatorUserId || 1,
        });
      } catch (e: any) {
        console.warn('[ComplaintService] No se pudo guardar el historial:', e.message);
      }

      if (saved.notifyEmail && saved.citizenEmail) {
        const landingUrl = process.env.LANDING_URL || 'http://localhost:5174';
        const trackingLink = `${landingUrl}#consultar?code=${saved.code}`;
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="background-color: #0284c7; padding: 16px; border-radius: 8px 8px 0 0; text-align: center; color: white;">
              <h2 style="margin: 0; font-size: 20px;">Gobierno Autónomo Municipal de Cochabamba</h2>
              <p style="margin: 4px 0 0 0; font-size: 14px;">Reapertura de Caso Aprobada</p>
            </div>
            <div style="padding: 24px;">
              <p>Hola <strong>${saved.names}</strong>:</p>
              <p>Le informamos que su solicitud de reapertura para el reporte <strong>${saved.code}</strong> ha sido <strong>APROBADA</strong>.</p>
              <p>Una nueva cuadrilla técnica inspeccionará la zona y continuará con los trabajos correspondientes.</p>
              ${note ? `<p style="background-color: #f0f9ff; padding: 12px; border-radius: 6px; font-size: 13px;"><strong>Observación técnica:</strong> ${note}</p>` : ''}
              <div style="text-align: center; margin: 24px 0;">
                <a href="${trackingLink}" style="background-color: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Ver Estado del Caso</a>
              </div>
            </div>
          </div>
        `;
        try {
          await sendEmail(
            saved.citizenEmail,
            `🔄 Su denuncia [${saved.code}] ha sido reabierta`,
            `Su denuncia ${saved.code} ha sido reabierta. Una nueva cuadrilla inspeccionará la zona.`,
            html
          );
        } catch (e: any) {
          console.warn('[ComplaintService] Error al enviar correo de reapertura aprobada:', e.message);
        }
      }

      return saved;
    } else {
      complaint.status = 'Resuelta';
      complaint.reopenStatus = 'REJECTED';
      complaint.reopenResolution = note;
      const saved = await this.repo.save(complaint);

      try {
        await historyService.create({
          complaintId: saved.id,
          description: `Solicitud de reapertura RECHAZADA por el operador. Motivo técnico: ${note}`,
          tipo: 'reapertura_rechazada',
          userId: operatorUserId || 1,
        });
      } catch (e: any) {
        console.warn('[ComplaintService] No se pudo guardar el historial:', e.message);
      }

      if (saved.notifyEmail && saved.citizenEmail) {
        const landingUrl = process.env.LANDING_URL || 'http://localhost:5174';
        const trackingLink = `${landingUrl}#consultar?code=${saved.code}`;
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="background-color: #d97706; padding: 16px; border-radius: 8px 8px 0 0; text-align: center; color: white;">
              <h2 style="margin: 0; font-size: 20px;">Gobierno Autónomo Municipal de Cochabamba</h2>
              <p style="margin: 4px 0 0 0; font-size: 14px;">Evaluación de Solicitud de Reapertura</p>
            </div>
            <div style="padding: 24px;">
              <p>Hola <strong>${saved.names}</strong>:</p>
              <p>Le informamos que su solicitud de reapertura para el reporte <strong>${saved.code}</strong> fue evaluada y <strong>RECHAZADA</strong> tras la verificación de los antecedentes.</p>
              <p style="background-color: #fffbeb; border: 1px solid #fef3c7; padding: 12px; border-radius: 6px; font-size: 13px; color: #92400e;">
                <strong>Motivo de la resolución:</strong> ${note}
              </p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${trackingLink}" style="background-color: #d97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Ver Detalle</a>
              </div>
            </div>
          </div>
        `;
        try {
          await sendEmail(
            saved.citizenEmail,
            `ℹ️ Actualización sobre su solicitud de reapertura [${saved.code}]`,
            `La solicitud de reapertura para el reporte ${saved.code} fue rechazada. Motivo: ${note}`,
            html
          );
        } catch (e: any) {
          console.warn('[ComplaintService] Error al enviar correo de reapertura rechazada:', e.message);
        }
      }

      return saved;
    }
  }

  async arriveAtSite(
    complaintId: number,
    userId: number,
    latitude: number,
    longitude: number
  ): Promise<Complaint> {
    const complaint = await this.repo.findOne({
      where: { id: complaintId },
      relations: ['category']
    });

    if (!complaint) throw new Error('Denuncia no encontrada');

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (user) complaint.attendedBy = user;

    complaint.status = 'En proceso';
    complaint.arrivalTime = new Date();
    if (!isNaN(Number(latitude)) && !isNaN(Number(longitude))) {
      complaint.arrivalLocation = (() => `ST_SetSRID(ST_MakePoint(${Number(longitude)}, ${Number(latitude)}), 4326)`) as any;
    }

    const savedComplaint = await this.repo.save(complaint);

    try {
      const historyService = new ComplaintHistoryService();
      await historyService.create({
        complaintId: savedComplaint.id,
        description: 'El técnico ha marcado su llegada al sitio.',
        tipo: 'intervencion',
        userId: userId || 1
      });
    } catch (e: any) {
      console.warn('[ComplaintService] No se pudo guardar el historial de llegada:', e.message);
    }

    return savedComplaint;
  }

  async resolveComplaint(
    complaintId: number,
    userId: number,
    data: {
      technicalNotes?: string;
      materialsUsed?: string;
      resolutionResult?: string;
      finishTime?: string | Date;
    },
    files?: Express.Multer.File[] | Express.Multer.File
  ): Promise<Complaint> {
    const complaint = await this.repo.findOne({
      where: { id: complaintId },
      relations: ['category']
    });

    if (!complaint) throw new Error('Denuncia no encontrada');

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (user) complaint.attendedBy = user;

    complaint.status = 'Resuelta';
    if (data.technicalNotes !== undefined) complaint.technicalNotes = data.technicalNotes;
    if (data.materialsUsed !== undefined) complaint.materialsUsed  = data.materialsUsed;
    if (data.resolutionResult !== undefined) complaint.resolutionResult = data.resolutionResult;
    complaint.finishTime = data.finishTime ? new Date(data.finishTime) : new Date();

    const savedComplaint = await this.repo.save(complaint);

    const fileList = Array.isArray(files) ? files : files ? [files] : [];
    if (fileList.length > 0) {
      const imagesToSave = fileList.map((file) => {
        const photoUrl = file.filename.startsWith('/uploads/') ? file.filename : `/uploads/${file.filename}`;
        const img = new ComplaintImage();
        img.url = photoUrl;
        img.type = 'AFTER';
        img.complaint = savedComplaint;
        return img;
      });
      await this.imageRepo.save(imagesToSave);
    }

    try {
      const historyService = new ComplaintHistoryService();
      const historyData = {
        action: 'RESOLVED',
        resultado: savedComplaint.resolutionResult || 'Resuelto',
        notas: savedComplaint.technicalNotes || '',
        materiales: savedComplaint.materialsUsed || '',
        llegada: savedComplaint.arrivalTime,
        finalizacion: savedComplaint.finishTime,
        coordenadasLlegada: savedComplaint.arrivalLocation
      };

      await historyService.create({
        complaintId: savedComplaint.id,
        description: JSON.stringify(historyData),
        tipo: 'intervencion',
        userId: userId || 1
      });
    } catch (e: any) {
      console.warn('[ComplaintService] No se pudo guardar el historial de resolución:', e.message);
    }

    if (savedComplaint.notifyEmail && savedComplaint.citizenEmail) {
      this.sendResolutionNotification(savedComplaint).catch(err => {
        console.error('Error enviando email en segundo plano:', err);
      });
    }

    return savedComplaint;
  }

  async assignComplaint(
    complaintId: number,
    technicianId: number,
    operatorUserId: number,
    observation?: string
  ): Promise<Complaint> {
    const complaint = await this.repo.findOne({
      where: { id: complaintId },
      relations: ['category', 'category.unit', 'location']
    });
    if (!complaint) throw new Error('Denuncia no encontrada');

    const technician = await this.userRepo.findOne({
      where: { id: technicianId },
      relations: ['role', 'unit']
    });
    if (!technician) throw new Error('El técnico seleccionado no existe o no se encuentra activo.');

    const operator = await this.userRepo.findOneBy({ id: operatorUserId });

    complaint.attendedBy = technician;
    complaint.status = 'En proceso';
    complaint.updateDate = new Date();
    if (operator) complaint.editBy = operator;

    const savedComplaint = await this.repo.save(complaint);

    // Enviar notificación Web Push al técnico si tiene suscripciones registradas
    try {
      const pushRepo = AppDataSource.getRepository(PushSubscription);
      const subscriptions = await pushRepo.find({ where: { userId: technicianId } });
      if (subscriptions && subscriptions.length > 0) {
        const payload = JSON.stringify({
          title: 'Nueva Denuncia Asignada',
          body: `Caso ${savedComplaint.code || `#${savedComplaint.id}`}: ${savedComplaint.title || savedComplaint.incident}`,
          icon: '/icon-192.png',
          url: '/tecnico'
        });

        await Promise.all(
          subscriptions.map(async (sub) => {
            try {
              await webpush.sendNotification(
                {
                  endpoint: sub.endpoint,
                  keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                  }
                },
                payload
              );
            } catch (err: any) {
              console.warn('[WebPush] Error enviando notificación:', err.message);
              if (err.statusCode === 404 || err.statusCode === 410) {
                await pushRepo.delete(sub.id);
              }
            }
          })
        );
      }
    } catch (pushErr: any) {
      console.warn('[ComplaintService] Error procesando Web Push:', pushErr.message);
    }

    try {
      const historyService = new ComplaintHistoryService();
      const techName = [technician.names, technician.lastname].filter(Boolean).join(' ');
      const desc = observation && observation.trim()
        ? `Denuncia asignada al técnico ${techName} (ID: ${technician.id}). Instrucciones: ${observation.trim()}`
        : `Denuncia asignada al técnico ${techName} (ID: ${technician.id}).`;

      await historyService.create({
        complaintId: savedComplaint.id,
        description: desc,
        tipo: 'asignacion',
        userId: operatorUserId || 1
      });
    } catch (e: any) {
      console.warn('[ComplaintService] No se pudo crear el historial de asignación:', e.message);
    }

    return savedComplaint;
  }
}

