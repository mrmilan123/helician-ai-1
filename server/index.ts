import "dotenv/config";
import express from "express";
import { fileURLToPath } from "url";
import cors from "cors";
import path from "path";
import { handleDemo } from "./routes/demo";
import { handleSignup } from "./routes/signup";
import { handleChat } from "./routes/chat";
import {
  handleLogin,
  handleSignUpUser,
  handleUserDetails,
  handleCreateCase,
  handleLoadCaseConversation,
  handleInitiateChat,
  handleAiResponse,
} from "./routes/webhook";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Auth routes
  app.post("/api/signup", handleSignup);

  // Chat routes
  app.post("/api/chat", handleChat);

  // Webhook routes
  app.post("/webhook/login", handleLogin);
  app.post("/webhook/sign-up-user", handleSignUpUser);
  app.get("/webhook/user-details", handleUserDetails);
  app.post("/webhook/create-case", handleCreateCase);
  app.post("/webhook/load-case-conversation", handleLoadCaseConversation);
  app.post("/webhook/initiate-chat", handleInitiateChat);
  app.post("/webhook/ai-resp", handleAiResponse);

  // SPA Fallback: Only in production mode
  // In development, Vite's dev server handles SPA routing
  if (process.env.NODE_ENV === "production") {
    const spaDir = path.join(__dirname, "../spa"); // same as old working version
    app.use(express.static(spaDir));

    app.use((req, res, next) => {
      if (req.path.startsWith("/api/")) return next();
      res.sendFile(path.join(spaDir, "index.html"));
    });
  }


  return app;
}
