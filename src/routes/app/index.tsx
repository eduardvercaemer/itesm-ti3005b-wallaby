import { component$, useContext, useSignal } from "@builder.io/qwik";
import { routeLoader$, useLocation, useNavigate } from "@builder.io/qwik-city";

import { SettingShowDaysContext } from "~/components/settings-context/setting-show-days-context";
import { Stats } from "~/components/stats/stats";
import { DAYS, getScheduleDetails, MissingDatabaseIdError } from "~/lib/common";
import { database } from "~/routes/plugin@01-database";
import { notion } from "~/routes/plugin@20-notion";

export const useNotionLoader = routeLoader$(async (e) => {
  const dateString = e.query.get("date");
  const startString = e.query.get("start");
  const endString = e.query.get("end");

  if (!dateString) {
    return {
      dayName: null,
      allBlocks: 0,
      allTeachers: [],
      freeTeachers: [],
      schedule: [],
      grades: [],
      rooms: [],
      status: "NO_DATE",
    };
  }

  const date = new Date(dateString);

  const db = database(e);
  const no = notion(e);
  try {
    const {
      dayName,
      allTeachers,
      freeTeachers,
      allBlocks,
      schedule,
      grades,
      rooms,
    } = await getScheduleDetails(db, no, date, {
      start: startString,
      end: endString,
      forceReload: false,
    });
    return {
      dayName,
      allTeachers,
      freeTeachers,
      allBlocks,
      schedule,
      grades,
      rooms,
      status: "READY",
    };
  } catch (err: unknown) {
    if (err instanceof MissingDatabaseIdError) {
      return {
        dayName: null,
        allBlocks: 0,
        allTeachers: [],
        freeTeachers: [],
        schedule: [],
        grades: [],
        rooms: [],
        status: "MISSING_DATABASE_ID",
      };
    }

    throw err;
  }
});

export default component$(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const notionData = useNotionLoader();
  const showDays = useContext(SettingShowDaysContext);
  const teacherFilter = useSignal<string | undefined>(undefined);
  const roomFilter = useSignal<string | undefined>(undefined);
  const gradeFilter = useSignal<string | undefined>(undefined);

  if (location.isNavigating && false) {
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
    <div class="m-2 flex grow flex-col gap-4 overflow-y-hidden">
      <div class="flex justify-around px-8">
        <Stats
          freeTeacherCount={notionData.value.freeTeachers.length}
          totalTeacherCount={notionData.value.allTeachers.length}
          blockCount={notionData.value.schedule.length}
          totalBlockCount={notionData.value.allBlocks}
          supEnd={location.url.searchParams.get("end") ?? null}
          supStart={location.url.searchParams.get("start") ?? null}
          onSupCancel$={() => {
            const date = location.url.searchParams.get("date")!;
            return navigate("/app?date=" + date);
          }}
        />
      </div>

      <div class="overflow-auto">
        <table class="table table-zebra table-pin-rows shadow-xl">
          <thead>
            <tr>
              <th>Clase</th>
              <th>
                <div class="flex flex-col items-center gap-1">
                  <span>Grado</span>

                  <select
                    bind:value={gradeFilter}
                    class="select select-bordered select-secondary select-xs w-full max-w-xs"
                  >
                    <option value="null">---</option>

                    {notionData.value.grades.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </th>
              <th>
                <div class="flex flex-col items-center gap-1">
                  <span>Salón</span>

                  <select
                    bind:value={roomFilter}
                    class="select select-bordered select-secondary select-xs w-full max-w-xs"
                  >
                    <option value="null">---</option>

                    {notionData.value.rooms.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </th>
              {showDays.showDays.value && <th>Días</th>}
              <th>Inicio</th>
              <th>Fin</th>
              <th class="flex flex-col items-center gap-1">
                <span>Maestro</span>

                <select
                  bind:value={teacherFilter}
                  class="select select-bordered select-secondary select-xs w-full max-w-xs"
                >
                  <option value="null">---</option>

                  {notionData.value.allTeachers.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {notionData.value.schedule
              .filter((i) => {
                if (
                  teacherFilter.value !== "null" &&
                  teacherFilter.value !== undefined &&
                  !i.teacher.includes(teacherFilter.value)
                ) {
                  return false;
                }

                if (
                  roomFilter.value !== "null" &&
                  roomFilter.value !== undefined &&
                  !i.room.includes(roomFilter.value)
                ) {
                  return false;
                }

                if (
                  gradeFilter.value !== "null" &&
                  gradeFilter.value !== undefined &&
                  !i.grade.includes(gradeFilter.value)
                ) {
                  return false;
                }

                return true;
              })
              .map((i) => (
                <tr key={i.id}>
                  <th role="row" class="font-bold">
                    {i.title}
                  </th>
                  <td>
                    {i.grade.map((grade) => (
                      <span class="badge">{grade}</span>
                    ))}
                  </td>
                  <td>
                    {i.room.map((room) => (
                      <span class="badge">{room}</span>
                    ))}
                  </td>
                  {showDays.showDays.value && (
                    <td class="flex gap-1">
                      {DAYS.map((d) => (
                        <span
                          class={[
                            "badge",
                            d === notionData.value.dayName
                              ? "badge-primary"
                              : "",
                            i.day.includes(d) ? "" : "opacity-20",
                          ]}
                        >
                          {d}
                        </span>
                      ))}
                    </td>
                  )}
                  <td>{i.start}</td>
                  <td>{i.end}</td>
                  <td>
                    {i.teacher.map((t) => (
                      <span class="badge">{t}</span>
                    ))}
                  </td>
                  <td>
                    <button
                      class="btn btn-outline btn-secondary btn-xs"
                      disabled={location.isNavigating}
                      onClick$={() => {
                        const date = new Date(
                          location.url.searchParams.get("date")!,
                        );
                        return navigate(
                          "/app?date=" +
                            date.toISOString().split("T", 1)[0] +
                            "&start=" +
                            i.start +
                            "&end=" +
                            i.end,
                        );
                      }}
                    >
                      Suplir
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {false && (
        <div class="flex justify-center">
          <div class="card w-96 bg-neutral text-neutral-content">
            <div class="card-body items-center text-center">
              <h2 class="card-title">Maestros Disponibles</h2>
              <ul class="flex flex-wrap  gap-2">
                {notionData.value.freeTeachers.map((t) => (
                  <li class="badge badge-primary">{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
