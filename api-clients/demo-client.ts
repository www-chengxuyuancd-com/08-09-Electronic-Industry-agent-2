import { api, ApiResponse } from "@/lib/api-client";

// Demo API interfaces
export interface HelloResponse {
  message: string;
  timestamp: string;
}

/**
 * Demo API client for demonstration purposes
 *
 * This client only handles API requests without UI notifications.
 * Toast notifications should be handled in client components.
 */
export const demoClient = {
  /**
   * Calls the hello endpoint
   */
  hello: async (): Promise<ApiResponse<HelloResponse>> => {
    return api.get<HelloResponse>("/api/demo/hello");
  },

  /**
   * Calls the error endpoint to demonstrate error handling
   */
  triggerError: async (): Promise<ApiResponse<never>> => {
    return api.get("/api/demo/error");
  },
};
