import express from "express";
import creditRoutes from "./credits";

const router = express.Router();

// Health check route
router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Credit management routes
router.use("/credits", creditRoutes);

export default router;
