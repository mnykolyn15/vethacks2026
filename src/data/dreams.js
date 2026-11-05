// "What sounds like you?" motivations: each groups roles from careers.js, so people who can't name
// a dream job can start from what they care about. Role ids must exist in careers.js.
export const dreamThemes = [
  { id: "own", label: "Run my own shop someday", blurb: "Trades that can lead to a business of your own.",
    roles: ["hvac_tech", "industrial_electrician", "diesel_tech", "welder", "gen_tech"] },
  { id: "trade", label: "Master a high-paying trade", blurb: "Earn while you learn and become the expert.",
    roles: ["elevator", "industrial_electrician", "hvac_tech", "plant_ops", "welder"] },
  { id: "outdoors", label: "Build and fix things outdoors", blurb: "Work in the field instead of behind a desk.",
    roles: ["solar_tech", "wind_tech", "heavy_equip", "cdl_driver", "gen_tech"] },
  { id: "lead", label: "Lead a team", blurb: "Guide people and keep a whole operation running.",
    roles: ["maint_supervisor", "facilities_manager", "project_coord", "warehouse_sup", "maint_planner"] },
  { id: "safe", label: "Keep people safe", blurb: "Protect people, sites, and standards.",
    roles: ["safety_coord", "emt", "police", "qc_inspector", "plant_ops"] },
  { id: "plan", label: "Plan and organize", blurb: "Turn a messy job into a clear plan.",
    roles: ["project_coord", "maint_planner", "warehouse_sup", "hr_generalist", "data_analyst", "facilities_manager"] },
  { id: "tech", label: "Work with technology", blurb: "Keep the systems the modern world runs on working.",
    roles: ["data_center", "data_center_ops", "network_admin", "it_support", "data_analyst"] },
  { id: "teach", label: "Teach others", blurb: "Train people and share what you know.",
    roles: ["safety_coord", "hr_generalist", "maint_supervisor", "emt"] }
];

// What Questions answers suggest. These only pre-select cards; the person can change them.
const FROM_MOMENTS = { puzzle: "tech", pressure: "trade", result: "trade", teaching: "teach", people: "lead", operation: "plan",
  trusted: "lead", learning: "trade", exact: "trade", bigger: "safe", easier: "safe" };
const FROM_WORK = { physical: "trade", technical: "tech", planning: "plan", teaching: "teach" };

export function motivationsFromAnswers(q = {}) {
  const where = q.where || [];
  const ids = new Set([
    ...(q.moments || []).map((k) => FROM_MOMENTS[k]),
    ...(q.workTypes || []).map((k) => FROM_WORK[k])
  ]);
  // Building only points to the outdoors card if they didn't ask to stay indoors.
  if (where.includes("outdoors") || ((q.workTypes || []).includes("build") && !where.includes("indoors"))) ids.add("outdoors");
  if ((q.people || []).includes("lead")) ids.add("lead");
  if (/(own|my) (shop|business|company)/i.test(q.freeText || "")) ids.add("own");
  return dreamThemes.map((t) => t.id).filter((id) => ids.has(id));
}
