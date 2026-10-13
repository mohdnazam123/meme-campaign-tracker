import { Router } from "express";
import { createCampaign } from "../controllers/campaign.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authenticate, createCampaign);

export default router;