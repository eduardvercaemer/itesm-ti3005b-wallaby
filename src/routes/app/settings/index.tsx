import { component$, useContext } from "@builder.io/qwik";

import { SettingShowDaysContext } from "~/components/settings-context/setting-show-days-context";

export default component$(() => {
  const showDays = useContext(SettingShowDaysContext);

  return (
    <>
      <div class="flex grow flex-col items-center justify-center">
        <div class="form-control w-72">
          <label class="label flex cursor-pointer justify-between">
            <span class="label-text">Mostrar días en horario</span>
            <input
              type="checkbox"
              class="toggle toggle-accent"
              checked={showDays.showDays.value}
              onChange$={() => showDays.toggle()}
            />
          </label>
        </div>
      </div>
    </>
  );
});
