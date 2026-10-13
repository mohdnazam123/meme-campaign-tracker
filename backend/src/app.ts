import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import campaignRoutes from "./routes/campaign.routes";
import { authenticate } from "./middleware/auth.middleware";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/test-auth", authenticate, (req, res) => {
  res.json({ user: req.user });
});

app.use("/api/auth", authRoutes);

app.use("/api/campaigns", campaignRoutes);

export default app;