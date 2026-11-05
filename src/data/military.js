// A small curated list of common codes with TYPICAL TASKS (the full code list is codes.json; see codeSearch.js).
// `duties` are used only when the user hasn't entered their own tasks, and are labelled as typical in the UI.
const m = (code, branch, title, ...duties) => ({ code, branch, title, duties });

export const codes = [
  // Army MOS
  m("11B", "Army", "Infantryman", "Led teams through high-stakes operations", "Planned and briefed missions to stakeholders"),
  m("12B", "Army", "Combat Engineer", "Supervised construction projects", "Operated heavy equipment and coordinated crews"),
  m("12N", "Army", "Horizontal Construction Engineer", "Operated heavy equipment on construction sites", "Coordinated crews and inspected equipment"),
  m("12R", "Army", "Interior Electrician", "Installed and tested electrical wiring and circuits", "Troubleshot electrical faults and followed safety procedures"),
  m("12W", "Army", "Carpentry and Masonry Specialist", "Built and repaired structures from plans", "Followed safety procedures and coordinated crews"),
  m("13B", "Army", "Cannon Crewmember", "Led a gun crew through live-fire operations", "Maintained equipment and enforced safety procedures"),
  m("15T", "Army", "UH-60 Helicopter Repairer", "Inspected and repaired helicopters", "Performed preventive maintenance and kept maintenance records"),
  m("19D", "Army", "Cavalry Scout", "Conducted reconnaissance and reported findings", "Operated vehicles and communications equipment"),
  m("25B", "Army", "Information Technology Specialist", "Installed and maintained networks and computers", "Resolved user tickets and enforced information security"),
  m("25U", "Army", "Signal Support Systems Specialist", "Installed and maintained communications systems", "Troubleshot network faults and trained users"),
  m("31B", "Army", "Military Police", "Enforced regulations and responded to incidents", "Conducted investigations and wrote reports"),
  m("35F", "Army", "Intelligence Analyst", "Analyzed data and produced reports for leadership", "Briefed leaders on trends and risks"),
  m("36B", "Army", "Financial Management Technician", "Processed payments and maintained financial records", "Advised commanders on budgets"),
  m("42A", "Army", "Human Resources Specialist", "Managed personnel records and actions", "Advised staff on benefits and entitlements"),
  m("68W", "Army", "Combat Medic Specialist", "Provided emergency patient care and triage", "Maintained patient records and medical supplies"),
  m("74D", "Army", "CBRN Specialist", "Conducted hazard assessments and safety training", "Maintained and inspected protective equipment"),
  m("88M", "Army", "Motor Transport Operator", "Operated heavy trucks in convoys", "Performed preventive maintenance on vehicles"),
  m("88N", "Army", "Transportation Management Coordinator", "Planned and coordinated cargo and personnel movement", "Maintained shipping records and schedules"),
  m("91B", "Army", "Wheeled Vehicle Mechanic", "Diagnosed and repaired wheeled vehicles", "Performed preventive maintenance checks and services (PMCS)"),
  m("91D", "Army", "Power Generation Equipment Repairer", "Troubleshot and repaired generators and power plants", "Performed preventive maintenance checks and services (PMCS)", "Maintained tool and equipment accountability"),
  m("91E", "Army", "Allied Trade Specialist", "Fabricated and welded metal parts", "Operated machine tools and followed safety procedures"),
  m("92A", "Army", "Automated Logistical Specialist", "Managed inventory and supply distribution", "Maintained supply records and accountability"),
  m("92G", "Army", "Culinary Specialist", "Planned menus and supervised food preparation", "Enforced food safety and managed supplies"),
  m("92Y", "Army", "Unit Supply Specialist", "Managed inventory and equipment accountability", "Processed supply requests and distribution"),
  m("94E", "Army", "Radio and Communications Security Repairer", "Repaired and tested communications equipment", "Troubleshot electronic faults and kept repair records"),
  // Marine Corps MOS
  m("0111", "Marine Corps", "Administrative Specialist", "Managed personnel records and administrative actions", "Prepared reports and advised Marines on entitlements"),
  m("0231", "Marine Corps", "Intelligence Specialist", "Analyzed data and produced intelligence reports", "Briefed leaders on trends and threats"),
  m("0311", "Marine Corps", "Rifleman", "Led a fire team through patrols and training", "Maintained accountability of weapons and equipment", "Enforced safety procedures during live-fire training"),
  m("0331", "Marine Corps", "Machine Gunner", "Operated and maintained crew-served weapons", "Trained Marines and enforced safety procedures"),
  m("0341", "Marine Corps", "Mortarman", "Operated and maintained mortar systems", "Led a section and enforced safety procedures"),
  m("0351", "Marine Corps", "Infantry Assaultman", "Operated and maintained weapons systems", "Led a team and planned training"),
  m("0369", "Marine Corps", "Infantry Unit Leader", "Led and supervised a platoon", "Planned operations and trained junior Marines"),
  m("0431", "Marine Corps", "Logistics/Embarkation Specialist", "Planned and coordinated cargo movement", "Maintained shipping records and inventory"),
  m("0621", "Marine Corps", "Radio Operator", "Installed and operated communications equipment", "Troubleshot radio faults and trained operators"),
  m("1141", "Marine Corps", "Electrician", "Installed and maintained electrical wiring and generators", "Troubleshot electrical faults and followed safety procedures"),
  m("1161", "Marine Corps", "Refrigeration and Air Conditioning Technician", "Installed and repaired refrigeration and air conditioning systems", "Diagnosed faults and performed preventive maintenance"),
  m("1316", "Marine Corps", "Metal Worker", "Fabricated and welded metal parts", "Followed safety procedures and read blueprints"),
  m("1345", "Marine Corps", "Engineer Equipment Operator", "Operated heavy equipment on construction projects", "Inspected equipment and followed safety procedures"),
  m("1371", "Marine Corps", "Combat Engineer", "Supervised construction and demolition projects", "Operated heavy equipment and coordinated crews"),
  m("3043", "Marine Corps", "Supply Administration and Operations Specialist", "Managed inventory and equipment accountability", "Processed supply requests and maintained records"),
  m("3521", "Marine Corps", "Automotive Maintenance Technician", "Diagnosed and repaired vehicles", "Performed preventive maintenance and kept service records"),
  m("3531", "Marine Corps", "Motor Vehicle Operator", "Operated heavy trucks in convoys", "Performed preventive maintenance on vehicles"),
  m("5811", "Marine Corps", "Military Police", "Enforced regulations and responded to incidents", "Conducted investigations and wrote reports"),
  // Air Force AFSC
  m("1N0X1", "Air Force", "All-Source Intelligence Analyst", "Analyzed data and produced intelligence reports", "Briefed leaders on trends and risks"),
  m("2A3X3", "Air Force", "Tactical Aircraft Maintenance", "Inspected and repaired aircraft", "Performed preventive maintenance and kept maintenance records"),
  m("2A6X1", "Air Force", "Aerospace Propulsion", "Inspected, troubleshot, and repaired jet engines", "Performed preventive maintenance and kept maintenance records"),
  m("2F0X1", "Air Force", "Fuels", "Managed fuel storage and distribution", "Enforced safety procedures and kept inventory records"),
  m("2S0X1", "Air Force", "Materiel Management", "Managed inventory and supply distribution", "Maintained supply records and accountability"),
  m("2T1X1", "Air Force", "Ground Transportation", "Operated heavy vehicles safely", "Planned routes and kept dispatch records"),
  m("2T3X1", "Air Force", "Mission Generation Vehicular Equipment Maintenance", "Diagnosed and repaired vehicles and equipment", "Performed preventive maintenance and kept service records"),
  m("3D0X2", "Air Force", "Cyber Systems Operations", "Installed and maintained servers and networks", "Resolved user tickets and enforced information security"),
  m("3D1X2", "Air Force", "Cyber Transport Systems", "Installed and maintained networks", "Troubleshot network faults and trained users"),
  m("3E0X1", "Air Force", "Electrical Systems", "Installed and repaired electrical wiring and systems", "Troubleshot electrical faults and followed safety procedures"),
  m("3E0X2", "Air Force", "Electrical Power Production", "Operated, maintained, and repaired generators and power plants", "Performed preventive maintenance and troubleshot faults"),
  m("3E1X1", "Air Force", "Heating, Ventilation, Air Conditioning and Refrigeration", "Installed and repaired HVAC and refrigeration systems", "Diagnosed faults and performed preventive maintenance"),
  m("3E4X1", "Air Force", "Water and Fuel Systems Maintenance", "Maintained and repaired water and fuel systems", "Inspected equipment and followed safety procedures"),
  m("3E7X1", "Air Force", "Fire Protection", "Responded to emergencies and fires", "Inspected equipment and enforced safety procedures"),
  m("3F0X1", "Air Force", "Personnel", "Managed personnel records and actions", "Advised staff on benefits and entitlements"),
  m("3P0X1", "Air Force", "Security Forces", "Enforced security and responded to incidents", "Conducted patrols and wrote reports"),
  m("4N0X1", "Air Force", "Aerospace Medical Service", "Provided patient care and maintained medical records", "Assisted clinicians and managed medical supplies"),
  m("6F0X1", "Air Force", "Financial Management and Comptroller", "Processed payments and maintained financial records", "Advised leaders on budgets"),
  // Navy / Coast Guard rates
  m("AD", "Navy", "Aviation Machinist's Mate", "Inspected and repaired aircraft engines", "Performed preventive maintenance and kept maintenance records"),
  m("AM", "Navy", "Aviation Structural Mechanic", "Inspected and repaired aircraft structures and hydraulic systems", "Performed preventive maintenance and followed safety procedures"),
  m("AT", "Navy", "Aviation Electronics Technician", "Troubleshot and repaired avionics and electronic systems", "Performed preventive maintenance and kept repair records"),
  m("BM", "Navy", "Boatswain's Mate", "Led deck crews and supervised seamanship operations", "Enforced safety procedures and maintained equipment"),
  m("BU", "Navy", "Builder", "Built and repaired structures from plans", "Followed safety procedures and coordinated crews"),
  m("CE", "Navy", "Construction Electrician", "Installed and maintained electrical wiring and power systems", "Troubleshot faults and followed safety procedures"),
  m("CS", "Navy", "Culinary Specialist", "Planned menus and supervised food preparation", "Enforced food safety and managed supplies"),
  m("CTN", "Navy", "Cryptologic Technician (Networks)", "Operated and secured computer networks", "Analyzed data and produced reports"),
  m("EM", "Navy", "Electrician's Mate", "Operated, maintained, and repaired electrical power generation systems", "Troubleshot electrical faults and performed preventive maintenance"),
  m("EN", "Navy", "Engineman", "Operated, maintained, and repaired diesel engines and generators", "Performed preventive maintenance and troubleshot faults"),
  m("EO", "Navy", "Equipment Operator", "Operated heavy equipment on construction projects", "Inspected equipment and followed safety procedures"),
  m("ET", "Navy", "Electronics Technician", "Troubleshot and repaired electronic systems", "Performed preventive maintenance and kept repair records"),
  m("GSE", "Navy", "Gas Turbine Systems Technician (Electrical)", "Operated and repaired gas turbine generators and electrical systems", "Troubleshot faults and performed preventive maintenance"),
  m("GSM", "Navy", "Gas Turbine Systems Technician (Mechanical)", "Operated and repaired gas turbine engines", "Troubleshot faults and performed preventive maintenance"),
  m("HM", "Navy", "Hospital Corpsman", "Provided emergency patient care and triage", "Maintained patient records and medical supplies"),
  m("HT", "Navy", "Hull Maintenance Technician", "Welded and repaired structures and piping", "Followed safety procedures and performed damage control"),
  m("IS", "Navy", "Intelligence Specialist", "Analyzed data and produced intelligence reports", "Briefed leaders on trends and threats"),
  m("IT", "Navy", "Information Systems Technician", "Installed and maintained networks and computers", "Resolved user tickets and enforced information security"),
  m("LS", "Navy", "Logistics Specialist", "Managed inventory and supply distribution", "Maintained supply records and accountability"),
  m("MA", "Navy", "Master-at-Arms", "Enforced regulations and responded to incidents", "Conducted investigations and wrote reports"),
  m("MM", "Navy", "Machinist's Mate", "Operated, maintained, and repaired engines, pumps, and power plants", "Performed preventive maintenance and troubleshot faults"),
  m("SW", "Navy", "Steelworker", "Fabricated and welded structural steel", "Followed safety procedures and read blueprints"),
  m("UT", "Navy", "Utilitiesman", "Installed and repaired plumbing, HVAC, and power systems", "Performed preventive maintenance and followed safety procedures"),
  m("YN", "Navy", "Yeoman", "Managed personnel records and administrative actions", "Prepared reports and advised sailors on entitlements"),
  m("MK", "Coast Guard", "Machinery Technician", "Operated, maintained, and repaired engines and generators", "Performed preventive maintenance and troubleshot faults"),
  m("ME", "Coast Guard", "Maritime Enforcement Specialist", "Enforced regulations and responded to incidents", "Conducted boardings and wrote reports"),
  m("HS", "Coast Guard", "Health Services Technician", "Provided emergency patient care and triage", "Maintained patient records and medical supplies"),
  m("SK", "Coast Guard", "Storekeeper", "Managed inventory and supply distribution", "Maintained supply records and accountability")
];

// Lets "3E052" or "3e0x2" find 3E0X2, and ignores spaces and dashes.
export function normalizeCode(raw = "") {
  let c = raw.toUpperCase().replace(/[\s-]/g, "");
  if (/^\d[A-Z]\d[0-9X]\d$/.test(c)) c = `${c.slice(0, 3)}X${c[4]}`;
  return c;
}
const index = new Map(codes.map((c) => [c.code, c]));
export const lookupCode = (raw) => index.get(normalizeCode(raw)) || null;

// Billets: the position someone held (the "corporate" title), as opposed to the MOS (the functional job).
// `civilian` is the closest everyday title; `does` is what that position typically involves.
export const billets = [
  { title: "Team Leader", civilian: "Team Lead / Crew Lead", does: "Led a small team and was accountable for its people, equipment, and results" },
  { title: "Squad Leader", civilian: "Supervisor", does: "Supervised a squad, planned daily tasks, and trained junior members" },
  { title: "Section Chief", civilian: "Section Manager", does: "Supervised a section and coordinated its daily work" },
  { title: "Platoon Sergeant", civilian: "Operations Manager", does: "Supervised a platoon and advised the commander on training and personnel" },
  { title: "Shop Foreman / NCOIC", civilian: "Shop Foreman", does: "Supervised daily shop work, scheduled maintenance, and tracked work orders" },
  { title: "Maintenance Supervisor", civilian: "Maintenance Supervisor", does: "Supervised maintenance crews and scheduled preventive maintenance" },
  { title: "Instructor / Trainer", civilian: "Trainer", does: "Instructed and mentored personnel on technical skills" },
  { title: "Supply / Armorer NCO", civilian: "Inventory Control Specialist", does: "Managed inventory and equipment accountability" },
  { title: "Safety NCO", civilian: "Safety Coordinator", does: "Enforced safety procedures and completed hazard assessments" },
  { title: "Operations NCO", civilian: "Operations Coordinator", does: "Planned and coordinated operations and schedules" },
  { title: "Training NCO", civilian: "Training Coordinator", does: "Planned and coordinated training for personnel" }
];
export const billetInfo = (title) => billets.find((b) => b.title.toLowerCase() === title.trim().toLowerCase()) || null;

export const payGrades = [
  ...Array.from({ length: 9 }, (_, i) => `E-${i + 1}`),
  ...Array.from({ length: 5 }, (_, i) => `W-${i + 1}`),
  ...Array.from({ length: 10 }, (_, i) => `O-${i + 1}`)
];
// E-5 and above, warrant officers, and officers lead other people.
export const isLeadershipGrade = (g = "") => /^[WO]-/.test(g) || (/^E-(\d)$/.test(g) && Number(g.slice(2)) >= 5);
