import { NextFunction, Router, Request, Response } from "express";
import { dashboard, login, register, logout } from "./users.controller";
import { auth } from "../../middlewares/auth";

const router = Router();

router.post("/login", login);
router.post("/logout", logout);
router.post("/register", register);
router.get("/dashboard", auth, dashboard);

export default router;
