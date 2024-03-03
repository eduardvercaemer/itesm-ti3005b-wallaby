import { component$, Slot } from "@builder.io/qwik";
import type { RequestHandler } from "@builder.io/qwik-city";

export const onGet: RequestHandler = async ({ cacheControl }) => {
  // Control caching for this request for best performance and to reduce hosting costs:
  // https://qwik.builder.io/docs/caching/
  cacheControl({ noCache: true });
};

export default component$(() => {
  return (
    <>
      <div class="flex h-screen flex-col">
        <main class="flex flex-grow flex-col">
          <Slot />
        </main>
      </div>
    </>
  );
});
