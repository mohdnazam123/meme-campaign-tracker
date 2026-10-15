
import { Router } from "express";
import {
  createSubmission,
  updateSubmissionViews,
  getMySubmissions,
} from "../controllers/submission.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

router.get(
  "/mine",
  authenticate,
  requireRole("creator"),
  getMySubmissions
);

router.post("/", authenticate, requireRole("creator"), createSubmission);

router.patch(
  "/:id/views",
  authenticate,
  requireRole("creator"),
  updateSubmissionViews
);

export default router;
