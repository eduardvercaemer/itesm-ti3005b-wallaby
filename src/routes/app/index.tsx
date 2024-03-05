import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";

import { getSchedule } from "~/lib/common";
import { database } from "~/routes/plugin@01-database";
import { notion } from "~/routes/plugin@02-notion";

export const useNotionLoader = routeLoader$(async (e) => {
  const db = database(e);
  const no = notion(e);
  return getSchedule(db, no);
});

export default component$(() => {
  const notionData = useNotionLoader();

  return (
    <>
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>Clase</th>
            </tr>
          </thead>
          <tbody>
            {notionData.value.map((i) => (
              <tr key={i.id}>
                <td>{i.title}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
});
