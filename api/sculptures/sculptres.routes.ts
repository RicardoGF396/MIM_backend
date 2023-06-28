import { Router } from "express";
import multer from "multer";
import path from "path";
import {
  createSculpture,
  deleteSculpture,
  editSculpture,
  getSculpture,
  getSculptures,
} from "./sculptures.controller";
//Verifica que el usuario este autorizado para seguir con el siguiente middleware
import { auth } from "../../middlewares/auth";
//Permite subir imágenes a la carpeta local
import { upload } from "../../utils/fileUpload";

const router = Router();

router.get("/", getSculptures);
router.get("/:id", getSculpture);
router.post("/", auth, upload, createSculpture);
router.put("/:id", auth, upload, editSculpture);
router.delete("/:id", auth, deleteSculpture);

export default router;
