export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import http from "http";
import https from "https";
import { Readable } from "stream";
import { ReadableStream as WebReadableStream } from "stream/web";

function getTargetBase(): string {
  const envTarget = process.env.BACKEND_PROXY_TARGET;
  const base = (envTarget && envTarget.trim()) || "http://localhost:8000";
  return base.replace(/\/$/, "");
}

async function proxy(
  request: Request,
  context: { params: Promise<{ path?: string[] }> }
) {
  const { path: pathFromParams = [] } = await context.params;
  const pathSegments = pathFromParams || [];
  const targetBase = getTargetBase();

  const inUrl = new URL(request.url);
  const search = inUrl.search || "";
  const targetUrl = `${targetBase}/api/${pathSegments.join("/")}${search}`;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");

  try {
    const urlObj = new URL(targetUrl);
    const isHttps = urlObj.protocol === "https:";

    const nodeHeaders: Record<string, string | string[]> = {};
    headers.forEach((value, key) => {
      nodeHeaders[key] = value;
    });

    const requestOptions: http.RequestOptions = {
      protocol: urlObj.protocol,
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: `${urlObj.pathname}${urlObj.search}`,
      method: request.method,
      headers: nodeHeaders,
    };

    return await new Promise<Response>((resolve) => {
      const client = (isHttps ? https : http).request(requestOptions, (res) => {
        // Convert Node response stream to Web ReadableStream
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const webStream = Readable.toWeb(res as unknown as Readable) as any;
        const respHeaders = new Headers();
        Object.entries(res.headers).forEach(([k, v]) => {
          if (Array.isArray(v)) {
            v.forEach((vv) => respHeaders.append(k, vv));
          } else if (v !== undefined) {
            respHeaders.set(k, String(v));
          }
        });
        resolve(
          new Response(webStream, {
            status: res.statusCode || 502,
            statusText: res.statusMessage || "Bad Gateway",
            headers: respHeaders,
          })
        );
      });

      // Disable socket timeout to allow long-running requests
      client.setTimeout(0);

      // Forward request body if present
      const body = request.body;
      if (body) {
        // Convert Web ReadableStream to Node Readable and pipe
        const nodeReadable = Readable.fromWeb(
          body as unknown as WebReadableStream
        );
        nodeReadable.pipe(client);
      } else {
        client.end();
      }

      client.on("error", (err) => {
        console.error("Proxy error to backend:", err);
        resolve(
          new Response(
            JSON.stringify({ message: "Proxy failed", error: String(err) }),
            { status: 502, headers: { "content-type": "application/json" } }
          )
        );
      });
    });
  } catch (err) {
    console.error("Proxy error to backend:", err);
    return new Response(
      JSON.stringify({ message: "Proxy failed", error: String(err) }),
      { status: 502, headers: { "content-type": "application/json" } }
    );
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path?: string[] }> }
) {
  return proxy(request, context);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ path?: string[] }> }
) {
  return proxy(request, context);
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ path?: string[] }> }
) {
  return proxy(request, context);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ path?: string[] }> }
) {
  return proxy(request, context);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ path?: string[] }> }
) {
  return proxy(request, context);
}

export async function OPTIONS(
  request: Request,
  context: { params: Promise<{ path?: string[] }> }
) {
  return proxy(request, context);
}
