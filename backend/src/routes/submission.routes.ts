import { Router } from "express";
import { createSubmission } from "../controllers/submission.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

router.post("/", authenticate, requireRole("creator"), createSubmission);

export default router;