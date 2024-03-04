import { component$ } from "@builder.io/qwik";

import { useAuthSession } from "~/routes/plugin@10-auth";

export default component$(() => {
  const session = useAuthSession();
  return (
    <>
      <h1>app</h1>
      <h2>{session.value!.user!.name}</h2>
      <h2>{session.value!.user!.email}</h2>
    </>
  );
});
