import { NextFunction, Router, Request, Response } from "express";
import { dashboard, login, register, logout } from "./users.controller";
import { auth } from "../../middlewares/auth";

const router = Router();

/* const verifyUser = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token;

  if (!token) {
    return res.json({ Error: "You are not authenticated" });
  } else {
    jwt.verify(
      token,
      "jwt-secret-key",
      (err: VerifyErrors | null, decoded: any) => {
        if (err) {
          return res.json({ Error: "Invalid token" });
        }
        // El token es válido, puedes continuar con la siguiente función de middleware
        next();
      }
    );
  }
}; */

router.post("/login", login);
router.post("/logout", logout);
router.post("/register", register);
router.get("/dashboard", auth, dashboard);

export default router;
