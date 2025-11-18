import { useState, useRef, useEffect } from "react";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, Send, Plus, MessageSquare, Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch";

interface ChatMessage {
  role: "user" | "assistant";
  content: string | { url?: string; message?: string };
  time: string;
  contentType: "text" | "image" | "video";
}

interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
}

export default function Chat() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const fetchWithAuth = useAuthenticatedFetch();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get case data from navigation state
  const caseId = (location.state as any)?.caseId;
  const initialChatData = (location.state as any)?.chatData;
  const caseName = (location.state as any)?.caseName;
  const caseType = (location.state as any)?.caseType;
  const isNewCase = (location.state as any)?.isNewCase || false;

  useEffect(() => {
    if (!caseId) {
      navigate("/home");
      return;
    }

    const initializeChat = async () => {
      try {
        let messages: ChatMessage[] = [];

        // If data from load-case-conversation, use it directly
        if (
          initialChatData &&
          Array.isArray(initialChatData) &&
          initialChatData.length > 0
        ) {
          messages = initialChatData;
        } else {
          // Only call initiate-chat for new cases or if no conversation data
          const response = await fetchWithAuth("/webhook/initiate-chat", {
            method: "POST",
            body: JSON.stringify({
              caseId: caseId,
              caseName: caseName || `Case #${caseId}`,
              caseType: caseType || "",
            }),
          });

          if (response.ok) {
            const chatInitData = await response.json();
            messages = [
              {
                role: "assistant" as const,
                content: chatInitData.content.message,
                time: new Date().toISOString(),
                contentType: (chatInitData.type || "text") as
                  | "text"
                  | "image"
                  | "video",
              },
            ];
          }
        }

        // Initialize with case conversation
        const convId = `case-${caseId}`;
        const caseConversation: Conversation = {
          id: convId,
          title: caseName || `Case #${caseId}`,
          messages: messages,
        };

        setConversations([caseConversation]);
        setCurrentConversationId(convId);
      } catch (err) {
        console.error("Error initializing chat:", err);
        // Fallback: Initialize with empty messages
        const convId = `case-${caseId}`;
        const caseConversation: Conversation = {
          id: convId,
          title: caseName || `Case #${caseId}`,
          messages: [],
        };
        setConversations([caseConversation]);
        setCurrentConversationId(convId);
      }
    };

    initializeChat();
  }, [caseId]);

  const currentConversation = conversations.find(
    (c) => c.id === currentConversationId,
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  const handleLogout = () => {
    logout();
  };

  const handleNewConversation = () => {
    const newId = Date.now().toString();
    const newConversation: Conversation = {
      id: newId,
      title: "New Conversation",
      messages: [],
    };
    setConversations([...conversations, newConversation]);
    setCurrentConversationId(newId);
  };

  const handleGoHome = () => {
    navigate("/home");
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || !currentConversation) {
      return;
    }

    const messageContent = inputValue;

    const userMessage: ChatMessage = {
      role: "user",
      content: messageContent,
      time: new Date().toISOString(),
      contentType: "text",
    };

    setConversations(
      conversations.map((conv) => {
        if (conv.id === currentConversationId) {
          return {
            ...conv,
            messages: [...conv.messages, userMessage],
          };
        }
        return conv;
      }),
    );

    setInputValue("");
    setIsLoading(true);

    try {
      // Call ai-resp API endpoint
      const response = await fetchWithAuth("/webhook/ai-resp", {
        method: "POST",
        body: JSON.stringify({
          caseId: caseId,
          caseName: caseName || `Case #${caseId}`,
          caseType: caseType || "",
          content: {
            message: messageContent,
          },
          type: "text",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content:
          data.content.message ||
          "I couldn't process your message. Please try again.",
        time: new Date().toISOString(),
        contentType: (data.type || "text") as "text" | "image" | "video",
      };

      setConversations(
        conversations.map((conv) => {
          if (conv.id === currentConversationId) {
            return {
              ...conv,
              messages: [...conv.messages, assistantMessage],
            };
          }
          return conv;
        }),
      );
    } catch (error) {
      console.error("Error sending message:", error);

      // Add error message to conversation
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        time: new Date().toISOString(),
        contentType: "text",
      };

      setConversations(
        conversations.map((conv) => {
          if (conv.id === currentConversationId) {
            return {
              ...conv,
              messages: [...conv.messages, errorMessage],
            };
          }
          return conv;
        }),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageContent = (message: ChatMessage) => {
    if (message.contentType === "text") {
      const textContent =
        typeof message.content === "string"
          ? message.content
          : (message.content as any)?.message || "";
      return (
        <p className="text-sm whitespace-pre-wrap break-words">{textContent}</p>
      );
    }

    if (message.contentType === "image") {
      const imageUrl =
        typeof message.content === "string"
          ? message.content
          : (message.content as any)?.url;
      return (
        <img
          src={imageUrl}
          alt="Shared content"
          className="max-w-xs rounded-lg"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://via.placeholder.com/300?text=Image+Not+Found";
          }}
        />
      );
    }

    if (message.contentType === "video") {
      const videoUrl =
        typeof message.content === "string"
          ? message.content
          : (message.content as any)?.url;
      return (
        <video
          src={videoUrl}
          controls
          className="max-w-xs rounded-lg"
          onError={(e) => {
            console.error("Video error:", e);
          }}
        />
      );
    }

    return <p className="text-sm">{String(message.content)}</p>;
  };

  if (!currentConversation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <div
        className={`fixed md:relative z-40 h-screen w-64 bg-card border-r border-border transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h1 className="text-lg font-bold font-display text-foreground">
              Cases
            </h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* New Chat Button */}
          <button
            onClick={handleNewConversation}
            className="m-4 flex items-center gap-2 justify-center w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-medium transition-all"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto px-2 py-4">
            <div className="space-y-2">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    setCurrentConversationId(conv.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2 truncate ${
                    currentConversationId === conv.id
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate text-sm">{conv.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="border-t border-border p-4 space-y-2">
            <button
              onClick={handleGoHome}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-secondary/10 hover:bg-secondary/20 text-secondary transition-colors font-medium text-sm"
            >
              ← Back to Cases
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors font-medium text-sm"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border bg-card">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-muted-foreground hover:text-foreground"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-foreground">
              {currentConversation?.title || "Chat"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleGoHome}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/10 hover:bg-secondary/20 text-secondary transition-colors text-sm font-medium"
            >
              ← Back
            </button>
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-8">
            {currentConversation?.messages &&
            currentConversation.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold font-display text-foreground mb-2">
                  Start your conversation
                </h3>
                <p className="text-muted-foreground max-w-sm">
                  Type a message to begin discussing this case with the
                  assistant.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {currentConversation?.messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-lg ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-br-none"
                          : "bg-muted text-foreground rounded-bl-none"
                      }`}
                    >
                      {renderMessageContent(msg)}
                      <p className="text-xs mt-1 opacity-70">
                        {new Date(msg.time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted text-foreground px-4 py-3 rounded-lg rounded-bl-none">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                        <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce delay-100" />
                        <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-border bg-card">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <Input
                type="text"
                placeholder="Send a message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                className="flex-1 h-11 border-border focus:border-primary focus:ring-primary bg-input text-foreground placeholder:text-muted-foreground"
              />
              <Button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="h-11 px-4 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground rounded-lg transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
