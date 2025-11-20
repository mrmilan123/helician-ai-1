import { RequestHandler } from "express";

const BACKEND_BASE_URL = "http://localhost:5678/webhook";

const forwardRequest = async (
  endpoint: string,
  method: string,
  body?: any,
  authHeader?: string,
) => {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add Authorization header if provided
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BACKEND_BASE_URL}${endpoint}`, options);
    const data = await response.json();

    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    console.error(`Error forwarding request to ${endpoint}:`, error);
    throw error;
  }
};

export const handleLogin: RequestHandler = async (req, res) => {
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

export const handleSignUpUser: RequestHandler = async (req, res) => {
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

export const handleUserDetails: RequestHandler = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const result = await forwardRequest(
      "/user-details",
      "GET",
      undefined,
      authHeader,
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

export const handleCreateCase: RequestHandler = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const result = await forwardRequest(
      "/create-case",
      "POST",
      req.body,
      authHeader,
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

export const handleLoadCaseConversation: RequestHandler = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const result = await forwardRequest(
      "/load-case-conversation",
      "POST",
      req.body,
      authHeader,
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

export const handleInitiateChat: RequestHandler = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const result = await forwardRequest(
      "/initiate-chat",
      "POST",
      req.body,
      authHeader,
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

export const handleAiResponse: RequestHandler = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    // Check if this is a file upload (FormData) or text request
    const contentType = req.headers["content-type"] || "";
    const isFormData = contentType.includes("multipart/form-data");

    if (isFormData) {
      // Handle FormData file upload
      const formDataHeaders: Record<string, string> = {};
      if (authHeader) {
        formDataHeaders["Authorization"] = authHeader;
      }
      // Don't set Content-Type here, let fetch handle it with FormData

      try {
        const response = await fetch(`http://localhost:5678/webhook/ai-resp`, {
          method: "POST",
          headers: formDataHeaders,
          body: req.body,
        });

        const data = await response.json();
        res.status(response.status).json(data);
      } catch (error) {
        console.error("Error forwarding FormData request:", error);
        res.status(500).json({ error: "Failed to process file upload" });
      }
    } else {
      // Handle JSON text request
      const result = await forwardRequest(
        "/ai-resp",
        "POST",
        req.body,
        authHeader,
      );

      if (result.ok) {
        res.status(result.status).json(result.data);
      } else {
        res.status(result.status).json(result.data);
      }
    }
  } catch (error) {
    console.error("AI response error:", error);
    res.status(500).json({ error: "Failed to get AI response" });
  }
};
