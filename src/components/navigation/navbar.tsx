import { component$ } from "@builder.io/qwik";
import type { ActionStore } from "@builder.io/qwik-city";
import { useNavigate } from "@builder.io/qwik-city";
import { Form, Link } from "@builder.io/qwik-city";

import { DatepickerInput } from "~/components/datepicker/datepicker";
import { IcOutlineSettings } from "~/components/icons/outline-settings";
import { IcRoundLogOut } from "~/components/icons/round-log-out";
import { useAuthSession, useAuthSignout } from "~/routes/plugin@10-auth";

export interface NavbarProps {
  updateDatabaseIdAction: ActionStore<any, any, any>;
}

export const Navbar = component$((props: NavbarProps) => {
  const session = useAuthSession();
  const signOut = useAuthSignout();
  const navigate = useNavigate();

  return (
    <div class="navbar bg-primary text-primary-content">
      <div class="flex-1">
        <Link href="/app" class="btn btn-ghost text-xl">
          Wallaby
        </Link>
      </div>
      <div class="flex-none gap-2">
        <DatepickerInput
          onDate$={(date) =>
            navigate("/app?date=" + date.toISOString().split("T", 1)[0])
          }
        />
        <Form class="flex gap-1" action={props.updateDatabaseIdAction}>
          <input
            type="text"
            placeholder="Database ID"
            class="input input-bordered w-24 md:w-auto"
            name="databaseId"
          />
          <button type="submit" class="btn btn-warning">
            Load
          </button>
        </Form>
        <div class="form-control">
          <input
            type="text"
            placeholder="Buscar"
            class="input input-bordered w-24 md:w-auto"
          />
        </div>
        <div class="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            class="avatar btn btn-circle btn-ghost"
          >
            <div class="w-10 rounded-full">
              <img
                alt="Avatar for logged in user"
                src={session.value?.user?.image ?? ""}
              />
            </div>
          </div>
          <ul
            tabIndex={0}
            class="menu dropdown-content menu-sm z-[1] mt-3 w-52 rounded-box bg-base-100 p-2 shadow"
          >
            <li>
              <Link href="/app/scheduler">Horarios</Link>
            </li>
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
