import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch";

interface AddCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (caseData: any) => void;
}

const CASE_TYPES = [
  "Consumer complaint",
  "Contract dispute",
  "Property dispute",
];

export default function AddCaseModal({
  isOpen,
  onClose,
  onSuccess,
}: AddCaseModalProps) {
  const fetchWithAuth = useAuthenticatedFetch();
  const [caseName, setCaseName] = useState("");
  const [caseType, setCaseType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!caseName.trim()) {
      setError("Case name is required");
      return;
    }

    if (!caseType) {
      setError("Case type is required");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetchWithAuth("/webhook/create-case", {
        method: "POST",
        body: JSON.stringify({
          name: caseName,
          type: caseType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create case");
      }

      const data = await response.json();

      // Call onSuccess with the new case data
      onSuccess({
        caseId: data.caseId,
        name: data.name,
        type: data.type,
        createdOn: new Date().toISOString(),
        lastModifiedOn: new Date().toISOString(),
      });

      // Reset form
      setCaseName("");
      setCaseType("");
    } catch (err) {
      setError("Failed to create case. Please try again.");
      console.error("Error creating case:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset form when closing
      setCaseName("");
      setCaseType("");
      setError("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            Create New Case
          </DialogTitle>
          <DialogDescription>
            Add a new case to start managing your legal matters
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-gap-2">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Case Name Field */}
          <div className="space-y-2">
            <Label htmlFor="case-name" className="text-sm font-medium">
              Case Name
            </Label>
            <Input
              id="case-name"
              type="text"
              placeholder="e.g., Smith vs. Company Ltd."
              value={caseName}
              onChange={(e) => setCaseName(e.target.value)}
              disabled={isLoading}
              className="h-10 border-border focus:border-primary focus:ring-primary bg-input text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Case Type Field */}
          <div className="space-y-2">
            <Label htmlFor="case-type" className="text-sm font-medium">
              Case Type
            </Label>
            <Select
              value={caseType}
              onValueChange={setCaseType}
              disabled={isLoading}
            >
              <SelectTrigger className="h-10 border-border focus:border-primary focus:ring-primary bg-input text-foreground">
                <SelectValue placeholder="Select case type" />
              </SelectTrigger>
              <SelectContent>
                {CASE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground"
            >
              {isLoading ? "Creating..." : "Create Case"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
