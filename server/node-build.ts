import path from "path";
import express from "express";
import { createServer } from "./index";
import os from "os";

const app = createServer();
const port = process.env.PORT || 3000;

const __dirname = import.meta.dirname;
const distPath = path.join(__dirname, "../spa");

const getLocalIp = () => {
  const networkInterfaces = os.networkInterfaces();
  for (const iface of Object.values(networkInterfaces)) {
    for (const ifaceDetail of iface) {
      if (ifaceDetail.family === 'IPv4' && !ifaceDetail.internal) {
        return ifaceDetail.address;
      }
    }
  }
  return 'localhost';  // Fallback to localhost if no external IP found
};

// Serve static
app.use(express.static(distPath));

// SPA fallback using *middleware* ONLY — NOT routes
app.use((req, res, next) => {
  if (req.method !== "GET") return next();

  // Skip API routes
  if (req.path.startsWith("/api") || req.path.startsWith("/health")) {
    return next();
  }

  // Serve index.html for React Router
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(port, () => {
  const localIp = getLocalIp();
  console.log(`Network: http://${localIp}:${port}`);
});
