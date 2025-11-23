import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, Send, Plus, MessageSquare, Menu, X, Loader } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch";
import StepMessageRenderer from "@/components/StepMessageRenderer";
import type { ChatMessage, Conversation, StepMessage } from "@/types/message";
import { isStepMessage as checkIsStepMessage } from "@/types/message";

export default function Chat() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const fetchWithAuth = useAuthenticatedFetch();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
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
            const messageContent = chatInitData.content?.message || chatInitData.content;

            let contentType: "text" | "image" | "video" | "step" = (chatInitData.type || "text") as any;

            if (checkIsStepMessage(messageContent)) {
              contentType = "step";
            }

            messages = [
              {
                role: "assistant" as const,
                content: messageContent,
                time: new Date().toISOString(),
                contentType,
                caseType: caseType,
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
          caseType: caseType,
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
          caseType: caseType,
        };
        setConversations([caseConversation]);
        setCurrentConversationId(convId);
      } finally {
        setIsInitializing(false);
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

  const handleStepSubmit = async (value: string | string[] | File[], skipDocument?: boolean) => {
    if (!currentConversation) {
      return;
    }

    let userMessage: ChatMessage;
    const isFileUpload = Array.isArray(value) && value.length > 0 && value[0] instanceof File;

    if (skipDocument) {
      userMessage = {
        role: "user",
        content: "Skip for now",
        time: new Date().toISOString(),
        contentType: "text",
        caseType: caseType,
      };
    } else if (isFileUpload) {
      const files = value as File[];
      const fileNames = files.map((f) => f.name).join(", ");
      userMessage = {
        role: "user",
        content: `Uploaded: ${fileNames}`,
        time: new Date().toISOString(),
        contentType: "text",
        caseType: caseType,
      };
    } else {
      const displayValue = Array.isArray(value) ? value.join(", ") : value;
      userMessage = {
        role: "user",
        content: displayValue,
        time: new Date().toISOString(),
        contentType: "text",
        caseType: caseType,
      };
    }

    // Add user message first
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === currentConversationId) {
          return {
            ...conv,
            messages: [...conv.messages, userMessage],
          };
        }
        return conv;
      }),
    );

    setIsLoading(true);

    try {
      let response: Response;

      if (isFileUpload) {
        // Handle file upload with FormData
        const formData = new FormData();
        const files = value as File[];
        files.forEach((file, index) => {
          formData.append(`file_${index}`, file);
        });
        formData.append("caseId", caseId);
        formData.append("caseName", caseName || `Case #${caseId}`);
        formData.append("caseType", caseType || "");
        formData.append("type", "document");

        response = await fetchWithAuth("/webhook/ai-resp", {
          method: "POST",
          body: formData,
        });
      } else {
        // Handle text submission with JSON
        response = await fetchWithAuth("/webhook/ai-resp", {
          method: "POST",
          body: JSON.stringify({
            caseId: caseId,
            caseName: caseName || `Case #${caseId}`,
            caseType: caseType || "",
            content: {
              message: Array.isArray(value) ? value.join(", ") : value,
            },
            type: "text",
          }),
        });
      }

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();

      let assistantMessage: ChatMessage;

      if (checkIsStepMessage(data.content?.message || data.content)) {
        const stepMsg = data.content?.message || data.content;
        assistantMessage = {
          role: "assistant",
          content: stepMsg,
          time: new Date().toISOString(),
          contentType: "step",
          caseType: data.caseType || caseType,
        };
      } else {
        assistantMessage = {
          role: "assistant",
          content:
            data.content?.message ||
            data.content ||
            "I couldn't process your message. Please try again.",
          time: new Date().toISOString(),
          contentType: (data.type || "text") as "text" | "image" | "video",
          caseType: data.caseType || caseType,
        };
      }

      // Add assistant message using updater function to ensure previous state is included
      setConversations((prev) =>
        prev.map((conv) => {
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

      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        time: new Date().toISOString(),
        contentType: "text",
        caseType: caseType,
      };

      // Add error message using updater function
      setConversations((prev) =>
        prev.map((conv) => {
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
      caseType: caseType,
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
      const messageContent = data.content?.message || data.content;

      let contentType: "text" | "image" | "video" | "step" = (data.type || "text") as any;

      if (checkIsStepMessage(messageContent)) {
        contentType = "step";
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: messageContent || "I couldn't process your message. Please try again.",
        time: new Date().toISOString(),
        contentType,
        caseType: data.caseType || caseType,
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
        caseType: caseType,
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
    if (message.contentType === "step") {
      const stepMessage = message.content as StepMessage;
      return (
        <div className="bg-muted/30 rounded-lg p-4 border border-border">
          <StepMessageRenderer
            message={stepMessage}
            onSubmit={handleStepSubmit}
            isLoading={isLoading}
          />
        </div>
      );
    }

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

  if (!currentConversation || isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background/80 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto animate-pulse">
            <Loader className="w-8 h-8 text-primary animate-spin" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-foreground">Initializing chat...</p>
            <p className="text-sm text-muted-foreground">Setting up your case conversation</p>
          </div>
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
        <div className="border-b border-border bg-gradient-to-r from-card to-card/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center justify-between h-20 px-4 md:px-6">
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-foreground line-clamp-1">
                  {currentConversation?.title || "Chat"}
                </h2>
                {caseType && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary">
                      {caseType}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-background to-background/50">
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
            {currentConversation?.messages &&
            currentConversation.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center min-h-96">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-6">
                  <MessageSquare className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold font-display text-foreground mb-3">
                  Start your conversation
                </h3>
                <p className="text-base text-muted-foreground max-w-sm mb-6">
                  Type a message below to begin discussing this case with the
                  assistant.
                </p>
                <div className="px-4 py-3 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground">
                  The assistant is ready to help with your <span className="font-semibold text-foreground">{caseType}</span> case
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {currentConversation?.messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    } animate-in fade-in slide-in-from-bottom-2 duration-300`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0 mt-1">
                        <MessageSquare className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`${
                        msg.contentType === "step" ? "max-w-2xl" : "max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg"
                      } ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-2xl rounded-tr-md shadow-lg"
                          : "bg-muted/60 border border-border text-foreground rounded-2xl rounded-tl-md"
                      } px-4 py-3`}
                    >
                      {renderMessageContent(msg)}
                      <p className={`text-xs mt-2 ${
                        msg.role === "user"
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}>
                        {new Date(msg.time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-xs font-bold text-primary-foreground">You</span>
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start gap-3 animate-in fade-in duration-200">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <MessageSquare className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-muted/60 border border-border text-foreground px-4 py-3 rounded-2xl rounded-tl-md">
                      <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Area - Only show if last message is not a step message */}
        {currentConversation?.messages &&
        currentConversation.messages.length > 0 &&
        currentConversation.messages[currentConversation.messages.length - 1]
          ?.contentType !== "step" ? (
          <div className="border-t border-border bg-gradient-to-t from-card to-card/50 backdrop-blur-sm sticky bottom-0">
            <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Type your message here..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isLoading}
                  className="flex-1 h-12 border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 bg-input text-foreground placeholder:text-muted-foreground transition-all"
                />
                <Button
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                  className="h-12 px-5 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isLoading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
