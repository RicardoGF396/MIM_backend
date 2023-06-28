import { Router } from "express";
import {
  createGarden,
  deleteGarden,
  editGarden,
  getGarden,
  getGardens,
} from "./gardens.controller";
//Verifica que el usuario este autorizado para seguir con el siguiente middleware
import { auth } from "../../middlewares/auth";
//Permite subir imágenes a la carpeta local
import { upload } from "../../utils/fileUpload";

const router = Router();

router.get("/", getGardens);
router.get("/:id", getGarden);
router.post("/", auth, upload, createGarden);
router.put("/:id", auth, upload, editGarden);
router.delete("/:id", auth, deleteGarden);

export default router;
