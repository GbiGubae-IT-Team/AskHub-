import { Router } from "express";
import { asyncHandler } from "../../../core/utils/asyncHandler.js";
import {
  authenticate,
  optionalAuthenticate,
  requirePermission,
} from "../../auth/index.js";
import {
  createMessageController,
  deleteMessageController,
  getMessageByIdController,
  listMessagesController,
  updateMessageController,
} from "../controllers/index.js";

const router = Router();

router.get("/", optionalAuthenticate, asyncHandler(listMessagesController));

router.get(
  "/:id",
  optionalAuthenticate,
  asyncHandler(getMessageByIdController),
);

router.post(
  "/",
  authenticate,
  requirePermission("message:create"),
  asyncHandler(createMessageController),
);

router.patch("/:id", authenticate, asyncHandler(updateMessageController));

router.delete(
  "/:id",
  authenticate,
  asyncHandler(deleteMessageController),
);

export default router;
