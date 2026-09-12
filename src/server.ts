import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}
type RuntimeEnv = Record<string, string | undefined>;

const N8N_PROXY_PATH = "/api/n8n-mongo";
const N8N_AUTH_PROXY_PATH = "/api/n8n-auth";

function getN8nWebhookUrl(env: unknown): string | undefined {
  if (env != null && typeof env === "object" && "N8N_MONGO_WEBHOOK_URL" in env) {
    const value = (env as RuntimeEnv)["N8N_MONGO_WEBHOOK_URL"];
    if (value) return value;
  }
  return process.env["N8N_MONGO_WEBHOOK_URL"];
}

function getN8nAuthWebhookUrl(env: unknown): string | undefined {
  if (env != null && typeof env === "object" && "N8N_AUTH_WEBHOOK_URL" in env) {
    const value = (env as RuntimeEnv)["N8N_AUTH_WEBHOOK_URL"];
    if (value) return value;
  }
  return process.env["N8N_AUTH_WEBHOOK_URL"];
}

async function proxyN8nMongoWebhook(request: Request, env: unknown): Promise<Response> {
  if (request.method !== "POST") {
    return Response.json({ ok: false, message: "Method not allowed" }, { status: 405 });
  }

  const webhookUrl = getN8nWebhookUrl(env);
  if (!webhookUrl) {
    return Response.json({ ok: false, message: "N8N_MONGO_WEBHOOK_URL is not configured" }, { status: 500 });
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });

  return new Response(await response.text(), {
    status: response.status,
    headers: { "Content-Type": response.headers.get("Content-Type") ?? "application/json" },
  });
}

async function proxyN8nAuthWebhook(request: Request, env: unknown): Promise<Response> {
  if (request.method !== "POST") {
    return Response.json({ ok: false, message: "Method not allowed" }, { status: 405 });
  }

  const webhookUrl = getN8nAuthWebhookUrl(env);
  if (!webhookUrl) {
    return Response.json({ ok: false, message: "N8N_AUTH_WEBHOOK_URL is not configured" }, { status: 500 });
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });

  return new Response(await response.text(), {
    status: response.status,
    headers: { "Content-Type": response.headers.get("Content-Type") ?? "application/json" },
  });
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const pathname = new URL(request.url).pathname;
      if (pathname === N8N_PROXY_PATH) {
        return await proxyN8nMongoWebhook(request, env);
      }
      if (pathname === N8N_AUTH_PROXY_PATH) {
        return await proxyN8nAuthWebhook(request, env);
      }
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
