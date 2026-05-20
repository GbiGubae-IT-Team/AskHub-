import { Router } from "express";
import { asyncHandler } from "../../../core/utils/asyncHandler.js";
import {
  authenticate,
  optionalAuthenticate,
  requirePermission,
} from "../../auth/index.js";
import {
  createAdminController,
  createUserController,
  deleteUserController,
  getUserByIdController,
  listUsersController,
  updateUserController,
} from "../controllers/index.js";

const router = Router();

router.get(
  "/",
  authenticate,
  requirePermission("user:manage"),
  asyncHandler(listUsersController),
);

router.post(
  "/",
  authenticate,
  requirePermission("user:manage"),
  asyncHandler(createUserController),
);

router.post(
  "/admins",
  authenticate,
  requirePermission("admin:create"),
  asyncHandler(createAdminController),
);

router.get("/:id", optionalAuthenticate, asyncHandler(getUserByIdController));

router.patch("/:id", authenticate, asyncHandler(updateUserController));

router.delete(
  "/:id",
  authenticate,
  requirePermission("user:manage"),
  asyncHandler(deleteUserController),
);

export default router;
