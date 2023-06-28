import { Request, Response } from "express";
import { pool } from "../../db";
import { Garden } from "../../models/Garden";
import { DB_URL } from "../../config";
import { Image } from "../../models/Image";
import { ResultSetHeader } from "mysql2";
import fs from "fs";

export const getGardens = async (req: Request, res: Response) => {
  try {
    const gardens = await pool.query("SELECT * FROM gardens");
    const result: Garden[] = JSON.parse(JSON.stringify(gardens[0]));
    for (let i in result) {
      const gardens_images = await pool.query(
        `
      SELECT id, CONCAT('${DB_URL}/upload', image ) as url
      FROM gardens_gallery WHERE garden_id = ?
            `,
        [result[i].id]
      );
      //Insertamos las imágenes en una nueva propiedad llamada images
      //que contendrá el objeto
      result[i]["images"] = JSON.parse(JSON.stringify(gardens_images[0]));
    }
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      error: error,
    });
  }
};

export const createGarden = async (req: Request, res: Response) => {
  const { name, description }: Garden = req.body;
  const images = req.files! as Image[];
  try {
    //Creamos nuevo registro
    const garden = await pool.query(
      "INSER INTO gardens (name, description) VALUES (?,?)",
      [name, description]
    );

    //Obtenemos id de registro creado
    const garden_id: number = (garden[0] as ResultSetHeader).insertId;

    //Iteramos en las imágenes y añadimos a la base de datos
    for (const image of images) {
      await pool.query(
        "INSERT INTO gardends_gallery (image, garden_id) VALUES (?,?)",
        [image.fieldname, garden_id]
      );
    }

    const fetchGarden = await pool.query("SELECT * FROM gardens WHERE id = ?", [
      garden_id,
    ]);

    const fetchImages = await pool.query(
      `SELECT id, CONCAT('${DB_URL}/upload', image) as url FROM gardens_gallery WHERE garden_id = ?`,
      [garden_id]
    );

    let result = JSON.parse(JSON.stringify(fetchGarden[0]));
    let parseImages = JSON.parse(JSON.stringify(fetchImages[0]));
    result[0]["images"] = parseImages;
    res.json(result);
  } catch (error) {
    return res.status(500).json({
      error: error,
    });
  }
};

export const editGarden = async (req: Request, res: Response) => {
  const garden_id = req.params.id;
  const { name, description }: Garden = req.body;
  const images = req.files as Image[];
  try {
    //Actualizar registro
    await pool.query(
      "UPDATE gardens SET name = ?, description = ? WHERE id = ?",
      [name, description, garden_id]
    );
    //Eliminar las imágenes locales
    await deleteGardensImages(parseInt(garden_id));
    //Eliminar las imágenes de la base de datos
    await deleteImagesFromDB(parseInt(garden_id));
    // Insertar las nuevas imágenes a la base de datos
    for (const image of images) {
      await pool.query(
        "INSERT INTO gardens_gallery (name, garden_id) VALUES (?,?)",
        [image.filename, garden_id]
      );
    }

    const fetchGarden = await pool.query("SELECT * FROM gardens WHERE id = ?", [
      garden_id,
    ]);

    const fetchImages = await pool.query(
      `SELECT id, CONCAT('${DB_URL}/upload/',image) AS url FROM gardens_gallery WHERE garden_id = ? `,
      [garden_id]
    );
    let garden_result = JSON.parse(JSON.stringify(fetchGarden[0]));
    let garden_images = JSON.parse(JSON.stringify(fetchImages[0]));
    garden_result[0]["images"] = garden_images;
    res.json(garden_result);
  } catch (error) {
    res.status(500).json({
      error: error,
    });
  }
};

// Borrar imágenes de base de datos
export const deleteImagesFromDB = async (garden_id: number, res?: Response) => {
  try {
    await pool.query("DELETE FROM gardens_gallery WHERE id = ?", [garden_id]);
  } catch (error) {
    res!.status(500).json({
      error: `Error deleting exhibitions images from DB: ${error}`,
    });
  }
};

// Borrar imágenes de directorio local
export const deleteGardensImages = async (
  garden_id: number,
  res?: Response
) => {
  try {
    const fetchImages = await pool.query(
      "SELECT image FROM gardens_gallery WHERE id = ?",
      [garden_id]
    );
    const images = JSON.parse(JSON.stringify(fetchImages[0]));
    for (const image of images) {
      const imagePath = `upload/images/${image.image}`;
      fs.unlinkSync(imagePath);
    }
  } catch (error) {
    res!.status(500).json({
      error: `Error deleting exhibitions images from local: ${error}`,
    });
  }
};

export const deleteGarden = async (req: Request, res: Response) => {
  try {
    const garden_id = req.params.id;
    //Eliminar imágenes de directorio local
    await deleteGardensImages(parseInt(garden_id));
    //Eliminar imágenes de la base de datos
    await deleteImagesFromDB(parseInt(garden_id));
    //Eliminar registo
    await pool.query("DELETE FROM gardens WHERE id = ?", [garden_id]);
    res.status(200).json({
      message: "Deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      error: "Error deleting garden: " + error,
    });
  }
};

export const getGarden = async (req: Request, res: Response) => {
  try {
    const garden_id = req.params.id;
    const garden = await pool.query("SELECT * FROM gardens WHERE id = ?", [
      garden_id,
    ]);
    const garden_images = await pool.query(
      `SELECT id, CONCAT('${DB_URL}'/upload/), images AS url FROM gardens_gallery WHERE garden_id = ?`,
      [garden_id]
    );
    const garden_result = JSON.parse(JSON.stringify(garden[0]));
    const images_result = JSON.parse(JSON.stringify(garden_images[0]));
    garden_result[0]["images"] = images_result;

    res.json(garden_result);
  } catch (error) {
    return res.status(500).json({
      message: error,
    });
  }
};
