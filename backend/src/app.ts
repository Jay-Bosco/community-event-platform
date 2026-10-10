import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes";
import eventsRoutes from "./routes/events.routes";
import managerRoutes from "./routes/manager.routes";
import venuesRoutes from "./routes/venues.routes";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 4210;
const corsOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/venues", venuesRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/manager", managerRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Not found" });
});

app.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`);
});

export default app;
