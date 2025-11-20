import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, FileText, AlertCircle } from "lucide-react";
import type { StepMessage } from "@/types/message";

interface StepMessageRendererProps {
  message: StepMessage;
  onSubmit: (value: string | string[], skipDocument?: boolean) => void;
  isLoading?: boolean;
}

export default function StepMessageRenderer({
  message,
  onSubmit,
  isLoading = false,
}: StepMessageRendererProps) {
  const [selectedValue, setSelectedValue] = useState<string>("");
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [textValue, setTextValue] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState("");

  const handleRadioSelect = (value: string) => {
    setSelectedValue(value);
    onSubmit(value);
  };

  const handleCheckboxChange = (value: string) => {
    setSelectedValues((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleCheckboxSubmit = () => {
    if (selectedValues.length > 0) {
      onSubmit(selectedValues);
      setSelectedValues([]);
    }
  };

  const handleTextSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && textValue.trim() && !isLoading) {
      onSubmit(textValue);
      setTextValue("");
    }
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    setUploadError("");
    const newFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExtension = file.name.split(".").pop()?.toUpperCase() || "";

      if (
        message.required_formats &&
        !message.required_formats.includes(fileExtension)
      ) {
        setUploadError(
          `Invalid format: ${fileExtension}. Allowed formats: ${message.required_formats.join(", ")}`
        );
        continue;
      }

      newFiles.push(file);
    }

    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDocumentSubmit = () => {
    if (uploadedFiles.length > 0) {
      const fileNames = uploadedFiles.map((f) => f.name).join(", ");
      onSubmit(fileNames);
      setUploadedFiles([]);
    }
  };

  const handleSkip = () => {
    onSubmit("", true);
    setUploadedFiles([]);
  };

  return (
    <div className="w-full space-y-3">
      {/* Message Only */}
      <p className="text-sm whitespace-pre-wrap break-words text-foreground">
        {message.message}
      </p>

      {/* Radio Options - Floating Buttons */}
      {message.input_type === "radio" && message.options.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {message.options.map((option) => (
            <button
              key={option}
              onClick={() => handleRadioSelect(option)}
              disabled={isLoading}
              className="px-3 py-2 rounded-full border border-primary bg-primary/10 text-primary hover:bg-primary/20 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {/* Checkbox Options */}
      {message.input_type === "checkbox" && message.options.length > 0 && (
        <div className="space-y-2 pt-2">
          {message.options.map((option) => (
            <label
              key={option}
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <input
                type="checkbox"
                value={option}
                checked={selectedValues.includes(option)}
                onChange={() => handleCheckboxChange(option)}
                disabled={isLoading}
                className="w-4 h-4 cursor-pointer accent-primary"
              />
              <span className="text-sm text-foreground">{option}</span>
            </label>
          ))}

          {/* Submit/Continue Button - Shows only after selection */}
          {selectedValues.length > 0 && (
            <button
              onClick={handleCheckboxSubmit}
              disabled={isLoading}
              className="mt-3 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          )}
        </div>
      )}

      {/* Text Input */}
      {message.input_type === "text" && (
        <div className="pt-2">
          <Input
            type="text"
            placeholder="Type your response..."
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onKeyDown={handleTextSubmit}
            disabled={isLoading}
            className="h-10 border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 bg-input text-foreground placeholder:text-muted-foreground transition-all"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Press Enter to send
          </p>
        </div>
      )}

      {/* Document Upload */}
      {message.input_type === "document" && (
        <div className="space-y-2 pt-2">
          {uploadError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {uploadError}
            </div>
          )}

          {/* File Upload Area */}
          <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors">
            <label className="cursor-pointer flex flex-col items-center gap-2">
              <Upload className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                Click to upload
              </span>
              <span className="text-xs text-muted-foreground">
                or drag and drop
              </span>
              {message.required_formats && (
                <span className="text-xs text-muted-foreground mt-1">
                  Allowed: {message.required_formats.join(", ")}
                </span>
              )}
              <input
                type="file"
                multiple
                onChange={(e) => handleFileUpload(e.target.files)}
                disabled={isLoading}
                accept={message.required_formats
                  ?.map((fmt) => {
                    switch (fmt) {
                      case "PDF":
                        return ".pdf";
                      case "JPG":
                        return ".jpg,.jpeg";
                      case "PNG":
                        return ".png";
                      case "MP4":
                        return ".mp4";
                      default:
                        return "";
                    }
                  })
                  .join(",")}
                className="hidden"
              />
            </label>
          </div>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-foreground truncate">
                      {file.name}
                    </span>
                    {file.size && (
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        ({(file.size / 1024).toFixed(1)}KB)
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    disabled={isLoading}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Upload & Skip Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleDocumentSubmit}
                  disabled={isLoading || uploadedFiles.length === 0}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit
                </button>
                <button
                  onClick={handleSkip}
                  disabled={isLoading}
                  className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Skip
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
