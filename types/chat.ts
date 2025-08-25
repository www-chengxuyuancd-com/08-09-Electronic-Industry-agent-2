export interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  thinking?: string;
  sql?: string;
  queryResults?: any[];
  error?: string;
  entityType?: string;
  entityName?: string;
}

export interface ChatState {
  messages: ChatMessage[];
  isThinking: boolean;
  currentThinking: string;
}
