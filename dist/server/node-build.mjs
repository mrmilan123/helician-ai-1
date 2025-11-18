import path from "path";
import express from "express";
import "dotenv/config";
import { fileURLToPath } from "url";
import cors from "cors";
import os from "os";
const handleDemo = (req, res) => {
  const response = {
    message: "Hello from Express server"
  };
  res.status(200).json(response);
};
const handleSignup = async (req, res) => {
  const { name, email, password, confirmPassword, age, gender } = req.body;
  if (!name || !email || !password || !confirmPassword || !age || !gender) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  if (password !== confirmPassword) {
    res.status(400).json({ error: "Passwords do not match" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }
  const ageNum = parseInt(age);
  if (isNaN(ageNum) || ageNum < 13) {
    res.status(400).json({ error: "You must be at least 13 years old" });
    return;
  }
  await new Promise((resolve) => setTimeout(resolve, 500));
  res.status(200).json({
    success: true,
    message: "Account created successfully",
    user: {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
      age: ageNum,
      gender,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  });
};
const getDummyResponse = (message) => {
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey")) {
    return "Hello! 👋 How can I assist you today? Feel free to ask me anything!";
  }
  if (lowerMessage.includes("how are you") || lowerMessage.includes("how do you feel")) {
    return "I'm doing great, thanks for asking! I'm here and ready to help with whatever you need. What would you like to discuss?";
  }
  if (lowerMessage.includes("help") || lowerMessage.includes("can you")) {
    return "Of course! I'd be happy to help. I can assist you with various tasks like answering questions, writing, coding, brainstorming, and much more. What do you need help with?";
  }
  if (lowerMessage.includes("python") || lowerMessage.includes("javascript") || lowerMessage.includes("code") || lowerMessage.includes("programming")) {
    return "Great! I'm well-versed in programming. Whether you need help with Python, JavaScript, or other languages, I can assist with explanations, debugging, or writing code. What's your programming question?";
  }
  if (lowerMessage.includes("write") || lowerMessage.includes("essay") || lowerMessage.includes("story")) {
    return "I'd love to help with your writing! Whether it's an essay, story, or creative piece, I can help you brainstorm, draft, or refine your ideas. What would you like to write about?";
  }
  if (lowerMessage.includes("joke") || lowerMessage.includes("funny") || lowerMessage.includes("laugh")) {
    return "Why did the AI go to school? To improve its learning model! 😄 Got any other requests? I can help with humor or anything else you need.";
  }
  if (lowerMessage.includes("thank") || lowerMessage.includes("thanks") || lowerMessage.includes("appreciate")) {
    return "You're welcome! I'm happy to help. Don't hesitate to ask if you need anything else!";
  }
  if (lowerMessage.includes("what") || lowerMessage.includes("tell me about") || lowerMessage.includes("explain")) {
    return "I'd be happy to explain that! I can provide information on almost any topic. Could you be more specific about what you'd like to know?";
  }
  if (lowerMessage.includes("bye") || lowerMessage.includes("goodbye")) {
    return "Goodbye! It was great chatting with you. Feel free to come back anytime if you need help. Have a wonderful day! 👋";
  }
  return `That's an interesting question: "${message}". I can help you with that! Could you provide a bit more detail so I can give you the best answer? Feel free to ask anything - I'm here to help with information, creative tasks, coding, problem-solving, and much more.`;
};
const handleChat = async (req, res) => {
  const { message, conversationId } = req.body;
  if (!message || !conversationId) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  await new Promise((resolve) => setTimeout(resolve, 800));
  const response = getDummyResponse(message);
  res.status(200).json({
    success: true,
    conversationId,
    response,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
};
const BACKEND_BASE_URL = "http://localhost:5678/webhook";
const forwardRequest = async (endpoint, method, body, authHeader) => {
  try {
    const headers = {
      "Content-Type": "application/json"
    };
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }
    const options = {
      method,
      headers
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    const response = await fetch(`${BACKEND_BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return {
      ok: response.ok,
      status: response.status,
      data
    };
  } catch (error) {
    console.error(`Error forwarding request to ${endpoint}:`, error);
    throw error;
  }
};
const handleLogin = async (req, res) => {
  try {
    const result = await forwardRequest("/login", "POST", req.body);
    if (result.ok) {
      res.status(result.status).json(result.data);
    } else {
      res.status(result.status).json(result.data);
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to process login request" });
  }
};
const handleSignUpUser = async (req, res) => {
  try {
    const result = await forwardRequest("/sign-up-user", "POST", req.body);
    if (result.ok) {
      res.status(result.status).json(result.data);
    } else {
      res.status(result.status).json(result.data);
    }
  } catch (error) {
    console.error("Sign up error:", error);
    res.status(500).json({ error: "Failed to process sign up request" });
  }
};
const handleUserDetails = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const result = await forwardRequest(
      "/user-details",
      "GET",
      void 0,
      authHeader
    );
    if (result.ok) {
      res.status(result.status).json(result.data);
    } else {
      res.status(result.status).json(result.data);
    }
  } catch (error) {
    console.error("User details error:", error);
    res.status(500).json({ error: "Failed to fetch user details" });
  }
};
const handleCreateCase = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const result = await forwardRequest(
      "/create-case",
      "POST",
      req.body,
      authHeader
    );
    if (result.ok) {
      res.status(result.status).json(result.data);
    } else {
      res.status(result.status).json(result.data);
    }
  } catch (error) {
    console.error("Create case error:", error);
    res.status(500).json({ error: "Failed to create case" });
  }
};
const handleLoadCaseConversation = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const result = await forwardRequest(
      "/load-case-conversation",
      "POST",
      req.body,
      authHeader
    );
    if (result.ok) {
      res.status(result.status).json(result.data);
    } else {
      res.status(result.status).json(result.data);
    }
  } catch (error) {
    console.error("Load case conversation error:", error);
    res.status(500).json({ error: "Failed to load case conversation" });
  }
};
const handleInitiateChat = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const result = await forwardRequest(
      "/initiate-chat",
      "POST",
      req.body,
      authHeader
    );
    if (result.ok) {
      res.status(result.status).json(result.data);
    } else {
      res.status(result.status).json(result.data);
    }
  } catch (error) {
    console.error("Initiate chat error:", error);
    res.status(500).json({ error: "Failed to initiate chat" });
  }
};
const handleAiResponse = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const result = await forwardRequest(
      "/ai-resp",
      "POST",
      req.body,
      authHeader
    );
    if (result.ok) {
      res.status(result.status).json(result.data);
    } else {
      res.status(result.status).json(result.data);
    }
  } catch (error) {
    console.error("AI response error:", error);
    res.status(500).json({ error: "Failed to get AI response" });
  }
};
const __filename$1 = fileURLToPath(import.meta.url);
const __dirname$2 = path.dirname(__filename$1);
function createServer() {
  const app2 = express();
  app2.use(cors());
  app2.use(express.json());
  app2.use(express.urlencoded({ extended: true }));
  app2.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });
  app2.get("/api/demo", handleDemo);
  app2.post("/api/signup", handleSignup);
  app2.post("/api/chat", handleChat);
  app2.post("/webhook/login", handleLogin);
  app2.post("/webhook/sign-up-user", handleSignUpUser);
  app2.get("/webhook/user-details", handleUserDetails);
  app2.post("/webhook/create-case", handleCreateCase);
  app2.post("/webhook/load-case-conversation", handleLoadCaseConversation);
  app2.post("/webhook/initiate-chat", handleInitiateChat);
  app2.post("/webhook/ai-resp", handleAiResponse);
  {
    const spaDir = path.join(__dirname$2, "../spa");
    app2.use(express.static(spaDir));
    app2.use((req, res, next) => {
      if (req.path.startsWith("/api/")) return next();
      res.sendFile(path.join(spaDir, "index.html"));
    });
  }
  return app2;
}
const app = createServer();
const port = process.env.PORT || 3e3;
const __dirname$1 = import.meta.dirname;
const distPath = path.join(__dirname$1, "../spa");
const getLocalIp = () => {
  const networkInterfaces = os.networkInterfaces();
  for (const iface of Object.values(networkInterfaces)) {
    for (const ifaceDetail of iface) {
      if (ifaceDetail.family === "IPv4" && !ifaceDetail.internal) {
        return ifaceDetail.address;
      }
    }
  }
  return "localhost";
};
app.use(express.static(distPath));
app.use((req, res, next) => {
  if (req.method !== "GET") return next();
  if (req.path.startsWith("/api") || req.path.startsWith("/health")) {
    return next();
  }
  res.sendFile(path.join(distPath, "index.html"));
});
app.listen(port, () => {
  const localIp = getLocalIp();
  console.log(`Network: http://${localIp}:${port}`);
});
//# sourceMappingURL=node-build.mjs.map
