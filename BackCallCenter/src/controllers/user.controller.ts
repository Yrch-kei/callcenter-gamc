import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

const userService = new UserService();

export const createUser = async (req: Request, res: Response) : Promise<void>  => {
  try {
    const authUserId = req.user?.id;
    const user = await userService.createUser(req.body, authUserId!);
    res.status(201).json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message +' - ' + error.sqlMessage });
  }
};

export const createMandated = async (req: Request, res: Response) : Promise<void>  => {
  try {
    const authUserId = req.user?.id;
    const user = await userService.createMandated(req.body, authUserId!);
    res.status(201).json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message +' - ' + error.sqlMessage });
  }
};

export const getUsers = async (_req: Request, res: Response) : Promise<void>  => {
  try {
    const users = await userService.findAllUsers();
    res.status(200).json(users);
  } catch (error:any) {
    res.status(500).json({ error: error.message });
  }
};

export const getTechnicians = async (req: Request, res: Response): Promise<void> => {
  try {
    const unitId = req.query.unitId ? Number(req.query.unitId) : undefined;
    const technicians = await userService.findTechnicians(unitId);
    res.status(200).json(technicians);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserById = async (req: Request, res: Response) : Promise<void> => {
  try {
    const user = await userService.findUserById(Number(req.params.id));
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }
    res.status(200).json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getMandateds = async (_req: Request, res: Response) : Promise<void> => {
  try {
    const mandateds = await userService.findAllMandateds();
    res.status(200).json(mandateds);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getMandatedById = async (req: Request, res: Response) : Promise<void> => {
  try {
    const mandated = await userService.findMandatedById(Number(req.params.id));
    if (!mandated) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }
    res.status(200).json(mandated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req: Request, res: Response) : Promise<void> => {
  try {
    const authUserId = req.user?.id;
    const user = await userService.updateUser(Number(req.params.id), req.body, authUserId!);
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return; 
    }
    res.status(200).json(user);
  } catch (error : any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateMandated = async (req: Request, res: Response) : Promise<void> => {
  try {
    const authUserId = req.user?.id;
    const user = await userService.updateMandated(Number(req.params.id), req.body, authUserId!);
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return; 
    }
    res.status(200).json(user);
  } catch (error : any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) : Promise<void>  => {
  try {
    const authUserId = req.user?.id;
    await userService.deleteUser(Number(req.params.id), authUserId!);
    res.status(204).send();
  } catch (error : any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteMandated = async (req: Request, res: Response) : Promise<void>  => {
  try {
    const authUserId = req.user?.id;
    await userService.deleteMandated(Number(req.params.id), authUserId!);
    res.status(204).send();
  } catch (error : any) {
    res.status(500).json({ error: error.message });
  }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword, repeatNewPassword } = req.body;

    if (!currentPassword || !newPassword || !repeatNewPassword) {
      res.status(400).json({ message: 'Se requieren currentPassword, newPassword y repeatNewPassword' });
      return;
    }

    await userService.changePassword(userId!, currentPassword, newPassword, repeatNewPassword);
    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};