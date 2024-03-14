import { component$ } from "@builder.io/qwik";
import { Form, useLocation } from "@builder.io/qwik-city";

import { Waves } from "~/components/waves/waves";
import NotionLogo from "~/media/Notion.svg?jsx";
import WallabyLogo from "~/media/Wallaby.svg?jsx";
import { useAuthSignin } from "~/routes/plugin@10-auth";

export default component$(() => {
  const signIn = useAuthSignin();
  const location = useLocation();

  return (
    <div class="relative h-screen w-screen">
      <div class="relative">
        <div class="flex h-screen items-center justify-around">
          <div class="rounded-2xl border-8 border-base-100 bg-wallaby-3 px-8 py-32 text-center">
            <WallabyLogo />
          </div>
          <div class="flex flex-col items-center gap-16 rounded-2xl border-8 border-base-100 bg-wallaby-2 px-8 py-16 text-center">
            <h1 class="text-5xl">Inicia Sesión</h1>
            <Form action={signIn} class="flex">
              <input type="hidden" name="providerId" value="notion" />
              <input
                type="hidden"
                name="options.callbackUrl"
                value={location.url.searchParams.get("callbackUrl")}
              />
              <button type="submit" class="btn btn-accent btn-lg flex">
                <NotionLogo class="h-6 w-6" />
                <span>Continua con Notion</span>
              </button>
            </Form>
          </div>
        </div>
      </div>
      <div class="absolute left-0 top-0 -z-[100] h-screen overflow-hidden">
        <Waves />
      </div>
    </div>
  );
});
