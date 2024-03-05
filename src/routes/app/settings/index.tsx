import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";

export const useSettingsLoader = routeLoader$(async (e) => {});

export default component$(() => {
  return <h1>settings</h1>;
});
