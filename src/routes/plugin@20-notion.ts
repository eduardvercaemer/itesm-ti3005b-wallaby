import type { Session } from "@auth/core/types";
import type { RequestEventCommon, RequestHandler } from "@builder.io/qwik-city";
import { Client } from "@notionhq/client";

export const onRequest: RequestHandler = async (e) => {
  const session = e.sharedMap.get("session") as Session | undefined;
  if (!session?.user) return;

  const client = new Client({ auth: session.accessToken });
  e.sharedMap.set("NOTION", client);
};

export function notion(e: RequestEventCommon): Client {
  return e.sharedMap.get("NOTION") as Client;
}
