import { NextRequest } from "next/server";
import {
  createErrorResponse,
  withErrorHandling,
  ErrorCode,
} from "../../lib/error-wrapper";

/**
 * GET handler for /api/demo/error
 */
async function handleGet(req: NextRequest) {
  // Demo error response
  return createErrorResponse(
    ErrorCode.BAD_REQUEST,
    "This is a demonstration of error handling",
    { demo: true }
  );
}

// Export the wrapped handler
export const GET = withErrorHandling(handleGet);
