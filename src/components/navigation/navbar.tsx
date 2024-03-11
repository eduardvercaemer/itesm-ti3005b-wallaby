import { component$ } from "@builder.io/qwik";
import type { ActionStore } from "@builder.io/qwik-city";
import { useLocation } from "@builder.io/qwik-city";
import { useNavigate } from "@builder.io/qwik-city";
import { Form, Link } from "@builder.io/qwik-city";

import { DatepickerInput } from "~/components/datepicker/datepicker";
import { IcBaselineAccountCircle } from "~/components/icons/baseline-account-circle";
import { IcBaselineRefresh } from "~/components/icons/baseline-refresh";
import { IcOutlineSettings } from "~/components/icons/outline-settings";
import { IcRoundLogOut } from "~/components/icons/round-log-out";
import { useAuthSession, useAuthSignout } from "~/routes/plugin@10-auth";

export interface NavbarProps {
  updateDatabaseIdAction: ActionStore<any, any, any>;
  refreshNotionAction: ActionStore<any, any, any>;
  initialDate: Date | null;
}

export const Navbar = component$((props: NavbarProps) => {
  const session = useAuthSession();
  const signOut = useAuthSignout();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div class="navbar bg-primary text-primary-content">
      <div class="flex-1">
        <Link href="/app" class="btn btn-ghost text-xl">
          Wallaby
        </Link>
      </div>
      <div class="flex-none gap-2">
        <DatepickerInput
          class="input input-bordered w-24 md:w-auto"
          placeholder="Fecha"
          initialDate={props.initialDate}
          onDate$={(date) => {
            const url = new URL(location.url);
            url.searchParams.set("date", date.toISOString().split("T", 1)[0]);
            return navigate(url.href.toString());
          }}
        />

        <Form
          action={props.refreshNotionAction}
          class="tooltip tooltip-bottom"
          data-tip="Recargar Horarios"
        >
          <button
            class="btn btn-accent"
            disabled={props.refreshNotionAction.isRunning}
          >
            Recargar Horarios
            <IcBaselineRefresh class="h-10 w-10" />
          </button>
        </Form>

        {/*<Form class="flex gap-1" action={props.updateDatabaseIdAction}>*/}
        {/*  <input*/}
        {/*    type="text"*/}
        {/*    placeholder="Database ID"*/}
        {/*    class="input input-bordered w-24 md:w-auto"*/}
        {/*    name="databaseId"*/}
        {/*  />*/}
        {/*  <button type="submit" class="btn btn-warning">*/}
        {/*    Load*/}
        {/*  </button>*/}
        {/*</Form>*/}
        <div class="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            class="avatar btn btn-circle btn-ghost"
          >
            <div class="w-10 rounded-full">
              {session.value?.user.image ? (
                <img
                  height={48}
                  width={48}
                  alt="Avatar for logged in user"
                  src={session.value.user.image}
                />
              ) : (
                <IcBaselineAccountCircle class="h-10 w-10" />
              )}
            </div>
          </div>
          <ul
            tabIndex={0}
            class="menu dropdown-content menu-sm z-[1] mt-3 w-52 rounded-box bg-base-100 p-2 shadow"
          >
            {/*<li>*/}
            {/*  <Link href="/app/scheduler">Horarios</Link>*/}
            {/*</li>*/}
            <li>
              <Link href="/app/settings" class="flex justify-between">
                <span>Ajustes</span>
                <IcOutlineSettings />
              </Link>
            </li>
            <li>
              <Form action={signOut} class="flex justify-between text-error">
                <input type="hidden" name="callbackUrl" value="/" />
                <button type="submit">Cerrar Sesión</button>
                <IcRoundLogOut />
              </Form>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
});
