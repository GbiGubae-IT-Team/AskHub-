import { Router } from "express";
import { asyncHandler } from "../../../core/utils/asyncHandler.js";
import {
  authenticate,
  optionalAuthenticate,
  requirePermission,
} from "../../auth/index.js";
import {
  createQuestionController,
  deleteQuestionController,
  getQuestionByIdController,
  listQuestionsController,
  updateQuestionController,
} from "../controllers/index.js";

const router = Router();

router.get("/", optionalAuthenticate, asyncHandler(listQuestionsController));

router.get(
  "/:id",
  optionalAuthenticate,
  asyncHandler(getQuestionByIdController),
);

router.post(
  "/",
  authenticate,
  requirePermission("question:create"),
  asyncHandler(createQuestionController),
);

router.patch("/:id", authenticate, asyncHandler(updateQuestionController));

router.delete(
  "/:id",
  authenticate,
  requirePermission("question:delete"),
  asyncHandler(deleteQuestionController),
);

export default router;
