export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    status: number;
  };
}

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface FetchOptions {
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
}

/**
 * Core API client to handle HTTP requests with standardized error handling
 */
export async function apiClient<T = any>(
  endpoint: string,
  options: FetchOptions
): Promise<ApiResponse<T>> {
  const { method, headers = {}, body } = options;

  const requestOptions: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    credentials: "include",
  };

  if (body && method !== "GET") {
    requestOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${endpoint}`, requestOptions);
    const data = await response.json();

    if (!response.ok) {
      // Handle API error responses
      return {
        success: false,
        error: {
          code: data.error?.code || "unknown_error",
          message: data.error?.message || "An unknown error occurred",
          status: response.status,
        },
      };
    }

    return { success: true, data };
  } catch (error) {
    // Handle network/fetch errors
    console.error("API request failed:", error);
    return {
      success: false,
      error: {
        code: "network_error",
        message: "Failed to connect to the server",
        status: 500,
      },
    };
  }
}

// Convenience methods for different HTTP verbs
export const api = {
  get: <T>(endpoint: string, headers?: Record<string, string>) =>
    apiClient<T>(endpoint, { method: "GET", headers }),

  post: <T>(endpoint: string, body?: any, headers?: Record<string, string>) =>
    apiClient<T>(endpoint, { method: "POST", body, headers }),

  put: <T>(endpoint: string, body?: any, headers?: Record<string, string>) =>
    apiClient<T>(endpoint, { method: "PUT", body, headers }),

  delete: <T>(endpoint: string, headers?: Record<string, string>) =>
    apiClient<T>(endpoint, { method: "DELETE", headers }),

  patch: <T>(endpoint: string, body?: any, headers?: Record<string, string>) =>
    apiClient<T>(endpoint, { method: "PATCH", body, headers }),
};
