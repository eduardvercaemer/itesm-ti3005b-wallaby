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
    }),
  })
  .transform((data) =>
    data.properties.Maestro.multi_select.options.map((i) => i.name),
  );

async function getTeachers(
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
  options?: {
    forceReload: boolean;
  },
) {
  const fullSchedule = await getFullSchedule(db, notion, databaseId, options);
  // Add 12 hours, otherwise midnight is considered the previous day
  const date = datePlus("12 hours", date_);
  const dayOfWeek = date.getDay();
  const dayName = DAYS[dayOfWeek];
  const schedule = fullSchedule.filter((i) => i.day.includes(dayName));
  return { dayName, schedule };
}

export async function getScheduleDetails(
  db: D1Database,
  notion: Client,
  date: Date,
  options?: { forceReload: boolean },
) {
  const databaseId = await getDatabaseId(db);

  if (!databaseId) {
    throw new MissingDatabaseIdError();
  }

  const { dayName, schedule } = await getSchedule(
    db,
    notion,
    databaseId,
    date,
    {
      forceReload: options?.forceReload ?? false,
    },
  );

  const teachers = await getTeachers(db, notion, {
    databaseId,
    forceReload: options?.forceReload ?? false,
  });

  return { dayName, schedule, teachers };
}
