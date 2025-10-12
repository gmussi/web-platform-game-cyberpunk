import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, "..")));

// Serve static files from dist directory
app.use("/dist", express.static(path.join(__dirname, "../dist")));

// Serve static files from img directory
app.use("/img", express.static(path.join(__dirname, "../img")));

// Serve static files from audio directory
app.use("/audio", express.static(path.join(__dirname, "../audio")));

// Serve static files from maps directory
app.use("/maps", express.static(path.join(__dirname, "../maps")));

// Handle ES module imports without .js extension
app.get("/dist/:module", (req, res, next) => {
  const moduleName = req.params.module;
  const jsPath = path.join(__dirname, "../dist", `${moduleName}.js`);

  // Check if the .js file exists
  if (existsSync(jsPath)) {
    res.sendFile(jsPath);
  } else {
    next();
  }
});

// API routes
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Game server is running",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/game-info", (req, res) => {
  res.json({
    name: "2D Platformer Game",
    version: "1.0.0",
    description:
      "A 2D side-scrolling platformer game built with Phaser.js and TypeScript",
    author: "Game Developer",
  });
});

// Catch-all handler: send back the main HTML file for any non-API routes
// Only handle requests that don't have file extensions (SPA routing)
app.use((req, res, next) => {
  // Skip API routes
  if (req.path.startsWith("/api/")) {
    return next();
  }

  // Skip if the request has a file extension (let static middleware handle it)
  if (req.path.includes(".")) {
    return next();
  }

  // Skip requests to /dist/ directory (these are likely ES module imports without .js extension)
  if (req.path.startsWith("/dist/")) {
    return next();
  }

  res.sendFile(path.join(__dirname, "../index.html"));
});

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Error:", err.message);
    res.status(500).json({
      error: "Internal Server Error",
      message:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Something went wrong",
    });
  }
);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Game server running on http://localhost:${PORT}`);
  console.log(`📁 Serving static files from: ${path.join(__dirname, "..")}`);
  console.log(`🎮 Game available at: http://localhost:${PORT}`);
  console.log(`🔍 API health check: http://localhost:${PORT}/api/health`);
});

export default app;
