import { component$, useVisibleTask$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";

import { getSchedule } from "~/lib/common";
import { database } from "~/routes/plugin@01-database";
import { notion } from "~/routes/plugin@02-notion";
import { useAuthSession } from "~/routes/plugin@10-auth";

export const useNotionLoader = routeLoader$(async (e) => {
  const db = database(e);
  const no = notion(e);
  return getSchedule(db, no);
});

export default component$(() => {
  const session = useAuthSession();
  const notionData = useNotionLoader();

  useVisibleTask$(() => {
    console.debug(notionData.value);
  });

  return (
    <>
      <h1>app</h1>
      <h2>{session.value!.user!.name}</h2>
      <h2>{session.value!.user!.email}</h2>
    </>
  );
});
