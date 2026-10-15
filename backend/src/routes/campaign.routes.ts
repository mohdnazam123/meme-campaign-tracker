import { Router } from "express";
import {
  createCampaign,
  getLiveCampaigns,
  getMyCampaigns,
} from "../controllers/campaign.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

router.post("/", authenticate, createCampaign);
router.get("/mine", authenticate, requireRole("brand"), getMyCampaigns);
router.get("/", authenticate, requireRole("creator"), getLiveCampaigns);

export default router;