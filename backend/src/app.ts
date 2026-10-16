
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import campaignRoutes from "./routes/campaign.routes";
import submissionRoutes from "./routes/submission.routes";
import { authenticate } from "./middleware/auth.middleware";

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "https://meme-campaign-tracker-frontend.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  })
);

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/test-auth", authenticate, (req, res) => {
  res.json({ user: req.user });
});

app.use("/api/auth", authRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/submissions", submissionRoutes);

export default app;
