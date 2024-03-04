import { component$ } from "@builder.io/qwik";
import { Form } from "@builder.io/qwik-city";

import { IcRoundLogOut } from "~/components/icons/round-log-out";
import { useAuthSession, useAuthSignout } from "~/routes/plugin@10-auth";

export const Navbar = component$(() => {
  const session = useAuthSession();
  const signOut = useAuthSignout();

  return (
    <div class="navbar bg-primary text-primary-content">
      <div class="flex-1">
        <a class="btn btn-ghost text-xl">Wallaby</a>
      </div>
      <div class="flex-none gap-2">
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
              <Form action={signOut} class="flex justify-between text-error">
                <input type="hidden" name="callbackUrl" value="/" />
                <button>Cerrar Sesión</button>
                <IcRoundLogOut />
              </Form>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
});
