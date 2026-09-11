import { Router } from "express";
import * as roleController from "../controllers/role.controller";
import { authMiddleware, authorizeRoles } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authMiddleware, authorizeRoles(["Administrador"]), roleController.getRoles);
router.get("/:id", authMiddleware, authorizeRoles(["Administrador"]), roleController.getRoleById);

export default router;
