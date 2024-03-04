import type { RequestEventCommon, RequestHandler } from "@builder.io/qwik-city";
import { Client } from "@notionhq/client";

export const onRequest: RequestHandler = async (e) => {
  const client = new Client({ auth: e.env.get("NOTION_API_KEY") });
  e.sharedMap.set("NOTION", client);
};

export function notion(e: RequestEventCommon): Client {
  return e.sharedMap.get("NOTION") as Client;
}
