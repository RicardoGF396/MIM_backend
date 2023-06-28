import { Router } from "express";
import {
  createMural,
  deleteMural,
  editMural,
  getMural,
  getMurals,
} from "./murals.controller";
//Verifica que el usuario este autorizado para seguir con el siguiente middleware
import { auth } from "../../middlewares/auth";
//Permite subir imágenes a la carpeta local
import { upload } from "../../utils/fileUpload";

const router = Router();

router.get("/", getMurals);
router.get("/:id", getMural);
router.post("/", auth, upload, createMural);
router.put("/:id", auth, upload, editMural);
router.delete("/:id", auth, deleteMural);

export default router;
