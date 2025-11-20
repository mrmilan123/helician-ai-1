import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, FileText, AlertCircle, Check } from "lucide-react";
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
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [textValue, setTextValue] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState("");

  const handleRadioChange = (value: string) => {
    setSelectedValues([value]);
  };

  const handleCheckboxChange = (value: string) => {
    setSelectedValues((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    setUploadError("");
    const newFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExtension = file.name.split(".").pop()?.toUpperCase() || "";

      if (message.required_formats && !message.required_formats.includes(fileExtension)) {
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

  const handleSubmit = () => {
    if (message.input_type === "text") {
      if (!textValue.trim()) return;
      onSubmit(textValue);
    } else if (message.input_type === "radio" || message.input_type === "checkbox") {
      if (selectedValues.length === 0) return;
      onSubmit(selectedValues);
    } else if (message.input_type === "document") {
      if (uploadedFiles.length === 0) return;
      const fileNames = uploadedFiles.map((f) => f.name).join(", ");
      onSubmit(fileNames);
    }

    setTextValue("");
    setSelectedValues([]);
    setUploadedFiles([]);
  };

  const handleSkip = () => {
    onSubmit("", true);
    setUploadedFiles([]);
  };

  const isSubmitDisabled = () => {
    if (isLoading) return true;

    switch (message.input_type) {
      case "text":
        return !textValue.trim();
      case "radio":
      case "checkbox":
        return selectedValues.length === 0;
      case "document":
        return uploadedFiles.length === 0;
      default:
        return true;
    }
  };

  return (
    <div className="space-y-4 w-full max-w-2xl">
      {/* Step Header */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-semibold text-sm">
            {message.step_number}
          </span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground">
            {message.step_title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{message.message}</p>
        </div>
      </div>

      {/* Input Section */}
      <div className="ml-11 space-y-3">
        {/* Text Input */}
        {message.input_type === "text" && (
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Enter your response..."
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              disabled={isLoading}
              className="h-10 border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 bg-input text-foreground placeholder:text-muted-foreground transition-all"
            />
          </div>
        )}

        {/* Radio Input */}
        {message.input_type === "radio" && (
          <div className="space-y-2">
            {message.options.map((option) => (
              <label
                key={option}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <input
                  type="radio"
                  name={`option-${message.step_number}`}
                  value={option}
                  checked={selectedValues.includes(option)}
                  onChange={() => handleRadioChange(option)}
                  disabled={isLoading}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="text-sm text-foreground">{option}</span>
              </label>
            ))}
          </div>
        )}

        {/* Checkbox Input */}
        {message.input_type === "checkbox" && (
          <div className="space-y-2">
            {message.options.map((option) => (
              <label
                key={option}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <input
                  type="checkbox"
                  value={option}
                  checked={selectedValues.includes(option)}
                  onChange={() => handleCheckboxChange(option)}
                  disabled={isLoading}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="text-sm text-foreground">{option}</span>
              </label>
            ))}
          </div>
        )}

        {/* Document Upload */}
        {message.input_type === "document" && (
          <div className="space-y-2">
            {uploadError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {uploadError}
              </div>
            )}

            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors">
              <label className="cursor-pointer flex flex-col items-center gap-2">
                <Upload className="w-6 h-6 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  Click to upload
                </span>
                <span className="text-xs text-muted-foreground">
                  or drag and drop
                </span>
                {message.required_formats && (
                  <span className="text-xs text-muted-foreground mt-1">
                    Allowed formats: {message.required_formats.join(", ")}
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
                <p className="text-xs font-medium text-muted-foreground">
                  Uploaded files:
                </p>
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 border border-border"
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
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitDisabled()}
            className="flex-1 h-10 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
          >
            <Check className="w-4 h-4 mr-2" />
            Submit
          </Button>

          {message.input_type === "document" && (
            <Button
              onClick={handleSkip}
              disabled={isLoading}
              variant="outline"
              className="h-10 px-4 rounded-lg text-sm font-medium"
            >
              Skip for Now
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
