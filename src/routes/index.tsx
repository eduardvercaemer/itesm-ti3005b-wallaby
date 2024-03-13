import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { useLocation } from "@builder.io/qwik-city";
import { Link } from "@builder.io/qwik-city";

import { LoadingScreen } from "~/components/loading/loading-screen";

export default component$(() => {
  const location = useLocation();

  if (location.isNavigating) return <LoadingScreen />;

  return (
    <>
      <div class="hero min-h-screen bg-base-200">
        <div class="hero-content text-center">
          <div class="max-w-md">
            <h1 class="text-5xl font-bold">Wallaby</h1>
            <Link prefetch={false} href="/app" class="btn btn-primary">
              Ir a Horarios
            </Link>
          </div>
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
