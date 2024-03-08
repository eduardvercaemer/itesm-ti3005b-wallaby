import { component$, useContext, useSignal } from "@builder.io/qwik";
import { routeLoader$, useLocation, useNavigate } from "@builder.io/qwik-city";
import { datePlus } from "itty-time";

import { SettingShowDaysContext } from "~/components/settings-context/setting-show-days-context";
import { Stats } from "~/components/stats/stats";
import { getSchedule } from "~/lib/notion";
import { database } from "~/routes/plugin@01-database";

const DAYS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
];

export const useSchedule = routeLoader$(async (e) => {
  const db = database(e);
  const dateString = e.query.get("date");
  const startString = e.query.get("start");
  const endString = e.query.get("end");
  const roomString = e.query.get("room");
  const gradeString = e.query.get("grade");
  const teacherString = e.query.get("teacher");

  const schedule = await getSchedule(db);
  if (!schedule) {
    return null;
  }

  const { classes, grades, rooms, teachers } = schedule;

  const dayName = dateString
    ? DAYS[datePlus("12 hours", new Date(dateString)).getDay()]
    : null;

  const filteredClasses = classes
    .filter((c) => {
      if (!dayName) return true;
      return c.day.includes(dayName);
    })
    .filter((c) => {
      if (!roomString) return true;
      return c.room.includes(roomString);
    })
    .filter((c) => {
      if (!gradeString) return true;
      return c.grade.includes(gradeString);
    })
    .filter((c) => {
      if (!teacherString) return true;
      return c.teacher.includes(teacherString);
    })
    .filter((c) => {
      if (!startString || !endString) return true;
      const classStart = parseInt(c.start.replace(":", ""));
      const classEnd = parseInt(c.end.replace(":", ""));
      const start = parseInt(startString.replace(":", ""));
      const end = parseInt(endString.replace(":", ""));
      return (
        (classStart >= start && classStart < end) ||
        (classEnd > start && classEnd <= end)
      );
    });

  const freeTeachers = teachers.filter(
    (t) => !filteredClasses.some((c) => c.teacher.includes(t)),
  );

  return {
    grades,
    rooms,
    teachers,
    classes,
    filteredClasses,
    freeTeachers,
    start: startString ?? null,
    end: endString ?? null,
    dayName,
  };
});

export default component$(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const schedule = useSchedule();
  const showDays = useContext(SettingShowDaysContext);
  const teacherFilter = useSignal<string | undefined>(undefined);
  const roomFilter = useSignal<string | undefined>(undefined);
  const gradeFilter = useSignal<string | undefined>(undefined);

  if (schedule.value === null) {
    return <h1>no schedule yet</h1>;
  }

  return (
    <div class="m-2 flex grow flex-col gap-4 overflow-y-hidden">
      <div class="flex justify-around px-8">
        <Stats
          freeTeacherCount={schedule.value.freeTeachers.length}
          totalTeacherCount={schedule.value.teachers.length}
          blockCount={schedule.value.filteredClasses.length}
          totalBlockCount={schedule.value.classes.length}
          supStart={schedule.value.start}
          supEnd={schedule.value.end}
          onSupCancel$={() => {
            const url = new URL(location.url);
            url.searchParams.delete("start");
            url.searchParams.delete("end");
            return navigate(url.href.toString());
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

                    {schedule.value.grades.map((t) => (
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

                    {schedule.value.rooms.map((t) => (
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

                  {schedule.value.teachers.map((t) => (
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
            {schedule.value.filteredClasses.map((i) => (
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
                          d === schedule.value.dayName ? "badge-primary" : "",
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
                      const url = new URL(location.url);
                      url.searchParams.set("start", i.start);
                      url.searchParams.set("end", i.end);
                      return navigate(url.href.toString());
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

      <div class="flex justify-center">
        <div class="card w-96 bg-neutral text-neutral-content">
          <div class="card-body items-center text-center">
            <h2 class="card-title">Maestros Disponibles</h2>
            <ul class="flex flex-wrap  gap-2">
              {schedule.value.freeTeachers.map((t) => (
                <li class="badge badge-primary">{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
});
