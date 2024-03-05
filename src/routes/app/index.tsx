import { component$ } from "@builder.io/qwik";
import { routeLoader$, useLocation } from "@builder.io/qwik-city";

import { getScheduleDetails, MissingDatabaseIdError } from "~/lib/common";
import { database } from "~/routes/plugin@01-database";
import { notion } from "~/routes/plugin@02-notion";

export const useNotionLoader = routeLoader$(async (e) => {
  const dateString = e.query.get("date");
  if (!dateString) {
    return {
      teachers: [],
      schedule: [],
      status: "NO_DATE",
    };
  }

  const date = new Date(dateString);

  const db = database(e);
  const no = notion(e);
  try {
    const { teachers, schedule } = await getScheduleDetails(db, no);
    return {
      teachers,
      schedule,
      status: "READY",
    };
  } catch (err: unknown) {
    if (err instanceof MissingDatabaseIdError) {
      return {
        teachers: [],
        schedule: [],
        status: "MISSING_DATABASE_ID",
      };
    }

    throw err;
  }
});

export default component$(() => {
  const location = useLocation();
  const notionData = useNotionLoader();

  if (location.isNavigating) {
    return (
      <div class="hero min-h-screen bg-base-200">
        <div class="hero-content text-center">
          <div class="max-w-md">
            <h1 class="text-5xl font-bold">Procesando...</h1>
            <p class="py-6">
              <span class="loading loading-infinity loading-lg"></span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (notionData.value.status === "NO_DATE") {
    return (
      <div class="hero min-h-screen bg-base-200">
        <div class="hero-content text-center">
          <div class="max-w-md">
            <h1 class="text-5xl font-bold">Bienvenido</h1>
            <p class="py-6">
              Para comenzar selecciona una fecha para consultar el horario.
              Utiliza el calendario en la barra de navegación.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (notionData.value.status === "MISSING_DATABASE_ID") {
    return <h1>Database ID not set</h1>;
  }

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
