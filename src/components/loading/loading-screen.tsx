import { component$ } from "@builder.io/qwik";

export const LoadingScreen = component$(() => {
  return (
    <div class="hero h-screen">
      <div class="hero-content flex flex-col text-center">
        <h1 class="text-5xl font-bold">Cargando...</h1>
        <span class="loading loading-spinner loading-lg"></span>
      </div>
    </div>
  );
});
