import { Router } from "express";
import {
  createSubmission,
  updateSubmissionViews,
} from "../controllers/submission.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

router.post("/", authenticate, requireRole("creator"), createSubmission);
router.patch(
  "/:id/views",
  authenticate,
  requireRole("creator"),
  updateSubmissionViews
);

export default router;