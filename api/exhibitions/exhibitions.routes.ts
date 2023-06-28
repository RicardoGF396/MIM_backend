import { Router } from "express";
import {
  createExhibition,
  editExhibition,
  getExhibitions,
  getExhibition,
  deleteExhibition,
} from "./exhibitions.controller";
//Verifica que el usuario este autorizado para seguir con el siguiente middleware
import { auth } from "../../middlewares/auth";
//Permite subir imágenes a la carpeta local
import {upload} from "../../utils/fileUpload";

const router = Router();

router.get("/", getExhibitions);
router.get("/:id", getExhibition);
router.post("/", auth, upload, createExhibition);
router.put("/:id", auth, upload, editExhibition);
router.delete("/:id", auth, deleteExhibition);

export default router;
