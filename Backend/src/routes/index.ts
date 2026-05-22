import { Router } from "express";
import { authRoutes } from "../modules/auth/index.js";
import { userRoutes } from "../modules/users/index.js";
import { roomRoutes } from "../modules/rooms/index.js";
import { questionRoutes } from "../modules/questions/index.js";
import { messageRoutes } from "../modules/messages/index.js";
import { tagRoutes } from "../modules/tags/index.js";
import { notificationRoutes } from "../modules/notifications/index.js";
import { answerRoutes } from "../modules/answers/index.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/rooms", roomRoutes);
router.use("/questions", questionRoutes);
router.use("/messages", messageRoutes);
router.use("/tags", tagRoutes);
router.use("/notifications", notificationRoutes);
router.use("/answers", answerRoutes);

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
  });
});

export default router;
