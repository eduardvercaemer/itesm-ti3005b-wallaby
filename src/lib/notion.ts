import { D1Database } from "@cloudflare/workers-types";
import { Client } from "@notionhq/client";
import { z } from "@builder.io/qwik-city";
import { datePlus } from "itty-time";
import { getSchedule_, setSchedule } from "~/lib/settings";

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

const schedulePageSchema = z.object({
  next_cursor: z.string().nullable(),
  has_more: z.boolean(),
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
            .transform((i) => {
              const title = i.title[0];
              return title?.text.content ?? null;
            }),
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
});

const scheduleFieldsSchema = z
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
      Semana: z.object({
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
    weeks: data.properties.Semana.multi_select.options
      .map((i) => i.name)
      .sort(),
  }));

const scheduleSchema = z.object({
  classes: z.array(
    z.object({
      id: z.string(),
      url: z.string(),
      title: z.string().nullable(),
      grade: z.array(z.string()),
      teacher: z.array(z.string()),
      day: z.array(z.string()),
      room: z.array(z.string()),
      start: z.string(),
      end: z.string(),
    }),
  ),
  grades: z.array(z.string()),
  rooms: z.array(z.string()),
  teachers: z.array(z.string()),
  weeks: z.array(z.string()).optional(),
});

export async function fetchFullScheduleFromNotion(
  db: D1Database,
  notion: Client,
  databaseId: string,
) {
  console.log("UPDATING SCHEDULE FROM NOTION ...");

  let hasMore: boolean;
  let cursor: string | undefined = undefined;
  const classes: z.infer<typeof schedulePageSchema>["results"] = [];
  do {
    console.log(`> FETCHING SCHEDULE PAGE ${cursor ? `CURSOR=${cursor}` : ""}`);
    const response = await notion.databases.query({
      database_id: databaseId,
      sorts: [
        { property: "Dia", direction: "ascending" },
        { property: "Inicio", direction: "ascending" },
      ],
      start_cursor: cursor,
    });
    const page = await schedulePageSchema.parseAsync(response);
    hasMore = page.has_more;
    cursor = page.next_cursor ?? undefined;
    classes.push(...page.results);
  } while (hasMore);

  console.log("> FETCHING SCHEDULE FIELDS");
  const response = await notion.databases.retrieve({ database_id: databaseId });
  const { grades, rooms, teachers, weeks } =
    await scheduleFieldsSchema.parseAsync(response);

  console.log(
    `> CLASSES=${classes.length} GRADES=${grades.length} ROOMS=${rooms.length} TEACHERS=${teachers.length}`,
  );
  const schedule = { classes, grades, rooms, weeks, teachers };

  await setSchedule(db, JSON.stringify(schedule));

  return schedule;
}

export async function getSchedule(db: D1Database) {
  const schedule = await getSchedule_(db);
  // console.debug("SCHEDULE", schedule);
  return schedule
    ? await scheduleSchema.parseAsync(JSON.parse(schedule))
    : null;
}
