import { NextRequest, NextResponse } from "next/server";

// Error types
export enum ErrorCode {
  // Client errors (4xx)
  BAD_REQUEST = "bad_request",
  UNAUTHORIZED = "unauthorized",
  FORBIDDEN = "forbidden",
  NOT_FOUND = "not_found",
  METHOD_NOT_ALLOWED = "method_not_allowed",
  VALIDATION_ERROR = "validation_error",

  // Server errors (5xx)
  INTERNAL_ERROR = "internal_error",
  SERVICE_UNAVAILABLE = "service_unavailable",
  DATABASE_ERROR = "database_error",
}

// Standard error response structure
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// Status code mapping for error codes
const statusCodeMap: Record<ErrorCode, number> = {
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.METHOD_NOT_ALLOWED]: 405,
  [ErrorCode.VALIDATION_ERROR]: 422,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.DATABASE_ERROR]: 500,
};

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: any
): NextResponse<ErrorResponse> {
  const status = statusCodeMap[code] || 500;

  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
    },
    { status }
  );
}

/**
 * Creates a successful response with standardized format
 */
export function createSuccessResponse<T>(
  data: T
): NextResponse<{ success: true; data: T }> {
  return NextResponse.json({
    success: true,
    data,
  });
}

/**
 * Higher-order function to wrap API handlers with error handling
 */
export function withErrorHandling(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(req);
    } catch (error: any) {
      console.error("API error:", error);

      // Handle known error types
      if (error.code && Object.values(ErrorCode).includes(error.code)) {
        return createErrorResponse(
          error.code,
          error.message || "An error occurred",
          error.details
        );
      }

      // Handle unknown errors
      return createErrorResponse(
        ErrorCode.INTERNAL_ERROR,
        "An unexpected error occurred",
        process.env.NODE_ENV === "development"
          ? { stack: error.stack }
          : undefined
      );
    }
  };
}
