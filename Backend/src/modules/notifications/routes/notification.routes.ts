import { registerDeviceController, disableDeviceController } from "../push/device.controller.js";
import { Router } from "express";
import { asyncHandler } from "../../../core/utils/asyncHandler.js";
import {
  authenticate,
  optionalAuthenticate,
  requirePermission,
} from "../../auth/index.js";
import {
  createNotificationController,
  deleteNotificationController,
  getNotificationByIdController,
  listNotificationsController,
  markAllReadController,
  markReadController,
  updateNotificationController,
} from "../controllers/index.js";

const router = Router();

router.put("/devices/:id", optionalAuthenticate, asyncHandler(registerDeviceController));
// The per-installation secret authorizes removal even after a session expires.
router.delete("/devices/:id", asyncHandler(disableDeviceController));
router.patch("/:id/read", authenticate, requirePermission("notification:read"), asyncHandler(markReadController));

router.get(
  "/",
  optionalAuthenticate,
  asyncHandler(listNotificationsController),
);

router.patch(
  "/read-all",
  authenticate,
  requirePermission("notification:read"),
  asyncHandler(markAllReadController),
);

router.get(
  "/:id",
  authenticate,
  requirePermission("notification:read"),
  asyncHandler(getNotificationByIdController),
);

router.post(
  "/",
  authenticate,
  requirePermission("notification:create"),
  asyncHandler(createNotificationController),
);

router.patch(
  "/:id",
  authenticate,
  requirePermission("notification:read"),
  asyncHandler(updateNotificationController),
);

router.delete(
  "/:id",
  authenticate,
  asyncHandler(deleteNotificationController),
);

export default router;
