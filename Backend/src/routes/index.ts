import { Router } from "express";
import { authRoutes } from "../modules/auth/index.js";
import { userRoutes } from "../modules/users/index.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
  });
});

export default router;
