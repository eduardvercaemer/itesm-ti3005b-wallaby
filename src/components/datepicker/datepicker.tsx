import type { PropFunction, PropsOf } from "@builder.io/qwik";
import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { Datepicker } from "vanillajs-datepicker";

export interface DatepickerProps {
  onDate$: PropFunction<(date: Date) => void>;
  initialDate?: Date | null;
}

export const DatepickerInput = component$(
  (props: DatepickerProps & PropsOf<"input">) => {
    const ref = useSignal<HTMLInputElement>();

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ cleanup }) => {
      const datepicker = new Datepicker(ref.value!, {});
      if (props.initialDate) {
        datepicker.setDate(props.initialDate);
      }
      cleanup(() => datepicker.destroy());
    });

    return (
      // @ts-ignore
      <input
        {...props}
        on-changeDate$={(e: Event & { detail: { date: Date } }) => {
          return props.onDate$(e.detail.date);
        }}
        ref={ref}
        type="text"
      />
    );
  },
);
