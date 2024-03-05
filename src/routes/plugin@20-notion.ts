import type { Session } from "@auth/core/types";
import type { RequestEventCommon, RequestHandler } from "@builder.io/qwik-city";
import { Client } from "@notionhq/client";

import { getUserAccessKey } from "~/lib/common";
import { database } from "~/routes/plugin@01-database";

export const onRequest: RequestHandler = async (e) => {
  const session = e.sharedMap.get("session") as Session | undefined;
  if (!session?.user) return;
  const db = database(e);
  const accessKey = await getUserAccessKey(db, session.user.id);
  if (!accessKey) return;

  const client = new Client({ auth: accessKey });
  e.sharedMap.set("NOTION", client);
};

export function notion(e: RequestEventCommon): Client {
  return e.sharedMap.get("NOTION") as Client;
}
