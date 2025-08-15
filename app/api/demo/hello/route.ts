import { NextRequest } from "next/server";
import {
  createSuccessResponse,
  withErrorHandling,
} from "../../lib/error-wrapper";

/**
 * GET handler for /api/demo/hello
 */
async function handleGet(req: NextRequest) {
  // Demo successful response
  return createSuccessResponse({
    message: "Hello from the API!",
    timestamp: new Date().toISOString(),
  });
}

// Export the wrapped handler
export const GET = withErrorHandling(handleGet);
