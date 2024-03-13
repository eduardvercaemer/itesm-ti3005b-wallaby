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

import { LoadingScreen } from "~/components/loading/loading-screen";
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
  const supStartString = e.query.get("supStart");
  const supEndString = e.query.get("supEnd");
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
  const classesSameTimeAsSupClass = classes
    .filter((c) => {
      if (!dayName) return true;
      return c.day.includes(dayName);
    })
    .filter((c) => {
      if (!supStartString || !supEndString) return true;
      const classStart = parseInt(c.start.replace(":", ""));
      const classEnd = parseInt(c.end.replace(":", ""));
      const start = parseInt(supStartString.replace(":", ""));
      const end = parseInt(supEndString.replace(":", ""));
      return (
        (classStart >= start && classStart < end) ||
        (classEnd > start && classEnd <= end)
      );
    });

  const freeTeachers = teachers.filter(
    (t) => !filteredClasses.some((c) => c.teacher.includes(t)),
  );
  const possibleSupTeachers = teachers.filter(
    (t) => !classesSameTimeAsSupClass.some((c) => c.teacher.includes(t)),
  );

  return {
    grades,
    rooms,
    teachers,
    classes,
    filteredClasses,
    freeTeachers,
    possibleSupTeachers,
    supping: supStartString && supEndString,
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
  const teacherFilter = useSignal<string | undefined>(
    location.url.searchParams.get("teacher") ?? undefined,
  );
  const roomFilter = useSignal<string | undefined>(
    location.url.searchParams.get("room") ?? undefined,
  );
  const gradeFilter = useSignal<string | undefined>(
    location.url.searchParams.get("grade") ?? undefined,
  );
  const startFilter = useSignal<string | undefined>(
    location.url.searchParams.get("start") ?? undefined,
  );
  const endFilter = useSignal<string | undefined>(
    location.url.searchParams.get("end") ?? undefined,
  );
  const dialog = useSignal<HTMLDialogElement>();

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    track(() => teacherFilter.value);
    track(() => roomFilter.value);
    track(() => gradeFilter.value);
    track(() => startFilter.value);
    track(() => endFilter.value);

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
    if (startFilter.value) {
      url.searchParams.set("start", startFilter.value);
    } else {
      url.searchParams.delete("start");
    }
    if (endFilter.value) {
      url.searchParams.set("end", endFilter.value);
    } else {
      url.searchParams.delete("end");
    }
    return navigate(url.href.toString());
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    track(() => location.url);
    if (location.url.searchParams.get("supStart")) {
      dialog.value?.showModal();
    } else {
      dialog.value?.close();
    }
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
    <div class="m-2 flex grow flex-col items-center gap-4 overflow-auto">
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

      <table class="table table-pin-rows mx-auto border-separate border-spacing-y-4 shadow-xl">
        <colgroup>
          {/*clase*/}
          <col class={[showDays.showDays.value ? "w-[10%]" : "w-[20%]"]} />
          {/*dias*/}
          {showDays.showDays.value && (
            <col class={[showDays.showDays.value ? "w-[35%]" : "w-[0%]"]} />
          )}
          {/*grado*/}
          <col class={[showDays.showDays.value ? "w-[7.5%]" : "w-[10%]"]} />
          {/*salon*/}
          <col class={[showDays.showDays.value ? "w-[7.5%]" : "w-[10%]"]} />
          {/*inicio*/}
          <col class={[showDays.showDays.value ? "w-[7.5%]" : "w-[10%]"]} />
          {/*fin*/}
          <col class={[showDays.showDays.value ? "w-[7.5%]" : "w-[10%]"]} />
          {/*maestro*/}
          <col class={[showDays.showDays.value ? "w-[10%]" : "w-[10%]"]} />
          {/*boton*/}
          <col class={[showDays.showDays.value ? "w-[7.5%]" : "w-[10%]"]} />
        </colgroup>

        <thead>
          <tr>
            <th>Clase</th>
            {showDays.showDays.value && <th>Días</th>}
            <th>
              <div class="flex flex-col items-center gap-1">
                <span>Grado</span>

                <select
                  bind:value={gradeFilter}
                  disabled={location.isNavigating}
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
                  disabled={location.isNavigating}
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
            <th>
              <div class="flex flex-col items-center gap-1">
                <span>Inicio</span>
                <input
                  type="time"
                  bind:value={startFilter}
                  disabled={location.isNavigating}
                  class="input input-xs input-bordered input-secondary w-full max-w-xs"
                />
              </div>
            </th>
            <th>
              <div class="flex flex-col items-center gap-1">
                <span>Fin</span>
                <input
                  type="time"
                  bind:value={endFilter}
                  disabled={location.isNavigating}
                  class="input input-xs input-bordered input-secondary w-full max-w-xs"
                />
              </div>
            </th>
            <th class="flex flex-col items-center gap-1">
              <span>Maestro</span>

              <select
                bind:value={teacherFilter}
                disabled={location.isNavigating}
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
          {!location.isNavigating &&
            schedule.value.filteredClasses.map((i, index) => (
              <tr key={i.id}>
                <th
                  role="row"
                  class={[
                    "rounded-l-xl font-bold",
                    index % 2 == 0 ? "bg-wallaby-1" : "bg-wallaby-2",
                  ]}
                >
                  {i.title}
                </th>
                {showDays.showDays.value && (
                  <td
                    class={[index % 2 == 0 ? "bg-wallaby-1" : "bg-wallaby-2"]}
                  >
                    <ul class="flex flex-wrap gap-1">
                      {DAYS.map((d) => (
                        <li
                          class={[
                            "badge",
                            d === schedule.value.dayName ? "badge-primary" : "",
                            i.day.includes(d) ? "" : "opacity-20",
                          ]}
                        >
                          {d}
                        </li>
                      ))}
                    </ul>
                  </td>
                )}
                <td class={[index % 2 == 0 ? "bg-wallaby-1" : "bg-wallaby-2"]}>
                  <Badges badges={i.grade} />
                </td>
                <td class={[index % 2 == 0 ? "bg-wallaby-1" : "bg-wallaby-2"]}>
                  <Badges badges={i.room} />
                </td>
                <td class={[index % 2 == 0 ? "bg-wallaby-1" : "bg-wallaby-2"]}>
                  {i.start}
                </td>
                <td class={[index % 2 == 0 ? "bg-wallaby-1" : "bg-wallaby-2"]}>
                  {i.end}
                </td>
                <td class={[index % 2 == 0 ? "bg-wallaby-1" : "bg-wallaby-2"]}>
                  <Badges badges={i.teacher} />
                </td>
                <td
                  class={[
                    "rounded-r-xl",
                    index % 2 == 0 ? "bg-wallaby-1" : "bg-wallaby-2",
                  ]}
                >
                  <button
                    class="btn btn-primary btn-sm"
                    onClick$={() => {
                      const url = new URL(location.url);
                      url.searchParams.set("supStart", i.start);
                      url.searchParams.set("supEnd", i.end);
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

      {location.isNavigating && <LoadingScreen />}

      <dialog
        ref={dialog}
        id="modal_available_teachers"
        class="modal"
        onClose$={() => {
          const url = new URL(location.url);
          url.searchParams.delete("supStart");
          url.searchParams.delete("supEnd");
          return navigate(url.href.toString());
        }}
      >
        <div class="modal-box flex flex-col gap-4">
          <h3 class="text-lg font-bold">Maestros Disponibles</h3>
          <Badges badges={schedule.value.possibleSupTeachers} primary long />

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

function Badges(props: {
  badges: string[];
  primary?: boolean;
  long?: boolean;
}) {
  return (
    <ul class={["flex flex-wrap", props.long ? "gap-4" : "gap-1"]}>
      {props.badges.map((t) => (
        <li
          key={t}
          class={[
            "badge flex items-center justify-center py-3",
            props.primary ? "badge-primary" : "",
          ]}
        >
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}
