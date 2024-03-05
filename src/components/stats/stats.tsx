import { component$ } from "@builder.io/qwik";

import { IcBaselineAccountCircle } from "~/components/icons/baseline-account-circle";
import { IcBaselineCollectionsBookmark } from "~/components/icons/baseline-collections-bookmark";

export interface StatsProps {
  blockCount: number;
  totalBlockCount: number;
  freeTeacherCount: number;
  totalTeacherCount: number;
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
    </div>
  );
});
