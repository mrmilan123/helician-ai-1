import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Plus,
  Calendar,
  User,
  Users,
  Briefcase,
  AlertCircle,
  Loader,
} from "lucide-react";
import AddCaseModal from "@/components/AddCaseModal";
import { useAuth } from "@/context/AuthContext";
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch";
import { isStepMessage } from "@/types/message";
import type { ChatMessage } from "@/types/message";

interface UserDetails {
  id: number;
  userName: string;
  age: number;
  gender: string;
  email: string;
}

interface Case {
  caseId: number;
  name: string;
  type: string;
  createdOn: string;
  lastModifiedOn: string;
}

export default function Home() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const fetchWithAuth = useAuthenticatedFetch();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddCaseModal, setShowAddCaseModal] = useState(false);

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const fetchUserDetails = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await fetchWithAuth("/webhook/user-details");

      if (!response.ok) {
        throw new Error("Failed to fetch user details");
      }

      const data = await response.json();
      setUserDetails({
        id: data.id,
        userName: data.name,
        age: data.age,
        gender: data.gender,
        email: data.email,
      });
      setCases(data.cases || []);
    } catch (err) {
      setError("Failed to load user details. Please try again.");
      console.error("Error fetching user details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCaseClick = async (caseId: number) => {
    try {
      setIsLoading(true);
      const response = await fetchWithAuth("/webhook/load-case-conversation", {
        method: "POST",
        body: JSON.stringify({ caseId }),
      });

      if (!response.ok) {
        throw new Error("Failed to load case conversation");
      }

      const data = await response.json();
      // Find the case details from the cases array
      const selectedCase = cases.find((c) => c.caseId === caseId);

      // Navigate to chat with case data
      navigate("/chat", {
        state: {
          caseId,
          chatData: data.chat,
          caseName: selectedCase?.name,
          caseType: selectedCase?.type,
        },
      });
    } catch (err) {
      setError("Failed to load case. Please try again.");
      console.error("Error loading case:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCaseSuccess = async (newCase: Case) => {
    setCases([...cases, newCase]);
    setShowAddCaseModal(false);

    try {
      setIsLoading(true);
      setError("");

      // Call initiate-chat API
      const response = await fetchWithAuth("/webhook/initiate-chat", {
        method: "POST",
        body: JSON.stringify({
          caseId: newCase.caseId,
          caseName: newCase.name,
          caseType: newCase.type,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to initiate chat");
      }

      const chatInitData = await response.json();
      const messageContent = chatInitData.content?.message || chatInitData.content;

      let contentType: "text" | "image" | "video" | "step" = (chatInitData.type || "text") as any;
      if (isStepMessage(messageContent)) {
        contentType = "step";
      }

      // Create initial AI message from the initiate-chat response
      const initialMessage: ChatMessage = {
        role: "assistant",
        content: messageContent,
        time: new Date().toISOString(),
        contentType,
      };

      // Navigate to chat-screen with case data and initial message
      navigate("/chat-screen", {
        state: {
          caseId: newCase.caseId,
          chatData: [initialMessage],
          caseName: newCase.name,
          caseType: newCase.type,
          isNewCase: true,
        },
      });
    } catch (err) {
      setError("Failed to create case and initiate chat. Please try again.");
      console.error("Error initiating chat:", err);
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const getCaseTypeColor = (type: string) => {
    switch (type) {
      case "Consumer complaint":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Contract dispute":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "Property dispute":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (isLoading && !userDetails) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-card backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold font-display text-foreground">
            Case Manager
          </h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </nav>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-gap-2">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Details Card */}
        {userDetails && (
          <div className="mb-8 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl border border-primary/20 p-6 sm:p-8">
            <div className="grid md:grid-cols-4 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="text-lg font-semibold text-foreground">
                    {userDetails.userName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Age</p>
                  <p className="text-lg font-semibold text-foreground">
                    {userDetails.age}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="text-lg font-semibold text-foreground capitalize">
                    {userDetails.gender}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cases</p>
                  <p className="text-lg font-semibold text-foreground">
                    {cases.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cases Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold font-display text-foreground">
              Your Cases
            </h2>
            <Button
              onClick={() => setShowAddCaseModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground rounded-lg"
            >
              <Plus className="w-4 h-4" />
              Add New Case
            </Button>
          </div>

          {cases.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border">
              <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No cases yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Create your first case to get started
              </p>
              <Button
                onClick={() => setShowAddCaseModal(true)}
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground rounded-lg"
              >
                Create Case
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {cases.map((caseItem) => (
                <button
                  key={caseItem.caseId}
                  onClick={() => handleCaseClick(caseItem.caseId)}
                  className="text-left p-6 bg-card rounded-xl border border-border hover:border-primary hover:shadow-lg transition-all hover:shadow-primary/20 group"
                  disabled={isLoading}
                >
                  {/* Case Header */}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {caseItem.name}
                    </h3>
                    <span
                      className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${getCaseTypeColor(
                        caseItem.type,
                      )}`}
                    >
                      {caseItem.type}
                    </span>
                  </div>

                  {/* Case Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created on</span>
                      <span className="text-foreground font-medium">
                        {formatDate(caseItem.createdOn)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Last updated
                      </span>
                      <span className="text-foreground font-medium">
                        {formatDate(caseItem.lastModifiedOn)}
                      </span>
                    </div>
                  </div>

                  {/* Click to open hint */}
                  <div className="mt-4 pt-4 border-t border-border text-primary text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to view conversation →
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Case Modal */}
      <AddCaseModal
        isOpen={showAddCaseModal}
        onClose={() => setShowAddCaseModal(false)}
        onSuccess={handleAddCaseSuccess}
      />
    </div>
  );
}
