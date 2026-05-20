import { Router } from "express";
import { asyncHandler } from "../../../core/utils/asyncHandler.js";
import {
  loginController,
  meController,
  registerController,
} from "../controllers/index.js";
import {
  authenticate,
  optionalAuthenticate,
} from "../middleware/index.js";

const router = Router();

router.post("/register", optionalAuthenticate, asyncHandler(registerController));
router.post("/login", asyncHandler(loginController));
router.get("/me", authenticate, asyncHandler(meController));

export default router;
