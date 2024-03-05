import type { PropFunction } from "@builder.io/qwik";
import { component$ } from "@builder.io/qwik";

import { IcBaselineAccountCircle } from "~/components/icons/baseline-account-circle";
import { IcBaselineAlarmAdd } from "~/components/icons/baseline-alarm-add";
import { IcBaselineCollectionsBookmark } from "~/components/icons/baseline-collections-bookmark";
import { IcOutlineClose } from "~/components/icons/outline-close";

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
          <IcBaselineCollectionsBookmark class="inline-block h-8 w-8 stroke-current" />
        </div>
        <div class="stat-title">Bloques de Clase</div>
        <div class="stat-value">{props.blockCount}</div>
        <div class="stat-desc">/ {props.totalBlockCount}</div>
      </div>
      <div class="stat">
        <div class="stat-figure text-secondary">
          <IcBaselineAccountCircle class="inline-block h-8 w-8 stroke-current" />
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
          <div class="stat-title">Supliendo Horario</div>
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
