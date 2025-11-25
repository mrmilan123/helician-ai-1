import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import type { StepMessage } from "@/types/message";

interface StepMessageRendererProps {
  message: StepMessage;
  onSubmit: (value: string | string[] | File[], skipDocument?: boolean) => void;
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
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const validateFiles = (files: File[]): File[] => {
    setUploadError("");
    const validFiles: File[] = [];

    for (const file of files) {
      const fileExtension = file.name.split(".").pop()?.toUpperCase() || "";

      if (
        message.required_formats &&
        !message.required_formats.includes(fileExtension)
      ) {
        setUploadError(
          `Invalid format: ${fileExtension}. Allowed: ${message.required_formats.join(", ")}`
        );
        continue;
      }

      validFiles.push(file);
    }

    return validFiles;
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    const validFiles = validateFiles(Array.from(files));
    setUploadedFiles((prev) => [...prev, ...validFiles]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files) {
      const validFiles = validateFiles(Array.from(e.dataTransfer.files));
      setUploadedFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDocumentSubmit = () => {
    if (uploadedFiles.length > 0) {
      onSubmit(uploadedFiles);
      setUploadedFiles([]);
    }
  };

  const handleSkip = () => {
    onSubmit("", true);
    setUploadedFiles([]);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    return <FileText className="w-5 h-5 text-blue-500" />;
  };

  return (
    <div className="w-full space-y-4">
      {/* Message Only */}
      <p className="text-sm whitespace-pre-wrap break-words text-foreground font-medium">
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
              className="px-4 py-2.5 rounded-full border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {/* Checkbox Options */}
      {message.input_type === "checkbox" && message.options.length > 0 && (
        <div className="space-y-3 pt-2">
          {message.options.map((option) => (
            <label
              key={option}
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
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
              className="mt-3 px-5 py-2.5 rounded-lg bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="h-11 border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 bg-input text-foreground placeholder:text-muted-foreground transition-all"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send
          </p>
        </div>
      )}

      {/* Document/File Upload */}
      {(message.input_type === "document" || message.input_type === "file") && (
        <div className="space-y-3 pt-2">
          {uploadError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{uploadError}</span>
            </div>
          )}

          {uploadedFiles.length === 0 ? (
            <>
              {/* File Upload Input Area - Like text input */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative flex items-center gap-2 px-4 py-3 border rounded-lg transition-all ${
                  dragActive
                    ? "border-primary/80 bg-primary/5"
                    : "border-border hover:border-primary/50 bg-input"
                }`}
              >
                <Upload className={`w-5 h-5 flex-shrink-0 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <label className="cursor-pointer flex-1">
                  <span className={`text-sm ${dragActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                    {dragActive ? "Drop files here" : "Click to upload or drag and drop"}
                  </span>
                  <input
                    ref={fileInputRef}
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
                      .filter(Boolean)
                      .join(",")}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Skip Button - Same row for better UX */}
              <button
                onClick={handleSkip}
                disabled={isLoading}
                className="w-full px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Skip for now
              </button>
            </>
          ) : (
            <>
              {/* Uploaded Files List */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-foreground">
                    {uploadedFiles.length} {uploadedFiles.length === 1 ? "file" : "files"} selected
                  </span>
                </div>

                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border hover:bg-muted/60 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {getFileIcon(file.name)}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {file.name}
                        </p>
                        {file.size && (
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      disabled={isLoading}
                      className="ml-2 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}

                {/* Add More Files Option */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="w-full px-4 py-2 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors disabled:opacity-50"
                >
                  + Add more files
                </button>

                {/* Submit & Skip Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleDocumentSubmit}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Uploading..." : "Upload"}
                  </button>
                  <button
                    onClick={handleSkip}
                    disabled={isLoading}
                    className="px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Skip
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
