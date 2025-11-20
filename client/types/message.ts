export type InputType = "radio" | "checkbox" | "document" | "text";

export interface StepMessage {
  step_number: string;
  step_title: string;
  message: string;
  options: string[];
  input_type: InputType;
  required_formats?: string[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string | StepMessage;
  time: string;
  contentType: "text" | "image" | "video" | "step";
  caseType?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  caseType?: string;
}

export const isStepMessage = (content: any): content is StepMessage => {
  return (
    typeof content === "object" &&
    content !== null &&
    "step_number" in content &&
    "step_title" in content &&
    "message" in content &&
    "input_type" in content &&
    Array.isArray(content.options)
  );
};
