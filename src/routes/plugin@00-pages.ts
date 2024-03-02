import type { RequestEventCommon, RequestHandler } from "@builder.io/qwik-city";

export const onRequest: RequestHandler = (e) => {
  const isPages = !!e.env.get("CF_PAGES");
  e.sharedMap.set("PAGES", isPages);
};

export function isPages(e: RequestEventCommon): boolean {
  return e.sharedMap.get("PAGES") as boolean;
}
