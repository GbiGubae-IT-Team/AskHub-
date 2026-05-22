import { Router } from "express";
import { asyncHandler } from "../../../core/utils/asyncHandler.js";
import {
  authenticate,
  requirePermission,
} from "../../auth/index.js";
import {
  createTagController,
  deleteTagController,
  getTagByIdController,
  listTagsController,
  updateTagController,
} from "../controllers/index.js";

const router = Router();

router.get("/", asyncHandler(listTagsController));

router.get("/:id", asyncHandler(getTagByIdController));

router.post(
  "/",
  authenticate,
  requirePermission("tag:manage"),
  asyncHandler(createTagController),
);

router.patch(
  "/:id",
  authenticate,
  requirePermission("tag:manage"),
  asyncHandler(updateTagController),
);

router.delete(
  "/:id",
  authenticate,
  requirePermission("tag:manage"),
  asyncHandler(deleteTagController),
);

export default router;
