import type { PropFunction } from "@builder.io/qwik";
import { component$ } from "@builder.io/qwik";

import { IcBaselineAlarmAdd } from "~/components/icons/baseline-alarm-add";
import { IcOutlineClose } from "~/components/icons/outline-close";
import { WallabyIcon1 } from "~/components/icons/wallaby-icon-1";
import { WallabyIcon2 } from "~/components/icons/wallaby-icon-2";

export interface StatsProps {
  blockCount: number;
  totalBlockCount: number;
  freeTeacherCount: number;
  totalTeacherCount: number;
  supStart: string | null;
  supEnd: string | null;
  onSupCancel$: PropFunction<() => void>;
}

export const Stats = component$((props: StatsProps) => {
  return (
    <div class="stats shadow">
      <div class="stat">
        <div class="stat-figure text-secondary">
          <WallabyIcon1 class="inline-block h-10 w-10 stroke-current" />
        </div>
        <div class="stat-title">Clases en Pantalla</div>
        <div class="stat-value">{props.blockCount}</div>
        <div class="stat-desc">/ {props.totalBlockCount}</div>
      </div>
      <div class="stat">
        <div class="stat-figure text-secondary">
          <WallabyIcon2 class="inline-block h-10 w-10 stroke-current" />
        </div>
        <div class="stat-title">Maestros Libres</div>
        <div class="stat-value">{props.freeTeacherCount}</div>
        <div class="stat-desc">/ {props.totalTeacherCount}</div>
      </div>

      {props.supStart && props.supEnd ? (
        <div class="stat">
          <div class="stat-figure text-secondary">
            <IcBaselineAlarmAdd class="inline-block h-8 w-8 stroke-current" />
          </div>
          <div class="stat-title">Horario</div>
          <div class="stat-value">
            {props.supStart} - {props.supEnd}
          </div>
          <button
            class="btn btn-outline stat-desc btn-error btn-xs flex justify-center"
            onClick$={props.onSupCancel$}
          >
            Cancelar
            <IcOutlineClose />
          </button>
        </div>
      ) : null}
    </div>
  );
});
