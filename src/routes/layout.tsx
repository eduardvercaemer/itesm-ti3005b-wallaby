import {
  $,
  component$,
  Slot,
  useContextProvider,
  useSignal,
} from "@builder.io/qwik";
import type { RequestHandler } from "@builder.io/qwik-city";
import { zod$ } from "@builder.io/qwik-city";
import { globalAction$ } from "@builder.io/qwik-city";
import { routeLoader$ } from "@builder.io/qwik-city";

import { SettingShowDaysContext } from "~/components/settings-context/setting-show-days-context";

// noinspection JSUnusedGlobalSymbols
export const onGet: RequestHandler = async ({ cacheControl }) => {
  // Control caching for this request for best performance and to reduce hosting costs:
  // https://qwik.builder.io/docs/caching/
  cacheControl({ noCache: true });
};

export const useSettingsLoader = routeLoader$((e) => {
  const showDays = !!e.cookie.get("showDays");
  return { showDays };
});

export const useToggleShowDays = globalAction$((_, e) => {
  const showDays = !!e.cookie.get("showDays");
  if (!showDays) {
    e.cookie.set("showDays", "true");
  } else {
    e.cookie.delete("showDays");
  }
}, zod$({}));

export default component$(() => {
  const settings = useSettingsLoader();
  const showDays = useSignal(settings.value.showDays);
  const toggleShowDays = useToggleShowDays();
  useContextProvider(SettingShowDaysContext, {
    showDays,
    toggle: $(async () => {
      await toggleShowDays.submit({});
      showDays.value = !showDays.value;
    }),
  });

  return <Slot />;
});
