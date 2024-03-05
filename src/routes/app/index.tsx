import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";

import { getScheduleDetails } from "~/lib/common";
import { database } from "~/routes/plugin@01-database";
import { notion } from "~/routes/plugin@02-notion";

export const useNotionLoader = routeLoader$(async (e) => {
  const db = database(e);
  const no = notion(e);

  return getScheduleDetails(db, no, { forceReload: true });
});

export default component$(() => {
  const notionData = useNotionLoader();

  return (
    <>
      <h1>maestros</h1>
      <ul class="flex gap-2">
        {notionData.value.teachers.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>

      <h1>clases</h1>
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>Clase</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Maestro</th>
            </tr>
          </thead>
          <tbody>
            {notionData.value.schedule.map((i) => (
              <tr key={i.id}>
                <td>{i.title}</td>
                <td>{i.start}</td>
                <td>{i.end}</td>
                <td>{i.teacher}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
});
