import {
  component$,
  useContext,
  useSignal,
  useVisibleTask$,
} from "@builder.io/qwik";
import {
  Form,
  routeLoader$,
  useLocation,
  useNavigate,
} from "@builder.io/qwik-city";
import { datePlus } from "itty-time";

import { SettingShowDaysContext } from "~/components/settings-context/setting-show-days-context";
import { Stats } from "~/components/stats/stats";
import { getSchedule } from "~/lib/notion";
import { useRefreshNotionAction } from "~/routes/app/layout";
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
  const refreshNotion = useRefreshNotionAction();
  const showDays = useContext(SettingShowDaysContext);
  const teacherFilter = useSignal<string | undefined>(undefined);
  const roomFilter = useSignal<string | undefined>(undefined);
  const gradeFilter = useSignal<string | undefined>(undefined);
  const dialog = useSignal<HTMLDialogElement>();

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    track(() => teacherFilter.value);
    track(() => roomFilter.value);
    track(() => gradeFilter.value);

    const url = new URL(location.url);
    if (teacherFilter.value) {
      url.searchParams.set("teacher", teacherFilter.value);
    } else {
      url.searchParams.delete("teacher");
    }
    if (roomFilter.value) {
      url.searchParams.set("room", roomFilter.value);
    } else {
      url.searchParams.delete("room");
    }
    if (gradeFilter.value) {
      url.searchParams.set("grade", gradeFilter.value);
    } else {
      url.searchParams.delete("grade");
    }
    return navigate(url.href.toString());
  });

  if (schedule.value === null) {
    return (
      <div class="hero min-h-screen bg-base-200">
        <div class="hero-content text-center">
          <div class="max-w-md">
            <h1 class="text-5xl font-bold">Horario no Inicializado</h1>
            <p class="py-6">
              Para actualizar el horario con la base de datos, presiona el botón
              de abajo o el botón de recarga en la barra de navegación.
            </p>
            <Form action={refreshNotion}>
              <button type="submit" class="btn btn-primary">
                Cargar!
              </button>
            </Form>
          </div>
        </div>
      </div>
    );
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
          <colgroup>
            <col class="w-[20%]" />
            <col class="w-[10%]" />
            <col class="w-[10%]" />
            <col />
            <col />
            <col />
            <col />
          </colgroup>

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
                    <option value="">---</option>

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
                    <option value="">---</option>

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
                  <option value="">---</option>

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
                  <ul class="flex flex-wrap gap-1">
                    {i.grade.map((grade) => (
                      <li class="badge">{grade}</li>
                    ))}
                  </ul>
                </td>
                <td>
                  <ul class="flex flex-wrap gap-1">
                    {i.room.map((room) => (
                      <li class="badge">{room}</li>
                    ))}
                  </ul>
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
                  <ul class="flex flex-wrap gap-1">
                    {i.teacher.map((t) => (
                      <li class="badge">{t}</li>
                    ))}
                  </ul>
                </td>
                <td>
                  <button
                    class="btn btn-outline btn-secondary btn-xs"
                    onClick$={() => {
                      dialog.value!.showModal();
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

      <dialog ref={dialog} id="modal_available_teachers" class="modal">
        <div class="modal-box">
          <h3 class="text-lg font-bold">Maestros Disponibles</h3>
          <ul class="flex flex-wrap gap-2">
            {schedule.value.freeTeachers.map((t) => (
              <li class="badge badge-primary">{t}</li>
            ))}
          </ul>

          <div class="modal-action">
            <form method="dialog">
              <button class="btn">Cerrar</button>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  );
});
