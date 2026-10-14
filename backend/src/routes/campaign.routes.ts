import { Router } from "express";
import {
  createCampaign,
  getLiveCampaigns,
} from "../controllers/campaign.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

router.post("/", authenticate, createCampaign);
router.get("/", authenticate, requireRole("creator"), getLiveCampaigns);

export default router;