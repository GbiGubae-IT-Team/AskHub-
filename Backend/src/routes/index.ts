import { Router } from "express";
//import { vendorRoutes } from "../modules/vendors/index.js";

const router = Router();

//router.use("/vendors", vendorRoutes);

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
  });
});

export default router;
