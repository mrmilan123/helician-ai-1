import { RequestHandler } from "express";

interface ChatRequest {
  message: string;
  conversationId: string;
}

// Dummy responses based on message keywords
const getDummyResponse = (message: string): string => {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("hello") ||
    lowerMessage.includes("hi") ||
    lowerMessage.includes("hey")
  ) {
    return "Hello! 👋 How can I assist you today? Feel free to ask me anything!";
  }

  if (
    lowerMessage.includes("how are you") ||
    lowerMessage.includes("how do you feel")
  ) {
    return "I'm doing great, thanks for asking! I'm here and ready to help with whatever you need. What would you like to discuss?";
  }

  if (
    lowerMessage.includes("help") ||
    lowerMessage.includes("can you")
  ) {
    return "Of course! I'd be happy to help. I can assist you with various tasks like answering questions, writing, coding, brainstorming, and much more. What do you need help with?";
  }

  if (
    lowerMessage.includes("python") ||
    lowerMessage.includes("javascript") ||
    lowerMessage.includes("code") ||
    lowerMessage.includes("programming")
  ) {
    return "Great! I'm well-versed in programming. Whether you need help with Python, JavaScript, or other languages, I can assist with explanations, debugging, or writing code. What's your programming question?";
  }

  if (
    lowerMessage.includes("write") ||
    lowerMessage.includes("essay") ||
    lowerMessage.includes("story")
  ) {
    return "I'd love to help with your writing! Whether it's an essay, story, or creative piece, I can help you brainstorm, draft, or refine your ideas. What would you like to write about?";
  }

  if (
    lowerMessage.includes("joke") ||
    lowerMessage.includes("funny") ||
    lowerMessage.includes("laugh")
  ) {
    return "Why did the AI go to school? To improve its learning model! 😄 Got any other requests? I can help with humor or anything else you need.";
  }

  if (
    lowerMessage.includes("thank") ||
    lowerMessage.includes("thanks") ||
    lowerMessage.includes("appreciate")
  ) {
    return "You're welcome! I'm happy to help. Don't hesitate to ask if you need anything else!";
  }

  if (
    lowerMessage.includes("what") ||
    lowerMessage.includes("tell me about") ||
    lowerMessage.includes("explain")
  ) {
    return "I'd be happy to explain that! I can provide information on almost any topic. Could you be more specific about what you'd like to know?";
  }

  if (lowerMessage.includes("bye") || lowerMessage.includes("goodbye")) {
    return "Goodbye! It was great chatting with you. Feel free to come back anytime if you need help. Have a wonderful day! 👋";
  }

  // Default response for any other message
  return `That's an interesting question: "${message}". I can help you with that! Could you provide a bit more detail so I can give you the best answer? Feel free to ask anything - I'm here to help with information, creative tasks, coding, problem-solving, and much more.`;
};

export const handleChat: RequestHandler = async (req, res) => {
  const { message, conversationId } = req.body as ChatRequest;

  if (!message || !conversationId) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  const response = getDummyResponse(message);

  res.status(200).json({
    success: true,
    conversationId,
    response,
    timestamp: new Date().toISOString(),
  });
};
