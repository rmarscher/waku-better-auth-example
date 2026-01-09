import { getSession } from "../auth";
import { getSessionCookie } from "better-auth/cookies";
import type { MiddlewareHandler } from "hono";
import { unstable_getContextData as getContextData } from "waku/server";

const authMiddleware: () => MiddlewareHandler = () => {
  return async (c, next) => {
    const reqUrl = new URL(c.req.url);
    const sessionCookie = getSessionCookie(c.req.raw);
    // THIS IS NOT SECURE!
    // This is the recommended approach to optimistically redirect users
    // We recommend handling auth checks in each page/route
    if (
      !sessionCookie &&
      reqUrl.pathname !== "/" &&
      !reqUrl.pathname.startsWith("/api")
    ) {
      if (!reqUrl.pathname.endsWith(".txt")) {
        // Currently RSC requests end in .txt and don't handle redirect responses
        // The redirect needs to be encoded in the React flight stream somehow
        // There is some functionality in Waku to do this from a server component
        // but not from middleware.
        return c.redirect("/", 302);
      }
    }

    // TODO possible to inspect c.req.url and not do this on every request
    // Or skip starting the promise here and just invoke from server components and functions
    getSession();
    await next();
    const contextData = getContextData();
    const betterAuthSetCookie = contextData.betterAuthSetCookie as
      | string
      | undefined;
    if (betterAuthSetCookie) {
      c.header("set-cookie", betterAuthSetCookie, { append: true });
    }
  };
};

export default authMiddleware;
