import { createPool, PoolOptions } from "mysql2/promise";
import {
  DB_HOST,
  DB_DATABASE,
  DB_USER,
  DB_PASSWORD,
  DB_PORT,
} from "./config";

const poolOptions: PoolOptions = {
  port: Number(DB_PORT),
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_DATABASE,
};

export const pool = createPool(poolOptions);
