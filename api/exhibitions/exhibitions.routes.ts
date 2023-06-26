import { Router } from "express";
import multer from "multer";
import path from "path";
import {
  createExhibition,
  editExhibition,
  getExhibitions,
  getExhibition,
  deleteExhibition,
} from "./exhibitions.controller";

/* Se asigna la ruta a guardar de las imágenes */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'upload/images')
  },
  filename: (req, file, cb) => {
      return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
  }
});
const upload = multer({
  storage: storage,
}).array('images');

const router = Router();

router.get("/exhibitions", getExhibitions);
router.post("/create_exhibition", upload, createExhibition);
router.put("/edit_exhibition/:id", upload, editExhibition);
router.get("/get_exhibition/:id", getExhibition);
router.delete("/delete_exhibition/:id", deleteExhibition);

export default router;
