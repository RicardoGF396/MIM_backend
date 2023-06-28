import { Request, Response } from "express";
import { pool } from "../../db";
import { Sculpture } from "../../models/Sculpture";
import { DB_URL } from "../../config";
import { Image } from "../../models/Image";
import { ResultSetHeader } from "mysql2";
import fs from "fs";

export const getSculptures = async (req: Request, res: Response) => {
  try {
    const sculptures = await pool.query("SELECT * FROM sculptures");
    const result: Sculpture[] = JSON.parse(JSON.stringify(sculptures[0]));
    for (let i in result) {
      const sculptures_images = await pool.query(
        `SELECT id,CONCAT('${DB_URL}/upload/',image) as url
            FROM sculptures_gallery WHERE sculpture_id = ?`,
        [result[i].id]
      );
      result[i]["images"] = JSON.parse(JSON.stringify(sculptures_images[0]));
    }
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      error: error,
    });
  }
};

export const createSculpture = async (req: Request, res: Response) => {
  const { name, author, age, collection, place }: Sculpture = req.body;
  /* Siempre se van a recibir las imágenes es validado por front */
  const images = req.files! as Image[];
  try {
    const sculpture = await pool.query(
      "INSERT INTO sculptures (name, author, age, collection, place) VALUES (?,?,?,?,?)",
      [name, author, age, collection, place]
    );

    //Obtenemos el ID del nuevo registro creado
    const sculpture_id: Number = (sculpture[0] as ResultSetHeader).insertId;
    //Registramos las imágenes en la base de datos
    for (const image of images) {
      await pool.query(
        "INSERT INTO sculptures_gallery (image, sculpture_id) VALUES (?,?)",
        [image.filename, sculpture_id]
      );
    }
    //De aquí para abajo revisamos que se haya creado correctamente todo
    const fetchSculptures = await pool.query(
      "SELECT * FROM sculptures WHERE id = ?",
      [sculpture_id]
    );
    const fetchImages = await pool.query(
      `SELECT id,CONCAT('${DB_URL}/upload/',image) as url FROM sculptures_gallery WHERE sculpture_id = ?`,
      [sculpture_id]
    );

    let sculpture_result = JSON.parse(JSON.stringify(fetchSculptures[0]));
    let images_result = JSON.parse(JSON.stringify(fetchImages[0]));
    sculpture_result[0]["images"] = images_result;
    res.json(sculpture_result);
  } catch (error) {
    return res.status(500).json({
      error: error,
    });
  }
};

export const editSculpture = async (req: Request, res: Response) => {
  try {
    const { name, author, age, collection, place }: Sculpture = req.body;
    const sculpture_id = parseInt(req.params.id);
    const images = req.files as Image[];

    await pool.query(
      "UPDATE sculptures SET name = ?, author = ?, age = ?, collection = ?, place = ? WHERE id = ?",
      [name, author, age, collection, place, sculpture_id]
    );
    //Eliminamos las imágenes anteriores
    await deleteSculpturesImages(sculpture_id);

    //Elimninamos imágenes de DB
    await deleteImagesFromDB(sculpture_id);
    console.log(images);
    //Registramos las nuevas imágenes
    for (const image of images) {
      await pool.query(
        "INSERT INTO sculptures_gallery (image, sculpture_id) VALUES (?,?)",
        [image.filename, sculpture_id]
      );
    }

    const fetchSculptures = await pool.query(
      "SELECT * FROM sculptures WHERE id = ?",
      [sculpture_id]
    );

    const fetchImages = await pool.query(
      `SELECT id, CONCAT('${DB_URL}/upload/',image) AS url FROM sculptures_gallery WHERE sculpture_id = ?`,
      [sculpture_id]
    );

    let result = JSON.parse(JSON.stringify(fetchSculptures[0]));
    let parseImages = JSON.parse(JSON.stringify(fetchImages[0]));
    result[0]["images"] = parseImages;
    //Aquí muestra el resultado creado por completo
    res.json(result);
  } catch (error) {
    return res.status(500).json({
      error: error,
    });
  }
};

// Eliminar imágenes de la base de datos
export const deleteImagesFromDB = async (sculpture_id: number) => {
  try {
    await pool.query("DELETE FROM sculptures_gallery WHERE sculpture_id = ?", [
      sculpture_id,
    ]);
  } catch (error) {
    console.log("Error: " + error);
  }
};

// Eliminar las imágenes existentes de la exhibición de forma local
export const deleteSculpturesImages = async (sculpture_id: number) => {
  try {
    const fetchImages = await pool.query(
      "SELECT image FROM sculptures_gallery WHERE sculpture_id = ?",
      [sculpture_id]
    );

    let images = JSON.parse(JSON.stringify(fetchImages[0]));
    for (const image of images) {
      const imagePath = `upload/images/${image.image}`;

      fs.unlinkSync(imagePath);
    }
  } catch (error) {
    console.log("Error: " + error);
  }
};

export const deleteSculpture = async (req: Request, res: Response) => {
  const sculpture_id = parseInt(req.params.id);

  try {
    // Delete images from local directory
    await deleteSculpturesImages(sculpture_id);
    // Delete images from DB
    await deleteImagesFromDB(sculpture_id);
    // Delete sculpture
    await pool.query("DELETE FROM sculptures WHERE id = ?", [sculpture_id]);
    res.status(200).json({
      message: "Deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      error: "Error deleting exhibition: " + error,
    });
  }
};

export const getSculpture = async (req: Request, res: Response) => {
  const sculpture_id = req.params.id;

  try {
    const exhibition = await pool.query(
      "SELECT * FROM sculptures WHERE id = ?",
      [sculpture_id]
    );

    const sculpture_images = await pool.query(
      `SELECT id,CONCAT('${DB_URL}/upload/',image) as url FROM sculptures_gallery WHERE sculpture_id = ?`,
      [sculpture_id]
    );

    let result = JSON.parse(JSON.stringify(exhibition[0]));
    let parseImages = JSON.parse(JSON.stringify(sculpture_images[0]));
    result[0]["images"] = parseImages;

    res.json(result);
  } catch (error) {
    return res.status(500).json({
      error: "Error getting sculptures: " + error,
    });
  }
};
