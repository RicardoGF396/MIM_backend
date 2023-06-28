import express from "express";
import cors from "cors";
import { BASE_URL, PORT } from "./config";
import cookieParser from "cookie-parser";
import exhibitionsRoutes from "./api/exhibitions/exhibitions.routes";
import usersRoutes from "./api/users/users.routes";
import gardensRoutes from "./api/gardens/gardens.routes";
import muralsRoutes from "./api/murals/murales.routes";
import sculpturesRoutes from "./api/sculptures/sculptres.routes";

const app = express();
app.use(
  cors({
    origin: [`${BASE_URL}`],
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // Middleware para analizar datos de formulario en el cuerpo de la solicitud

app.get("/");
app.use("/api", usersRoutes);
app.use("/api/exhibitions", exhibitionsRoutes);
app.use("/api/gardens", gardensRoutes);
app.use("/api/murals", muralsRoutes);
app.use("/api/sculptures", sculpturesRoutes);

app.use("/upload", express.static("upload/images"));

app.all("*", (req, res, next) => {
  res.status(404).json({
    message: `Requested URL ${req.path} not found!`
  })
});

app.listen(PORT, () => {
  console.log("Server Running");
});
