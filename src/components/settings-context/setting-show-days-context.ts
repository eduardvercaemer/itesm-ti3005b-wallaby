import type { QRL, ReadonlySignal } from "@builder.io/qwik";
import { createContextId } from "@builder.io/qwik";

export const SettingShowDaysContext = createContextId<{
  showDays: ReadonlySignal<boolean>;
  toggle: QRL<() => void>;
}>("wallaby.settings.showDays");
