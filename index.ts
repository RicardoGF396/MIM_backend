import express from "express";
import cors from "cors";
import { BASE_URL, PORT } from "./config";
import exhibitionsRoutes from "./api/exhibitions/exhibitions.routes";
import usersRoutes from "./api/users/users.routes";
import cookieParser from "cookie-parser";

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

app.get("/");
app.use("/api", exhibitionsRoutes);
app.use("/api", usersRoutes);

app.use("/upload", express.static("upload/images"));

app.all("*", (req, res, next) => {
  console.log(`Requested URL ${req.path} not found!`, 404);
});

app.listen(PORT, () => {
  console.log("Server Running");
});
