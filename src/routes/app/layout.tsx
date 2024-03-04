import type { Session } from "@auth/core/types";
import { component$, Slot } from "@builder.io/qwik";
import type { RequestHandler } from "@builder.io/qwik-city";
import { z, zod$ } from "@builder.io/qwik-city";
import { routeAction$ } from "@builder.io/qwik-city";

import { Navbar } from "~/components/navigation/navbar";
import { setDatabaseId } from "~/lib/common";
import { database } from "~/routes/plugin@01-database";

export const useUpdateDatabaseIdAction = routeAction$(
  async (data, e) => {
    const db = database(e);
    await setDatabaseId(db, data.databaseId);
  },
  zod$({
    databaseId: z.string(),
  }),
);

// noinspection JSUnusedGlobalSymbols
export const onRequest: RequestHandler = async (event) => {
  const session: Session | null = event.sharedMap.get("session");
  if (!session || new Date(session.expires) < new Date()) {
    throw event.redirect(
      302,
      `/api/auth/signin?callbackUrl=${event.url.pathname}`,
    );
  }
};

export default component$(() => {
  const updateDatabaseId = useUpdateDatabaseIdAction();

  return (
    <div class="flex h-screen w-screen flex-col">
      <Navbar updateDatabaseIdAction={updateDatabaseId} />
      <main class="flex grow flex-col">
        <Slot />
      </main>
    </div>
  );
});
