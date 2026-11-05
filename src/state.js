import { translate, heldCredentials, tagsForSkill } from "./translate.js";

export const defaultAnswers = () => ({
  handsOn: "either", setting: "either", social: "either", interests: [],
  commuteMiles: 30, daysOnly: false, childcare: false, relocate: "no",
  incomeBy: "", minPay: 20, wantsPaidTraining: false, education: "short", hoursPerWeek: 5, freeText: ""
});

// Jordan Lee: the made-up demo veteran from the feature list (entered by hand, no parsing).
export const jordan = {
  jst: {
    jobs: [{ code: "91D", title: "Power Generation Equipment Repairer", start: "2019-03", end: "2026-12", duties: [
      "Troubleshot and repaired diesel generator sets and power plants",
      "Led 4 repairers in daily maintenance and repair operations",
      "Performed preventive maintenance checks and services (PMCS) on 30 generators",
      "Maintained accountability of tools and equipment valued at $400K",
      "Enforced shop safety procedures and completed hazard assessments",
      "Wired and tested electrical distribution for field power plants"] }],
    courses: [{ name: "Power Generation Equipment Repairer (AIT)", credits: "6 SH" }, { name: "Warrior Leader Course", credits: "3 SH" }],
    certs: []
  },
  answers: { handsOn: "hands-on", setting: "either", social: "team", interests: ["mechanical", "electrical", "leading"],
    commuteMiles: 30, daysOnly: true, childcare: true, relocate: "no", incomeBy: "2027-01-31", minPay: 25,
    wantsPaidTraining: true, education: "short", hoursPerWeek: 5, freeText: "A paid trade with daytime hours, close to home." },
  location: "Riverbend County, NJ", // made-up county, like Jordan
  // Skills from life outside the record. Jordan can uncheck or remove them like any other skill.
  extraSkills: ["Household budgeting and logistics as a single parent", "Carpentry and custom furniture building"]
};

export const state = {
  jst: null, location: null, extraSkills: [], uncheckedSkills: [], answers: defaultAnswers(), answersDone: false, selected: null,
  dream: null, firstJob: null, dreamNote: "", compare: [], horizon: "earn"
};

export function profile() {
  const skills = (state.jst ? translate(state.jst) : [])
    .map((s) => ({ ...s, confirmed: !state.uncheckedSkills.includes(s.tag) }));
  const added = state.extraSkills.map((text) => ({
    text, tags: tagsForSkill(text), creds: heldCredentials({ certs: [text], courses: [] }), line: `${text}.`
  }));
  return {
    // Only skills the user has left checked count toward matches.
    skills: [...new Set([...skills.filter((s) => s.confirmed).map((s) => s.tag), ...added.flatMap((a) => a.tags)])],
    skillItems: skills, added,
    credentials: state.jst ? heldCredentials(state.jst, state.extraSkills) : [],
    answers: state.answers
  };
}
