import { component$, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { routeLoader$ } from "@builder.io/qwik-city";

import { isPages } from "~/routes/plugin@00-pages";
import { database } from "~/routes/plugin@01-database";

export const usePages = routeLoader$((e) => isPages(e));

export const useSettings = routeLoader$(async (e) => {
  const db = database(e);
  return await db
    .prepare(
      `SELECT key,
              value
       FROM setting
       ORDER BY key`,
    )
    .all();
});

export default component$(() => {
  const pages = usePages();
  const settings = useSettings();

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    console.debug(settings.value);
  });

  return (
    <>
      <h1>index</h1>
      {pages.value ? <p>is pages</p> : <p>not pages</p>}
    </>
  );
});

// noinspection JSUnusedGlobalSymbols
export const head: DocumentHead = {
  title: "Wallaby",
  meta: [
    {
      name: "description",
      content: "Wallaby",
    },
  ],
};
