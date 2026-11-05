// How each role appears on Your target. Keyed by career id.
// months: rough ILLUSTRATIVE time to be working in the role when a required credential is still
//   missing (includes apprenticeship/advancement time). Verify before presenting as fact.
//   With nothing missing, matching.js uses the role's baseWeeks instead.
// mode: "Hands-on" | "Mix" | "Desk + floor" | "Desk"
const p = (months, mode, blurb, how) => ({ months, mode, blurb, how });

export const pathways = {
  // Roles with no required credential land in Earn now via baseWeeks.
  data_center_ops: p(2, "Mix", "Data centers run on backup generators and power systems. Fast-growing, with clear paths to lead roles.", "Search day-shift openings near you. Microsoft also runs a datacenter pathway for military; check eligibility."),
  gen_tech: p(2, "Hands-on", "Generator dealers and service companies need techs who diagnose fast.", "Apply directly; your training record and any award citations are your proof."),
  maint_planner: p(2, "Desk + floor", "Planners schedule preventive maintenance, keep parts records, and decide what gets fixed and when.", "Lead with any team-leader experience and detailed logs."),
  diesel_tech: p(2, "Hands-on", "Fleets keep trucks and buses moving and need people who can find a fault quickly.", "Apply to municipal and private fleets; ask about tool allowances."),
  facilities_tech: p(2, "Hands-on", "Hospitals, schools, and campuses need people who keep buildings and equipment running.", "Search facilities openings at large local employers; lead with your maintenance record."),
  qc_inspector: p(2, "Mix", "Manufacturers need careful people who check work against the standard and write it up.", "Highlight inspections and records you've kept; ask about on-site training."),

  // Quick credential
  warehouse_sup: p(1, "Mix", "Warehouses need leads who can run a crew and keep inventory accurate.", "Get a one-day forklift certificate, then apply to lead roles."),
  safety_coord: p(3, "Mix", "Job sites and plants need someone who owns safety, training, and compliance.", "Earn the OSHA 30 card, then apply to construction and manufacturing firms."),

  // Grow ring
  hvac_tech: p(4, "Hands-on", "Heating and cooling work is steady, and your troubleshooting carries over.", "Earn EPA 608, then apply to shops that train new techs."),
  solar_tech: p(4, "Hands-on", "Crews install and service solar systems; electrical experience gives you a head start.", "Prepare for the NABCEP PV Associate exam and ask installers about paid training."),
  heavy_equip: p(4, "Hands-on", "Construction firms need reliable operators who also look after their machines.", "Earn the OSHA 30 card and ask local firms and unions about veteran entry."),
  cdl_driver: p(4, "Hands-on", "Local routes can offer home-every-night driving with solid pay.", "Check the military CDL skills-test waiver, then apply to local carriers."),
  data_center: p(5, "Mix", "Facilities techs keep a data center's power and cooling running around the clock.", "Earn CompTIA A+ and pair it with your power and maintenance experience."),
  it_support: p(5, "Desk", "Help desks are a common way into tech, and they reward calm troubleshooting.", "Earn CompTIA A+ and apply to help desk roles."),
  emt: p(6, "Hands-on", "EMTs provide emergency care and are often a first step toward paramedic or nursing roles.", "Compare accredited EMT courses and start dates near you."),
  wind_tech: p(6, "Hands-on", "Wind techs climb and service turbines; expect travel, since sites can be far from home.", "Complete GWO safety training and ask employers about sponsored cohorts."),
  project_coord: p(8, "Desk + floor", "Coordinators keep schedules, crews, and paperwork moving on construction jobs.", "Earn OSHA 30 and CAPM, then lead with the work you've planned."),
  welder: p(8, "Hands-on", "Certified welders work in fabrication, construction, and repair.", "Tour a local welding program and ask about veteran funding."),
  hr_generalist: p(8, "Desk", "HR teams handle hiring, benefits, and personnel records.", "Compare HR certificate programs and lead with any personnel work you've done."),
  data_analyst: p(10, "Desk", "Analysts turn messy records into decisions leaders can act on.", "Complete an analytics certificate and build one small portfolio project."),
  police: p(12, "Hands-on", "Agencies often pay recruits through the academy and may offer veteran preference.", "Check agencies' testing dates and veteran-preference rules."),

  // Dream ring
  plant_ops: p(14, "Mix", "Operators run boilers and power plants; licensed roles pay well but often rotate shifts.", "Look up your state's license path and ask plants about trainee roles."),
  network_admin: p(18, "Desk", "Admins design and run the networks a business depends on.", "Start with A+, then Network+, and move up from a help desk role."),
  maint_supervisor: p(18, "Mix", "Supervisors run the crew, the schedule, and the budget. It usually follows time as a lead tech.", "Earn OSHA 30, take lead-tech roles, and document the teams you've run."),
  facilities_manager: p(36, "Desk + floor", "Managers own a site's buildings, vendors, and budget. It pays well and tends to be daytime work.", "Move up through facilities roles while earning the FMP credential."),
  industrial_electrician: p(48, "Hands-on", "Apprentices earn while they learn and finish as licensed journey-level electricians.", "Create a Helmets to Hardhats profile and watch for local application dates."),
  elevator: p(48, "Hands-on", "A long paid apprenticeship leads to some of the highest pay in the trades.", "Find your local IUEC chapter's application dates; openings can be limited.")
};
