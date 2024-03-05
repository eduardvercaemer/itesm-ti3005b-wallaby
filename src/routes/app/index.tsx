import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";

import { getScheduleDetails } from "~/lib/common";
import { database } from "~/routes/plugin@01-database";
import { notion } from "~/routes/plugin@02-notion";

export const useNotionLoader = routeLoader$(async (e) => {
  const db = database(e);
  const no = notion(e);

  return getScheduleDetails(db, no);
});

export default component$(() => {
  const notionData = useNotionLoader();

  return (
    <>
      <h1>maestros</h1>
      <ul class="flex gap-2">
        {notionData.value.teachers.map((i) => (
          <li key={i} class="badge badge-accent">
            {i}
          </li>
        ))}
      </ul>

      <h1>clases</h1>
      <div class="overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th>Clase</th>
              <th>Días</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Maestro</th>
              <th>Grado</th>
              <th>Salón</th>
            </tr>
          </thead>
          <tbody>
            {notionData.value.schedule.map((i) => (
              <tr key={i.id}>
                <td>{i.title}</td>
                <td class="flex gap-1">
                  {i.day.map((d) => (
                    <span class="badge">{d}</span>
                  ))}
                </td>
                <td>{i.start}</td>
                <td>{i.end}</td>
                <td>
                  {i.teacher.map((t) => (
                    <span class="badge">{t}</span>
                  ))}
                </td>
                <td>{i.grade}</td>
                <td>{i.room}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
});
