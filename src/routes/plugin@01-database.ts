import type { RequestEventCommon, RequestHandler } from "@builder.io/qwik-city";
import type { D1Database } from "@cloudflare/workers-types";
import { binding } from "cf-bindings-proxy";

import { isPages } from "~/routes/plugin@00-pages";

export const onRequest: RequestHandler = async (e) => {
  let db: D1Database;
  if (isPages(e)) {
    db = e.platform.env!["DB"];
  } else {
    /**
     * LOCAL DEVELOPMENT
     * USE PROXY BINDINGS
     */
    db = binding<D1Database>("DB");
  }

  e.sharedMap.set("DATABASE", db);
};

export function database(e: RequestEventCommon): D1Database {
  return e.sharedMap.get("DATABASE") as D1Database;
}
