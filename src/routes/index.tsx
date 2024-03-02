import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { routeLoader$ } from "@builder.io/qwik-city";

import { isPages } from "~/routes/plugin@00-pages";

export const usePages = routeLoader$((e) => isPages(e));

export default component$(() => {
  const pages = usePages();

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
