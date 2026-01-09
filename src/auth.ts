import { betterAuth, BetterAuthPlugin } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import Database from "better-sqlite3";
import { Session } from "./lib/auth-client";
import {
  unstable_getContext as getContext,
  unstable_getContextData as getContextData,
} from "waku/server";

// Other database adapters and options are available
// https://www.better-auth.com/docs/installation#configure-database
export const auth = betterAuth({
  database: new Database("./sqlite.db"),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [wakuCookies()],
});

export function wakuCookies() {
  return {
    id: "waku-cookies",
    hooks: {
      after: [
        {
          matcher(ctx) {
            return true;
          },
          handler: createAuthMiddleware(async (ctx) => {
            const returned = ctx.context.responseHeaders;
            if ("_flag" in ctx && ctx._flag === "router") {
              return;
            }
            if (returned instanceof Headers) {
              console.log("Returned headers", Array.from(returned));
              const setCookieHeader = returned?.get("set-cookie");
              if (!setCookieHeader) return;
              const contextData = getContextData();
              contextData.betterAuthSetCookie = setCookieHeader;
              console.log("Set betterAuthSetCookie");
            }
          }),
        },
      ],
    },
  } satisfies BetterAuthPlugin;
}

export function getSession(): Promise<Session | null> {
  const contextData = getContextData();
  const ctx = getContext();
  const existingSessionPromise = contextData.sessionPromise as
    | Promise<Session | null>
    | undefined;
  if (existingSessionPromise) {
    return existingSessionPromise;
  }
  const sessionPromise = auth.api.getSession({
    headers: new Headers(ctx.req.headers),
  });
  contextData.sessionPromise = sessionPromise;
  return sessionPromise;
}
