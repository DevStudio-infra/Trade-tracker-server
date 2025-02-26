import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes";
import prisma from "./config/database";
import { scheduleCreditRefresh } from "./services/creditRefreshService";

// Initialize environment variables
dotenv.config();

// Create Express app
const app: Express = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api", routes);

// Error handling middleware
interface ErrorWithStatus extends Error {
  status?: number;
}

app.use((err: ErrorWithStatus, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

// Start server
const startServer = async () => {
  try {
    await prisma.$connect();
    console.log("🚀 Connected to database successfully");

    // Schedule credit refresh job
    scheduleCreditRefresh();
    console.log("📅 Credit refresh job scheduled");

    app.listen(port, () => {
      console.log(`⚡️ Server is running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM signal received: closing HTTP server");
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
