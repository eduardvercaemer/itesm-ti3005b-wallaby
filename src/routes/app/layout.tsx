import { component$, Slot } from "@builder.io/qwik";
import type { RequestHandler } from "@builder.io/qwik-city";
import { routeLoader$ } from "@builder.io/qwik-city";
import { z, zod$ } from "@builder.io/qwik-city";
import { routeAction$ } from "@builder.io/qwik-city";

import { Navbar } from "~/components/navigation/navbar";
import { authGuard } from "~/lib/auth-guard";
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

export const useDateQuery = routeLoader$((e) => {
  const dateString = e.query.get("date");
  return dateString ? new Date(dateString) : null;
});

// noinspection JSUnusedGlobalSymbols
export const onRequest: RequestHandler = async (event) => {
  authGuard(event);
};

export default component$(() => {
  const updateDatabaseId = useUpdateDatabaseIdAction();
  const date = useDateQuery();

  return (
    <div class="flex h-screen w-screen flex-col">
      <Navbar
        updateDatabaseIdAction={updateDatabaseId}
        initialDate={date.value}
      />
      <main class="flex grow flex-col overflow-y-hidden">
        <Slot />
      </main>
    </div>
  );
});
