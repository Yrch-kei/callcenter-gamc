import { Request, Response } from "express";
import { RoleService } from "../services/role.service";

const roleService = new RoleService();

export const getRoles = async (_req: Request, res: Response): Promise<void> => {
  try {
    const roles = await roleService.getAll();
    res.status(200).json(roles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getRoleById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const role = await roleService.getById(Number(id));
    if (!role) {
      res.status(404).json({ error: "Role not found" });
      return;
    }

    res.status(200).json(role);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
