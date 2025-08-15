export interface OpenAIConfig {
  endpoint: string;
  model: string;
  apiKey: string;
  type: "openai";
}

export interface GeminiConfig {
  apiKey: string;
  model?: string;
  type: "gemini";
}

export type ModelConfig = OpenAIConfig | GeminiConfig;

export type LLMModelType = "openai" | "gemini";

export interface LLMRequest {
  userInput: string;
  modelType: LLMModelType;
}
