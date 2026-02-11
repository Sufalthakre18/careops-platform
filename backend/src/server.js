import express from "express";
import cors from "cors";
import morgan from "morgan";
import "dotenv/config";

import { prisma, connectDb } from "../src/config/prisma.js"; // adjust path if needed

const app = express();

// ============================
// MIDDLEWARE
// ============================

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// ============================
// HEALTH CHECK ROUTE
// ============================

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "healthy",
      database: "connected ✅",
    });
  } catch (error) {
    res.status(500).json({
      status: "error ❌",
      error: error.message,
    });
  }
});

// ============================
// START SERVER
// ============================

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDb(); // connect database first

    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server ❌", error);
    process.exit(1);
  }
}

startServer();
