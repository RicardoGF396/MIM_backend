import { Request, Response } from "express";
import { DB_URL } from "../../config";
import { Mural } from "../../models/Mural";
import { pool } from "../../db";
import { Image } from "../../models/Image";
import { ResultSetHeader } from "mysql2";
import fs from "fs";

export const getMurals = async (req: Request, res: Response) => {
  try {
    //Obtenemos todos los murales
    const murals = await pool.query("SELECT * FROM murals");
    //Obtenemos todos los lugares
    const places = await pool.query("SELECT * FROM places");
    //Es necesario hacer esto para poder interacturar con el objeto obtenido
    const murals_result: Mural[] = JSON.parse(JSON.stringify(murals[0]));
    const places_result: Mural[] = JSON.parse(JSON.stringify(murals[0]));
    for (let mural in murals_result) {
      const murals_images = await pool.query(
        `SELECT id,CONCAT('${DB_URL}/upload/',image) as url
                        FROM murals_gallery WHERE mural_id = ?`,
        [murals_result[mural].id]
      );
      murals_result[mural]["images"] = JSON.parse(
        JSON.stringify(murals_images[0])
      );
    }
    for (let place in places_result) {
      const item = await pool.query("SELECT * FROM places WHERE mural_id = ?", [
        places_result[place].id,
      ]);
      murals_result[place]["places"] = JSON.parse(JSON.stringify(item[0]));
    }
    return res.json(murals_result);
  } catch (error) {
    return res.status(500).json({
      error: "Error getting murals: " + error,
    });
  }
};

export const createMural = async (req: Request, res: Response) => {
  const { name, places }: Mural = req.body;
  console.log(req.body);
  /* Siempre se van a recibir las imágenes es validado por front */
  const images = req.files! as Image[];
  try {
    const mural = await pool.query("INSERT INTO murals (name) VALUES (?)", [
      name,
    ]);
    //Obtenemos el ID del nuevo registro creado
    const mural_id: Number = (mural[0] as ResultSetHeader).insertId;

    // Iteramos en las imágenes para añadirlas a la base de datos
    for (const image of images) {
      await pool.query(
        "INSERT INTO murals_gallery (image, mural_id) VALUES (?,?)",
        [image.filename, mural_id]
      );
    }

    //Añadimos los lugares al que pertenece
    for (const place of places) {
      await pool.query(
        "INSERT INTO places (name, start_date, end_date, mural_id) VALUES (?,?,?,?)",
        [place.name, place.start_date, place.end_date, mural_id]
      );
    }

    //De aquí para abajo revisamos que se haya creado correctamente todo
    const fetchMurals = await pool.query("SELECT * FROM murals WHERE id = ?", [
      mural_id,
    ]);
    const fetchImages = await pool.query(
      `SELECT id,CONCAT('${DB_URL}/upload/',image) as url FROM murals_gallery WHERE mural_id = ?`,
      [mural_id]
    );

    const fetchPlaces = await pool.query(
      `SELECT * FROM places WHERE mural_id = ?`,
      [mural_id]
    );

    let mural_result = JSON.parse(JSON.stringify(fetchMurals[0]));
    let images_result = JSON.parse(JSON.stringify(fetchImages[0]));
    let places_result = JSON.parse(JSON.stringify(fetchPlaces[0]));

    mural_result[0]["images"] = images_result;
    mural_result[0]["places"] = places_result;
    res.json(mural_result);
  } catch (error) {
    return res.status(500).json({
      error: "Error creating mural" + error,
    });
  }
};

export const editMural = async (req: Request, res: Response) => {
  const mural_id = parseInt(req.params.id);
  const { name, places }: Mural = req.body;
  const images = req.files as Image[];
  
  try {
    //Actualizamos la tabla murals
    await pool.query("UPDATE murals SET name = ? WHERE id = ?", [name, mural_id]);

    //Actualizamos la tabla places
    await pool.query("DELETE FROM places WHERE mural_id = ?", [mural_id]);
    for (let place of places) {
      await pool.query(
        "INSERT INTO places (name, start_date, end_date, mural_id) VALUES(?,?,?,?)",
        [place.name, place.start_date, place.end_date, mural_id]
      );
    }

    //Eliminar imágenes locales
    await deleteMuralsImages(mural_id);

    //Eliminar las imágenes existentes de la exhibición en la base de datos
    await deleteImagesFromDB(mural_id);

    //Insertar las nuevas imágenes del mural
    for (const image of images) {
      await pool.query(
        "INSERT INTO murals_gallery (image, mural_id) VALUES(?,?)",
        [image.filename, mural_id]
      );
    }

    //De aquí para abajo revisamos que se haya creado correctamente todo
    const fetchMurals = await pool.query(
      "SELECT * FROM murals WHERE id = ?",
      [mural_id]
    );
    const fetchImages = await pool.query(
      `SELECT id,CONCAT('${DB_URL}/upload/',image) as url FROM murals_gallery WHERE mural_id = ?`,
      [mural_id]
    );

    const fetchPlaces = await pool.query("SELECT * FROM places WHERE mural_id = ?", [
      mural_id,
    ]);

    let mural_result = JSON.parse(JSON.stringify(fetchMurals[0]));
    let images_result = JSON.parse(JSON.stringify(fetchImages[0]));
    let places_result = JSON.parse(JSON.stringify(fetchPlaces[0]));

    mural_result[0]["images"] = images_result;
    mural_result[0]["places"] = places_result;
    res.json(mural_result);
  } catch (error) {
    return res.status(500).json({
      error: "Error trying to edit mural: " + error,
    });
  }
};

// Eliminar las imágenes existentes de la BD
export const deleteImagesFromDB = async (mural_id: number) => {
  try {
    await pool.query("DELETE FROM murals_gallery WHERE mural_id = ?", [
      mural_id,
    ]);
  } catch (error) {
    console.error(`Error deleting murals images from DB: ${error}`);
  }
};

// Eliminar las imágenes existentes de la exhibición de forma local
export const deleteMuralsImages = async (mural_id: number) => {
  try {
    const fetchImages = await pool.query(
      "SELECT image FROM murals_gallery WHERE mural_id = ?",
      [mural_id]
    );

    let images = JSON.parse(JSON.stringify(fetchImages[0]));
    for (const image of images) {
      const imagePath = `upload/images/${image.image}`;

      fs.unlinkSync(imagePath);
    }
  } catch (error) {
    console.error(`Error deleting murals images from local: ${error}`);
  }
};

export const deleteMural = async (req: Request, res: Response) => {
  try {
    const mural_id = parseInt(req.params.id);
    //Borramos imágenes locales
    await deleteMuralsImages(mural_id);
    //Borramos imágenes de la base de datos
    await deleteImagesFromDB(mural_id);
    //Borrar los luagres registrados
    await pool.query("DELETE FROM places WHERE mural_id = ?", [mural_id]);
    //Borramos el registro
    await pool.query("DELETE FROM murals WHERE id = ?", [mural_id]);
    res.status(200).json({
      message: "Deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error trying to delete mural: " + error,
    });
  }
};

export const getMural = async (req: Request, res: Response) => {
  try {
    const mural_id = req.params.id;
    const mural = await pool.query("SELECT * FROM murals WHERE id = ?", [
      mural_id,
    ]);
    const mural_images = await pool.query(
      `SELECT id,CONCAT('${DB_URL}/upload/',image) as url FROM murals_gallery WHERE mural_id = ?`,
      [mural_id]
    );
    const places = await pool.query("SELECT * FROM places WHERE mural_id = ?", [
      mural_id,
    ]);
    let mural_result = JSON.parse(JSON.stringify(mural[0]));

    let muralImagesResult = JSON.parse(JSON.stringify(mural_images[0]));
    let places_result = JSON.parse(JSON.stringify(places[0]));

    mural_result[0]["images"] = muralImagesResult;
    mural_result[0]["places"] = places_result;
    res.json(mural_result);
  } catch (error) {
    return res.status(500).json({
      error: "Error getting mural: " + error,
    });
  }
};
