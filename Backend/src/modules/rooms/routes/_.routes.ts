import { Router } from "express";
import { asyncHandler } from "../../../core/utils/asyncHandler.js";
import {
  authenticate,
  optionalAuthenticate,
  requirePermission,
} from "../../auth/index.js";
import {
  createRoomController,
  deleteRoomController,
  getRoomByIdController,
  listRoomsController,
  updateRoomController,
} from "../controllers/index.js";

const router = Router();

router.get("/", optionalAuthenticate, asyncHandler(listRoomsController));

router.get("/:id", optionalAuthenticate, asyncHandler(getRoomByIdController));

router.post(
  "/",
  authenticate,
  requirePermission("room:create"),
  asyncHandler(createRoomController),
);

router.patch("/:id", authenticate, asyncHandler(updateRoomController));

router.delete(
  "/:id",
  authenticate,
  requirePermission("room:delete"),
  asyncHandler(deleteRoomController),
);

export default router;
