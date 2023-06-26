import { Request, Response } from "express";
import { User } from "../../models/User";
import { pool } from "../../db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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
      const storedPassword = user[0].password;

      bcrypt.compare(password, storedPassword, (err, isMatch) => {
        if (err || !isMatch) {
          const error = "Usuario o contraseña incorrectos";
          return handleLoginError(res, error);
        }

        const id = user[0].id;
        const token = jwt.sign({ id }, "jwt-secret-key", { expiresIn: "1d" });

        res.cookie("token", token);
        return res.json(result);
      });
    }
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

    res.json(result);
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

export const logout = async (req: Request, res: Response) => {
  try {
    res.clearCookie("token");
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
