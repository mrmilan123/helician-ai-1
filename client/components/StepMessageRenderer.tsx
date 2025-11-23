import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

      {/* Document Upload - Rendered at bottom of chat, not here */}
    </div>
  );
}
