import type { PropFunction, PropsOf } from "@builder.io/qwik";
import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { datePlus } from "itty-time";
import { Datepicker } from "vanillajs-datepicker";

import { IcBaselineCalendarMonth } from "~/components/icons/baseline-calendar";

export interface DatepickerProps {
  onDate$: PropFunction<(date: Date) => void>;
  initialDate?: Date | null;
}

export const DatepickerInput = component$(
  ({ initialDate, onDate$, ...props }: DatepickerProps & PropsOf<"input">) => {
    const ref = useSignal<HTMLInputElement>();

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ cleanup }) => {
      const datepicker = new Datepicker(ref.value!, {
        buttonClass: "btn",
      });
      if (initialDate) {
        datepicker.setDate(datePlus("12 hours", initialDate));
      }
      cleanup(() => datepicker.destroy());
    });

    return (
      <label class="input input-sm input-bordered flex items-center gap-2 font-bold text-neutral-content">
        <input
          {...props}
          class="grow"
          on-changeDate$={(e: Event & { detail: { date: Date } }) => {
            return onDate$(e.detail.date);
          }}
          ref={ref}
          type="text"
        />

        <IcBaselineCalendarMonth class="h-6 w-6" />
      </label>
    );
  },
);
