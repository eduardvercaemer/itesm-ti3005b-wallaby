import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { useLocation } from "@builder.io/qwik-city";
import { Link } from "@builder.io/qwik-city";

import { IcBaselineStart } from "~/components/icons/baseline-start";
import { LoadingScreen } from "~/components/loading/loading-screen";
import { Waves } from "~/components/waves/waves";
import WallabyLogo from "~/media/Wallaby.svg?jsx";
import { useAuthSession } from "~/routes/plugin@10-auth";

export default component$(() => {
  const location = useLocation();
  const session = useAuthSession();

  if (location.isNavigating) return <LoadingScreen />;

  return (
    <>
      <div class="relative h-screen w-screen">
        <div class="relative">
          <div class="hero min-h-screen">
            <div class="hero-content text-center">
              <div class="flex max-w-md flex-col gap-16">
                <WallabyLogo />
                <Link
                  prefetch={session.value !== null}
                  href="/app"
                  class="btn btn-primary btn-lg flex items-center justify-around"
                >
                  <span>Ir a Horarios</span>
                  <IcBaselineStart class="h-10 w-10" />
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div class="absolute left-0 top-0 -z-[100] h-screen overflow-hidden">
          <Waves />
        </div>
      </div>
    </>
  );
});

// noinspection JSUnusedGlobalSymbols
export const head: DocumentHead = {
  title: "Wallaby",
  meta: [
    {
      name: "description",
      content: "Wallaby",
    },
  ],
};
