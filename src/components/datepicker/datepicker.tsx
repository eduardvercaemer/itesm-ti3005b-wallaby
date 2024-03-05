import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { Datepicker } from "vanillajs-datepicker";

export interface DatepickerProps {}

export const DatepickerInput = component$((props: DatepickerProps) => {
  const ref = useSignal<HTMLInputElement>();

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup }) => {
    const datepicker = new Datepicker(ref.value!, {});
    cleanup(() => datepicker.destroy());
  });

  return <input ref={ref} type="text" />;
});
