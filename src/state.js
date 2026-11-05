import { translate, heldCredentials, tagsForSkill } from "./translate.js";

// How much each question matters to the person. Hours and pay start "strong" because they are usually deal-breakers.
export const defaultImportance = () => ({
  work: "medium", pace: "medium", where: "medium", people: "medium", moments: "medium",
  hours: "strong", commute: "medium", timing: "medium", pay: "strong", training: "medium", education: "medium"
});

export const defaultAnswers = () => ({
  workTypes: [], pace: [], where: [], people: [], moments: [], hours: [],
  importance: defaultImportance(),
  commuteMiles: 30, commuteFlex: 0, relocate: "no",
  incomeBy: "", needsHelp: null,
  minHourly: "", minSalary: "",
  wantsPaidTraining: false, education: "short", hoursPerWeek: 5, freeText: ""
});

// Jordan Lee: the made-up demo veteran from the feature list (entered by hand, no parsing).
export const jordan = {
  jst: {
    jobs: [{ code: "91D", title: "Power Generation Equipment Repairer", grade: "E-5", billets: ["Team Leader"], duties: [
      "Troubleshot and repaired diesel generator sets and power plants",
      "Led 4 repairers in daily maintenance and repair operations",
      "Performed preventive maintenance checks and services (PMCS) on 30 generators",
      "Maintained accountability of tools and equipment valued at $400K",
      "Enforced shop safety procedures and completed hazard assessments",
      "Wired and tested electrical distribution for field power plants"] }],
    courses: [{ name: "Power Generation Equipment Repairer (AIT)" }, { name: "Warrior Leader Course" }],
    certs: []
  },
  answers: { ...defaultAnswers(),
    workTypes: ["physical", "build"], pace: ["problems", "pressure"], where: ["different", "indoors"], people: ["crew", "leading"],
    moments: ["puzzle", "pressure", "people"], hours: ["days"],
    commuteMiles: 30, commuteFlex: 10, relocate: "no", incomeBy: "2027-01-31", needsHelp: "no",
    minHourly: 25, minSalary: 52000, wantsPaidTraining: true, education: "short", hoursPerWeek: 5,
    freeText: "A paid trade with daytime hours, close to home." },
  location: "Riverbend County, NJ", // made-up county, like Jordan
  // Skills from life outside the record. Jordan can uncheck or remove them like any other skill.
  extraSkills: ["Household budgeting and logistics as a single parent", "Carpentry and custom furniture building"]
};

export const state = {
  jst: null, location: null, extraSkills: [], uncheckedSkills: [], answers: defaultAnswers(), answersDone: false, selected: null,
  dream: null, dreamTheme: null, firstJob: null, dreamNote: "", compare: [], horizon: "earn"
};

export function profile() {
  const skills = (state.jst ? translate(state.jst) : [])
    .map((s) => ({ ...s, confirmed: !state.uncheckedSkills.includes(s.id) }));
  const added = state.extraSkills.map((text) => ({
    text, tags: tagsForSkill(text), creds: heldCredentials({ certs: [text], courses: [] }), line: `${text}.`
  }));
  return {
    // Only skills the user has left checked count toward matches.
    skills: [...new Set([...skills.filter((s) => s.confirmed).map((s) => s.tag).filter(Boolean), ...added.flatMap((a) => a.tags)])],
    skillItems: skills, added,
    credentials: state.jst ? heldCredentials(state.jst, state.extraSkills) : [],
    answers: state.answers
  };
}
