import { pool } from "../../db";
import { Request, Response } from "express";
import { Exhibition } from "../../models/Exhibition";
import { ResultSetHeader } from "mysql2";
import { Image } from "../../models/Image";
import { DB_URL } from "../../config";
import fs from "fs";

export const getExhibitions = async (req: Request, res: Response) => {
  try {
    const exhibitions = await pool.query("SELECT * FROM exhibitions");
    //Es necesario hacer esto para poder interacturar con el objeto obtenido
    const result: Exhibition[] = JSON.parse(JSON.stringify(exhibitions[0]));
    for (let i in result) {
      const exhibitions_images = await pool.query(
        `SELECT id,CONCAT('${DB_URL}/upload/',image) as url
                    FROM exhibitions_gallery WHERE exhibition_id = ?`,
        [result[i].id]
      );
      result[i]["images"] = JSON.parse(JSON.stringify(exhibitions_images[0]));
    }
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      error: error,
    });
  }
};

export const getExhibitionsByFilter = async (req: Request, res: Response) => {
  const { itemList, order, operator } = req.body;
  let exhibitions: Array<object>;
  try {
    if (operator) {
      exhibitions = await pool.query(
        `
          SELECT * FROM exhibitions WHERE room IN (?) 
          AND end_date ${operator} CURDATE()          
          ORDER BY start_date ${order} ;
      `,
        [itemList]
      );
    } else {
      exhibitions = await pool.query(
        `
          SELECT * FROM exhibitions WHERE room 
          IN (?)          
          ORDER BY start_date ${order} ;
      `,
        [itemList]
      );
    }
    const result = exhibitions[0];
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      error: error,
    });
  }
};

export const createExhibition = async (req: Request, res: Response) => {
  const {
    name,
    participants,
    description,
    start_date,
    end_date,
    room,
    virtual_route,
  }: Exhibition = JSON.parse(req.body.exhibition);
  /* Siempre se van a recibir las imágenes es validado por front */
  const images = req.files as Image[];
  console.log(JSON.parse(req.body.exhibition))
  //console.log(images)
  try {
    const exhibition = await pool.query(
      "INSERT INTO exhibitions (name, participants, description, start_date, end_date, virtual_route, room) VALUES (?,?,?,?,?,?,?)",
      [
        name,
        participants,
        description,
        start_date,
        end_date,
        virtual_route,
        room,
      ]
    );
    //Obtenemos el ID del nuevo registro creado
    const exhibition_id: Number = (exhibition[0] as ResultSetHeader).insertId;
      console.log(exhibition_id);
      
    // Iteramos en las imágenes para añadirlas a la base de datos
    for (const image of images) {
      await pool.query(
        "INSERT INTO exhibitions_gallery (image, exhibition_id) VALUES (?,?)",
        [image.filename, exhibition_id]
      );
    }
    //De aquí para abajo revisamos que se haya creado correctamente todo
    const fetchExhibition = await pool.query(
      "SELECT * FROM exhibitions WHERE id = ?",
      [exhibition_id]
    );
    const fetchImages = await pool.query(
      `SELECT id,CONCAT('${DB_URL}/upload/',image) as url FROM exhibitions_gallery WHERE exhibition_id = ?`,
      [exhibition_id]
    );

    let exhibition_result = JSON.parse(JSON.stringify(fetchExhibition[0]));
    let images_result = JSON.parse(JSON.stringify(fetchImages[0]));
    exhibition_result[0]["images"] = images_result;
    res.json(exhibition_result);
  } catch (error) {
    return res.status(500).json({
      error: error,
    });
  }
};

export const editExhibition = async (req: Request, res: Response) => {
  const exhibition_id = req.params.id;
  const {
    name,
    participants,
    description,
    start_date,
    end_date,
    virtual_route,
  }: Exhibition = req.body;
  const images = req.files as Image[];

  try {
    // Actualizar exhibición
    await pool.query(
      "UPDATE exhibitions SET name = ?, participants = ?, description = ?, start_date = ?, end_date = ?, virtual_route = ? WHERE id = ?",
      [
        name,
        participants,
        description,
        start_date,
        end_date,
        virtual_route,
        exhibition_id,
      ]
    );

    //Eliminar imágenes locales
    await deleteExhibitionImages(parseInt(exhibition_id));

    // Eliminar las imágenes existentes de la exhibición en la base de datos
    await deleteImagesFromDB(parseInt(exhibition_id));

    // Insertar las nuevas imágenes de la exhibición
    for (const image of images) {
      await pool.query(
        "INSERT INTO exhibitions_gallery (image, exhibition_id) VALUES (?, ?)",
        [image.filename, exhibition_id]
      );
    }

    //De aquí para abajo revisamos que se haya creado correctamente todo
    const fetchExhibition = await pool.query(
      "SELECT * FROM exhibitions WHERE id = ?",
      [exhibition_id]
    );

    const fetchImages = await pool.query(
      `SELECT id, CONCAT('${DB_URL}/upload/',image) AS url FROM exhibitions_gallery WHERE exhibition_id = ?`,
      [exhibition_id]
    );

    let result = JSON.parse(JSON.stringify(fetchExhibition[0]));
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
const deleteImagesFromDB = async (exhibition_id: number, res?: Response) => {
  try {
    await pool.query(
      "DELETE FROM exhibitions_gallery WHERE exhibition_id = ?",
      [exhibition_id]
    );
  } catch (error) {
    res!.status(500).json({
      error: `Error deleting exhibitions images from DB: ${error}`,
    });
  }
};

// Eliminar las imágenes existentes de la exhibición de forma local
const deleteExhibitionImages = async (
  exhibition_id: number,
  res?: Response
) => {
  try {
    const fetchImages = await pool.query(
      "SELECT image FROM exhibitions_gallery WHERE exhibition_id = ?",
      [exhibition_id]
    );

    let images = JSON.parse(JSON.stringify(fetchImages[0]));
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

export const deleteExhibition = async (req: Request, res: Response) => {
  const exhibition_id = parseInt(req.params.id);
  console.log(exhibition_id)
  try {
    // Delete images from local directory
    await deleteExhibitionImages(exhibition_id);
    // Delete images from DB
    await deleteImagesFromDB(exhibition_id);
    // Delete exhibition
    await pool.query("DELETE FROM exhibitions WHERE id = ?", [exhibition_id]);
    res.status(200).json({
      message: "Deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      error: "Error deleting exhibition: " + error,
    });
  }
};

export const getExhibition = async (req: Request, res: Response) => {
  const exhibition_id = req.params.id;
  try {
    const exhibition = await pool.query(
      "SELECT * FROM exhibitions WHERE id = ?",
      [exhibition_id]
    );

    const exhibition_images = await pool.query(
      `SELECT id,CONCAT('${DB_URL}/upload/',image) as url FROM exhibitions_gallery WHERE exhibition_id = ?`,
      [exhibition_id]
    );

    let result = JSON.parse(JSON.stringify(exhibition[0]));
    let parseImages = JSON.parse(JSON.stringify(exhibition_images[0]));
    result[0]["images"] = parseImages;

    res.json(result);
  } catch (error) {
    return res.status(500).json({
      error: "Error getting exhibition: " + error,
    });
  }
};
