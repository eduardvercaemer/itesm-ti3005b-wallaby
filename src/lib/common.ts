import { D1Database } from "@cloudflare/workers-types";
import { Client } from "@notionhq/client";
import { z } from "@builder.io/qwik-city";
import { datePlus } from "itty-time";

export class MissingDatabaseIdError extends Error {
  constructor() {
    super("Missing database ID");
    this.name = MissingDatabaseIdError.name;
  }
}

/// AUTH APIS

export async function getUserAccessKey(
  db: D1Database,
  userId: string,
): Promise<string | null> {
  const result = await db
    .prepare(
      `SELECT access_token
       FROM "accounts"
       WHERE userId = ?
       LIMIT 1`,
    )
    .bind(userId)
    .first<{ access_token: string | null }>();

  return result?.access_token ?? null;
}

/// SETTINGS APIS

export function getSetting(setting: string) {
  return async function (db: D1Database): Promise<string | null> {
    const result = await db
      .prepare(
        `SELECT value
         FROM setting
         WHERE key = ?
         LIMIT 1`,
      )
      .bind(setting)
      .first<{ value: string | null }>();

    return result?.value ?? null;
  };
}

export function setSetting(setting: string) {
  return async function setDatabaseId(
    db: D1Database,
    value: string,
  ): Promise<void> {
    await db
      .prepare(
        `INSERT INTO setting (key, value)
         VALUES (?, ?)
         ON CONFLICT DO UPDATE SET value = excluded.value`,
      )
      .bind(setting, value)
      .run();
  };
}

export function deleteSetting(setting: string) {
  return async function (db: D1Database): Promise<void> {
    await db
      .prepare(
        `DELETE
         FROM setting
         WHERE key = ?`,
      )
      .bind(setting)
      .run();
  };
}

export const getDatabaseId = getSetting("database_id");
export const setDatabaseId = setSetting("database_id");

export const getNotionSchedule = getSetting("notion_schedule");
export const setNotionSchedule = setSetting("notion_schedule");

export const getNotionTeachers = getSetting("notion_teachers");
export const setNotionTeachers = setSetting("notion_teachers");

/// NOTION APIS

const basicMultiSelectSchema = z
  .object({
    type: z.literal("multi_select"),
    multi_select: z.array(z.any()),
  })
  .transform((data) => data.multi_select.map((i) => i.name));

const basicTextSchema = z
  .object({
    type: z.literal("rich_text"),
    rich_text: z.array(z.any()),
  })
  .transform((data) => data.rich_text.map((i) => i.text.content).join(" "));

const scheduleSchema = z
  .object({
    results: z.array(
      z
        .object({
          object: z.literal("page"),
          id: z.string().uuid(),
          url: z.string().url(),
          properties: z.object({
            Grado: basicMultiSelectSchema,
            Maestro: basicMultiSelectSchema,
            Dia: basicMultiSelectSchema,
            Salón: basicMultiSelectSchema,
            Inicio: basicTextSchema,
            Fin: basicTextSchema,
            Titulo: z
              .object({
                type: z.literal("title"),
                title: z.array(
                  z.object({
                    type: z.literal("text"),
                    text: z.object({ content: z.string() }),
                  }),
                ),
              })
              .transform((i) => i.title[0].text.content),
          }),
        })
        .transform((i) => ({
          id: i.id,
          url: i.url,
          title: i.properties.Titulo,
          grade: i.properties.Grado,
          teacher: i.properties.Maestro,
          day: i.properties.Dia,
          room: i.properties["Salón"],
          start: i.properties.Inicio,
          end: i.properties.Fin,
        })),
    ),
  })
  .transform((data) => data.results);

async function getFullSchedule(
  db: D1Database,
  notion: Client,
  databaseId: string,
  options?: { forceReload: boolean },
): Promise<z.infer<typeof scheduleSchema>> {
  /// Attempt local cache
  const cachedNotionSchedule = options?.forceReload
    ? null
    : await getNotionSchedule(db);

  if (cachedNotionSchedule) {
    console.debug("USING CACHED SCHEDULE");
    return await scheduleSchema.parseAsync(JSON.parse(cachedNotionSchedule));
  }

  if (!databaseId) {
    throw new MissingDatabaseIdError();
  }

  const response = await notion.databases.query({
    database_id: databaseId,
    sorts: [{ property: "Inicio", direction: "ascending" }],
  });
  const schedule = await scheduleSchema.parseAsync(response);

  console.debug("UPDATING SCHEDULE IN DATABASE");
  await setNotionSchedule(db, JSON.stringify(response));

  return schedule;
}

const teachersSchema = z
  .object({
    properties: z.object({
      Maestro: z.object({
        multi_select: z.object({
          options: z.array(z.object({ name: z.string() })),
        }),
      }),
      Grado: z.object({
        multi_select: z.object({
          options: z.array(z.object({ name: z.string() })),
        }),
      }),
      Salón: z.object({
        multi_select: z.object({
          options: z.array(z.object({ name: z.string() })),
        }),
      }),
    }),
  })
  .transform((data) => ({
    teachers: data.properties.Maestro.multi_select.options
      .map((i) => i.name)
      .sort(),
    grades: data.properties.Grado.multi_select.options
      .map((i) => i.name)
      .sort(),
    rooms: data.properties.Salón.multi_select.options.map((i) => i.name).sort(),
  }));

async function getFields(
  db: D1Database,
  notion: Client,
  options?: {
    forceReload: boolean;
    databaseId: string;
  },
): Promise<z.infer<typeof teachersSchema>> {
  const cachedNotionTeachers = options?.forceReload
    ? null
    : await getNotionTeachers(db);

  if (cachedNotionTeachers) {
    console.debug("USING CACHED TEACHERS");
    return await teachersSchema.parseAsync(JSON.parse(cachedNotionTeachers));
  }

  const databaseId = options?.databaseId || (await getDatabaseId(db));
  if (!databaseId) {
    throw new MissingDatabaseIdError();
  }

  const response = await notion.databases.retrieve({ database_id: databaseId });
  const teachers = await teachersSchema.parseAsync(response);

  console.debug("UPDATING TEACHERS IN DATABASE");
  await setNotionTeachers(db, JSON.stringify(response));

  return teachers;
}

export const DAYS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
];

async function getSchedule(
  db: D1Database,
  notion: Client,
  databaseId: string,
  date_: Date,
  options?: { forceReload?: boolean; start: string | null; end: string | null },
) {
  const fullSchedule = await getFullSchedule(db, notion, databaseId, {
    forceReload: options?.forceReload ?? false,
  });

  // Add 12 hours, otherwise midnight is considered the previous day
  const date = datePlus("12 hours", date_);
  const dayOfWeek = date.getDay();
  const dayName = DAYS[dayOfWeek];
  let schedule = fullSchedule.filter((i) => i.day.includes(dayName));

  if (options?.start && options?.end) {
    schedule = schedule.filter((i) => {
      const iStart = parseInt(i.start.replace(":", ""));
      const iEnd = parseInt(i.end.replace(":", ""));
      const start = parseInt(options.start!.replace(":", ""));
      const end = parseInt(options.end!.replace(":", ""));
      return (iStart >= start && iStart < end) || (iEnd > start && iEnd <= end);
    });
  }

  return { dayName, schedule, allBlocks: fullSchedule.length };
}

export async function getScheduleDetails(
  db: D1Database,
  notion: Client,
  date: Date,
  options?: { forceReload?: boolean; start: string | null; end: string | null },
) {
  const databaseId = await getDatabaseId(db);

  if (!databaseId) {
    throw new MissingDatabaseIdError();
  }

  const { dayName, schedule, allBlocks } = await getSchedule(
    db,
    notion,
    databaseId,
    date,
    options,
  );

  const { grades, rooms, teachers } = await getFields(db, notion, {
    databaseId,
    forceReload: options?.forceReload ?? false,
  });

  const busyTeachers = schedule.flatMap((i) => i.teacher);

  const freeTeachers = teachers.filter((i) => !busyTeachers.includes(i));

  return {
    dayName,
    schedule,
    allBlocks,
    allTeachers: teachers,
    freeTeachers,
    grades,
    rooms,
  };
}
