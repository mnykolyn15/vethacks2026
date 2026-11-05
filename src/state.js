import { translate, heldCredentials, tagsForSkill } from "./translate.js";

export const defaultAnswers = () => ({
  handsOn: "either", setting: "either", social: "either", interests: [],
  commuteMiles: 30, daysOnly: false, childcare: false, relocate: "no",
  incomeBy: "", minPay: 20, wantsPaidTraining: false, education: "short", hoursPerWeek: 5, freeText: ""
});

// Jordan Lee: the made-up demo veteran from the feature list (entered by hand, no parsing).
export const jordan = {
  jst: {
    jobs: [{ code: "52D", title: "Power Generation Equipment Repairer", start: "2019-03", end: "2026-12", duties: [
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
    commuteMiles: 30, daysOnly: true, childcare: true, relocate: "no", incomeBy: "2027-01-31", minPay: 20,
    wantsPaidTraining: true, education: "short", hoursPerWeek: 5, freeText: "A paid trade with daytime hours, close to home." },
  dream: "industrial_electrician"
};

export const state = {
  jst: null, extraSkills: [], answers: defaultAnswers(), answersDone: false, selected: null,
  dream: null, compare: [], horizon: "earn"
};

export function profile() {
  const skills = state.jst ? translate(state.jst) : [];
  const added = state.extraSkills.map((text) => {
    const creds = heldCredentials({ certs: [text], courses: [] });
    return { text, tags: tagsForSkill(text), creds, line: creds.length ? `${text}.` : `Experience with ${text}.` };
  });
  return {
    skills: [...new Set([...skills.map((s) => s.tag), ...added.flatMap((a) => a.tags)])],
    skillItems: skills, added,
    credentials: state.jst ? heldCredentials(state.jst, state.extraSkills) : [],
    answers: state.answers
  };
}
