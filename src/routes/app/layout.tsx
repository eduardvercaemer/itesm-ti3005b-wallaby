import { component$, Slot } from "@builder.io/qwik";
import type { RequestHandler } from "@builder.io/qwik-city";
import { routeLoader$ } from "@builder.io/qwik-city";
import { z, zod$ } from "@builder.io/qwik-city";
import { routeAction$ } from "@builder.io/qwik-city";

import { Navbar } from "~/components/navigation/navbar";
import { authGuard } from "~/lib/auth-guard";
import { fetchFullScheduleFromNotion } from "~/lib/notion";
import { getDatabaseId, setDatabaseId } from "~/lib/settings";
import { database } from "~/routes/plugin@01-database";
import { notion } from "~/routes/plugin@20-notion";

export const useUpdateDatabaseIdAction = routeAction$(
  async (data, e) => {
    const db = database(e);
    await setDatabaseId(db, data.databaseId);
  },
  zod$({
    databaseId: z.string(),
  }),
);

export const useRefreshNotionAction = routeAction$(async (_, e) => {
  const db = database(e);
  const no = notion(e);
  const databaseId = await getDatabaseId(db);

  if (!databaseId) {
    return { error: "DATABASE_ID_NOT_SET" };
  }

  try {
    await fetchFullScheduleFromNotion(db, no, databaseId);
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "FAILED_TO_FETCH_NOTION_SCHEDULE" };
  }
});

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
  const refreshNotion = useRefreshNotionAction();
  const date = useDateQuery();

  return (
    <div class="flex h-screen w-screen flex-col">
      <Navbar
        refreshNotionAction={refreshNotion}
        updateDatabaseIdAction={updateDatabaseId}
        initialDate={date.value}
      />
      <main class="flex grow flex-col overflow-y-hidden">
        <Slot />
      </main>
    </div>
  );
});
