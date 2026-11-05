// Dream starters: "what sounds like you" themes that group roles from careers.js, so people who
// can't name a dream job can start from what they care about. Role ids must exist in careers.js.
export const dreamThemes = [
  { id: "lead", label: "Lead a team", blurb: "Guide people and keep a whole operation running.",
    roles: ["maint_supervisor", "facilities_manager", "project_coord", "warehouse_sup", "maint_planner"] },
  { id: "trade", label: "Master a high-paying trade", blurb: "Earn while you learn and become the expert.",
    roles: ["elevator", "industrial_electrician", "hvac_tech", "plant_ops", "welder"] },
  { id: "tech", label: "Work with technology", blurb: "Keep the systems the modern world runs on working.",
    roles: ["data_center", "data_center_ops", "network_admin", "it_support", "data_analyst"] },
  { id: "outdoors", label: "Build and fix things outdoors", blurb: "Work in the field instead of behind a desk.",
    roles: ["solar_tech", "wind_tech", "heavy_equip", "cdl_driver", "gen_tech"] },
  { id: "safe", label: "Keep people safe", blurb: "Protect people, sites, and standards.",
    roles: ["safety_coord", "emt", "police", "qc_inspector", "plant_ops"] },
  { id: "own", label: "Run my own shop someday", blurb: "Trades that can lead to a business of your own.",
    roles: ["hvac_tech", "industrial_electrician", "diesel_tech", "welder", "gen_tech"] },
  { id: "plan", label: "Plan and organize", blurb: "Turn a messy job into a clear plan.",
    roles: ["project_coord", "maint_planner", "warehouse_sup", "hr_generalist", "data_analyst"] }
];
