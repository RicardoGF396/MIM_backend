import { Request, Response } from "express";
import { User } from "../../models/User";
import { pool } from "../../db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";

export const login = async (req: Request, res: Response) => {
  const { username, password }: User = req.body;

  const alphanumericError = isAlphanumeric(username);
  if (alphanumericError) {
    return res.json({ error: alphanumericError });
  }

  const validUserError = isValidUser(username, password);
  if (validUserError) {
    return res.json({ error: validUserError });
  }

  const validLengthUsernameError = isValidLength(username, 3, 20);
  if (validLengthUsernameError) {
    return res.json({ error: validLengthUsernameError });
  }

  const validLengthPasswordError = isValidLength(password, 3, 40);
  if (validLengthPasswordError) {
    return res.json({ error: validLengthPasswordError });
  }

  try {
    const result = await pool.query("SELECT * from users WHERE username = ?", [
      username,
    ]);

    const user = JSON.parse(JSON.stringify(result[0]));
    if (user.length === 0) {
      return res.json({ error: "Usuario o contraseña incorrectos" });
    } else {
      //El password que se encuentra en la base de datos
      const storedPassword = user[0].password;
      // Se verifica que la contraseña coincida con la de la BD
      bcrypt.compare(password, storedPassword, (err, isMatch) => {
        if (err || !isMatch) {
          const error = "Usuario o contraseña incorrectos";
          return handleLoginError(res, error);
        }
        //Utilizamos el id para firmar el token
        const id = user[0].id;
        if (process.env.ACCESS_TOKEN_SECRET) {
          const token = jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1d" });
          return res.json({ user, token });
        } else {
          return res.status(500).json({
            message: "Error: Secret key is undefined",
          });
        }
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error,
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    res.setHeader("access-token","");
    return res.json({ Status: "Loged out" });
  } catch (error) {
    return res.status(500).json({
      message: error,
    });
  }
};

const handleLoginError = (res: Response, error: string) => {
  return res.json({ error });
};

export const register = async (req: Request, res: Response) => {
  const { username, password }: User = req.body;

  const alphanumericError = isAlphanumeric(username);
  if (alphanumericError) {
    return res.json({ error: alphanumericError });
  }

  const validUserError = isValidUser(username, password);
  if (validUserError) {
    return res.json({ error: validUserError });
  }

  const validLengthUsernameError = isValidLength(username, 3, 20);
  if (validLengthUsernameError) {
    return res.json({ error: validLengthUsernameError });
  }

  const validLengthPasswordError = isValidLength(password, 3, 40);
  if (validLengthPasswordError) {
    return res.json({ error: validLengthPasswordError });
  }

  try {
    const userExist = await pool.query(
      "SELECT * from users WHERE username = ?",
      [username]
    );

    if (userExist) {
      return res.status(400).json({
        error: "El usuario ya existe",
      });
    } else {
      const hashPassword = await new Promise<string>((resolve, reject) => {
        bcrypt.hash(password, 10, (err, hash) => {
          if (err) {
            reject(err);
          } else {
            resolve(hash);
          }
        });
      });
      const result = await pool.query(
        "INSERT INTO users (username, password) VALUES (?,?)",
        [username, hashPassword]
      );

      return res.json(result);
    }
  } catch (error) {
    return res.status(500).json({
      message: error,
    });
  }
};

export const dashboard = async (req: Request, res: Response) => {
  try {
    return res.json({ Status: "Success" });
  } catch (error) {
    return res.status(500).json({
      message: error,
    });
  }
};

// Funciones de validación

// Validar caracteres permitidos (ejemplo: solo alfanuméricos)
const isAlphanumeric = (username: string) => {
  const alphanumericRegex = /^[a-zA-Z0-9]+$/;
  if (!alphanumericRegex.test(username)) {
    return "Formato inválido";
  }
  return null;
};

// Validar longitud mínima y máxima
const isValidLength = (field: string, min: number, max: number) => {
  if (field.length < min || field.length > max) {
    return "Longitud de contraseña inválida";
  }
  return null;
};

// Validar campos obligatorios
const isValidUser = (username: string, password: string) => {
  if (!username || !password) {
    return "Usuario y contraseña requeridos";
  }
  return null;
};
