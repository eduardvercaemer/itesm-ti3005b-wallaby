import type { PropFunction } from "@builder.io/qwik";
import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { Datepicker } from "vanillajs-datepicker";

export interface DatepickerProps {
  onDate$: PropFunction<(date: Date) => void>;
}

export const DatepickerInput = component$((props: DatepickerProps) => {
  const ref = useSignal<HTMLInputElement>();

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup }) => {
    const datepicker = new Datepicker(ref.value!, {});
    cleanup(() => datepicker.destroy());
  });

  return (
    <input
      on-changeDate$={(e: Event & { detail: { date: Date } }) => {
        return props.onDate$(e.detail.date);
      }}
      ref={ref}
      type="text"
    />
  );
});
