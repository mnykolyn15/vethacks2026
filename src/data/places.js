// Places offering veteran employment help (New Jersey coverage for the demo).
//
// IMPORTANT: the entries below are SAMPLE placeholders so the map UI can be demoed.
// They are NOT real addresses or phone numbers. Replace them with records pulled from the
// official VA facility locator (VA Lighthouse Facilities API) and the Department of Labor
// American Job Center directory (CareerOneStop). Keep the same shape.
//
// type: "ajc" (American Job Center, DOL) | "vet_center" (VA Vet Center) |
//       "va_ro" (VA regional office) | "state_rep" (state veterans' employment rep)
export const places = [
  { id: "s1", sample: true, type: "ajc", name: "SAMPLE American Job Center", lat: 40.9168, lng: -74.1718, address: "Replace with official data", phone: "", hours: "Verify before going" },
  { id: "s2", sample: true, type: "vet_center", name: "SAMPLE Vet Center", lat: 40.7357, lng: -74.1724, address: "Replace with official data", phone: "", hours: "Verify before going" },
  { id: "s3", sample: true, type: "va_ro", name: "SAMPLE VA Regional Office", lat: 40.7282, lng: -74.0776, address: "Replace with official data", phone: "", hours: "Verify before going" },
  { id: "s4", sample: true, type: "state_rep", name: "SAMPLE State Veterans' Employment Rep", lat: 40.8884, lng: -74.0460, address: "Replace with official data", phone: "", hours: "Verify before going" }
];

export const placeTypes = {
  ajc: { label: "American Job Center (U.S. Dept. of Labor)", help: ["placement", "training"] },
  vet_center: { label: "VA Vet Center", help: ["benefits"] },
  va_ro: { label: "VA Regional Office", help: ["benefits"] },
  state_rep: { label: "State veterans' employment representative", help: ["placement"] }
};
