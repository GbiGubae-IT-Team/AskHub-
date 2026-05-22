import { Router } from "express";
import { asyncHandler } from "../../../core/utils/asyncHandler.js";
import {
  authenticate,
  optionalAuthenticate,
  requirePermission,
} from "../../auth/index.js";
import {
  createAnswerController,
  deleteAnswerController,
  getAnswerByIdController,
  listAnswersController,
  updateAnswerController,
} from "../controllers/index.js";

const router = Router();

router.get("/", optionalAuthenticate, asyncHandler(listAnswersController));

router.get(
  "/:id",
  optionalAuthenticate,
  asyncHandler(getAnswerByIdController),
);

router.post(
  "/",
  authenticate,
  requirePermission("answer:create"),
  asyncHandler(createAnswerController),
);

router.patch("/:id", authenticate, asyncHandler(updateAnswerController));

router.delete(
  "/:id",
  authenticate,
  asyncHandler(deleteAnswerController),
);

export default router;
