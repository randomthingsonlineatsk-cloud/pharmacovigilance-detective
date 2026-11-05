// ---------------------------------------------------------------------------
// Additional reference content: ICSR-building exercises, signal detection
// (PRR/ROR/IC), RMP/REMS, the universal CIOMS-I/ICH-E2B form anatomy, and
// country-specific ADR reporting channels.
// ---------------------------------------------------------------------------

export interface IcsrBuilderCase {
  narrative: string
  eventOptions: string[]
  correctEvent: string
  productOptions: string[]
  correctProduct: string
  diagnosisOptions: string[]
  correctDiagnosis: string
}

// Reuses the fictional drugs from the case bank. "Diagnosis" here refers to
// the INDICATION/history context (what ICD-10 actually codes), not the
// adverse event itself — a common point of confusion this exercise targets.
export const ICSR_BUILDER_CASES: IcsrBuilderCase[] = [
  {
    narrative: 'A 58-year-old man on Zolvamex for hypertension develops facial and tongue swelling requiring hospitalization.',
    eventOptions: ['Angioedema', 'Urticaria', 'Anaphylaxis'],
    correctEvent: 'Angioedema',
    productOptions: ['Zolvamex', 'Cardinex', 'Actrivex'],
    correctProduct: 'Zolvamex',
    diagnosisOptions: ['I10 \u2014 Essential hypertension', 'E11 \u2014 Type 2 diabetes mellitus', 'J45 \u2014 Asthma'],
    correctDiagnosis: 'I10 \u2014 Essential hypertension',
  },
  {
    narrative: 'A 55-year-old man with type 2 diabetes started Glucotane and presents with diabetic ketoacidosis requiring hospitalization.',
    eventOptions: ['Diabetic ketoacidosis', 'Hypoglycemia', 'Urinary tract infection'],
    correctEvent: 'Diabetic ketoacidosis',
    productOptions: ['Glucotane', 'Thyrofix', 'Lipidorex'],
    correctProduct: 'Glucotane',
    diagnosisOptions: ['E11 \u2014 Type 2 diabetes mellitus', 'I48 \u2014 Atrial fibrillation', 'K85 \u2014 Acute pancreatitis'],
    correctDiagnosis: 'E11 \u2014 Type 2 diabetes mellitus',
  },
  {
    narrative: 'A 45-year-old man using Pulmatide inhaler for asthma reports a new mild metallic taste.',
    eventOptions: ['Dysgeusia (taste disturbance)', 'Oral candidiasis', 'Bronchospasm'],
    correctEvent: 'Dysgeusia (taste disturbance)',
    productOptions: ['Pulmatide', 'Bronchazol', 'Dermacure'],
    correctProduct: 'Pulmatide',
    diagnosisOptions: ['J45 \u2014 Asthma', 'N39.0 \u2014 Urinary tract infection', 'D64.9 \u2014 Anemia'],
    correctDiagnosis: 'J45 \u2014 Asthma',
  },
  {
    narrative: 'A 76-year-old man on Vitalyse for atrial fibrillation develops major gastrointestinal bleeding requiring hospitalization.',
    eventOptions: ['Gastrointestinal hemorrhage', 'Anemia', 'Bradycardia'],
    correctEvent: 'Gastrointestinal hemorrhage',
    productOptions: ['Vitalyse', 'Cardinex', 'Osteovar'],
    correctProduct: 'Vitalyse',
    diagnosisOptions: ['I48 \u2014 Atrial fibrillation', 'M81 \u2014 Osteoporosis', 'T78.3 \u2014 Angioedema'],
    correctDiagnosis: 'I48 \u2014 Atrial fibrillation',
  },
  {
    narrative: 'A 68-year-old woman on Osteovar for osteoporosis develops severe uveitis requiring hospitalization.',
    eventOptions: ['Uveitis', 'Osteonecrosis of the jaw', 'Atypical fracture'],
    correctEvent: 'Uveitis',
    productOptions: ['Osteovar', 'Lipidorex', 'Analgeva'],
    correctProduct: 'Osteovar',
    diagnosisOptions: ['M81 \u2014 Osteoporosis', 'K92.2 \u2014 GI hemorrhage', 'E11 \u2014 Type 2 diabetes mellitus'],
    correctDiagnosis: 'M81 \u2014 Osteoporosis',
  },
  {
    narrative: 'A 61-year-old woman on Actrivex for metastatic lung cancer develops Stevens-Johnson syndrome, requiring ICU admission.',
    eventOptions: ['Stevens-Johnson syndrome', 'Rash', 'Elevated liver enzymes'],
    correctEvent: 'Stevens-Johnson syndrome',
    productOptions: ['Actrivex', 'Immunorex', 'Sedaquel'],
    correctProduct: 'Actrivex',
    diagnosisOptions: ['C34 \u2014 Malignant neoplasm of bronchus/lung', 'I10 \u2014 Essential hypertension', 'N39.0 \u2014 Urinary tract infection'],
    correctDiagnosis: 'C34 \u2014 Malignant neoplasm of bronchus/lung',
  },
]

// ---------------------------------------------------------------------------
// Signal detection: disproportionality analysis (PRR / ROR / IC)
// ---------------------------------------------------------------------------

export const SIGNAL_2X2_EXPLANATION = 'Disproportionality analysis compares how often a drug-event pair is reported versus what would be expected if the drug and event were unrelated, using a 2\u00d72 table: a = reports with the suspect drug AND the event of interest; b = reports with the suspect drug and other events; c = reports of the event with other drugs; d = all other reports (other drugs, other events).'

export interface SignalResult {
  prr: number
  ror: number
  ic: number
  n: number
}

/** Standard formulas: PRR = [a/(a+b)] / [c/(c+d)]; ROR = (a*d)/(b*c); IC (BCPNN) = log2(a*N / ((a+b)*(a+c))), N = a+b+c+d. */
export function computeSignalStats(a: number, b: number, c: number, d: number): SignalResult {
  const n = a + b + c + d
  const prr = c + d > 0 && c > 0 ? (a / (a + b)) / (c / (c + d)) : NaN
  const ror = b > 0 && c > 0 ? (a * d) / (b * c) : NaN
  const ic = (a + b) > 0 && (a + c) > 0 && a > 0 ? Math.log2((a * n) / ((a + b) * (a + c))) : NaN
  return { prr, ror, ic, n }
}

export const EVANS_CRITERIA_NOTE = 'A commonly cited rule of thumb (Evans\u2019 criteria) flags a statistical signal of disproportionate reporting when PRR \u2265 2, the chi-squared value is \u2265 4, and there are \u2265 3 cases \u2014 but a statistical signal is only a starting point for investigation, never a confirmed causal finding on its own.'

// ---------------------------------------------------------------------------
// Risk Management Plans (EU-style RMP) and REMS (US FDA)
// ---------------------------------------------------------------------------

export const RMP_NOTE = 'A Risk Management Plan (RMP), required by the EMA and adopted in similar form by many regulators worldwide, documents a product\u2019s safety specification (what\u2019s known and unknown about its risks), the planned pharmacovigilance activities to characterize those risks further, and the risk minimization measures in place \u2014 and it\u2019s a living document, updated across the product\u2019s lifecycle as new safety information emerges.'

export const REMS_NOTE = 'A Risk Evaluation and Mitigation Strategy (REMS), used by the US FDA for certain higher-risk products, can include a Medication Guide for patients, a communication plan for healthcare providers, and Elements To Assure Safe Use (ETASU) such as prescriber certification, mandatory patient monitoring, or restricted distribution through specific pharmacies.'

// ---------------------------------------------------------------------------
// Universal ICSR form anatomy (CIOMS I / ICH E2B logic) — most national forms,
// whatever they're called locally, are built around this same 4-part
// structure.
// ---------------------------------------------------------------------------

export interface FormSection {
  id: string
  title: string
  fields: string[]
  explanation: string
}

export const CIOMS_FORM_SECTIONS: FormSection[] = [
  {
    id: 'patient',
    title: 'I. Patient Information',
    fields: ['Initials', 'Age / date of birth', 'Sex', 'Weight (if relevant)'],
    explanation: 'Identifies (without full personal details) who experienced the event \u2014 one of the four minimum criteria for a valid ICSR.',
  },
  {
    id: 'reaction',
    title: 'II. Reaction / Event Information',
    fields: ['Description of the reaction', 'Onset date', 'Outcome', 'Seriousness criteria checked'],
    explanation: 'Describes what happened, when, and how it resolved \u2014 this is what gets coded to a MedDRA Preferred Term.',
  },
  {
    id: 'drug',
    title: 'III. Suspect Drug(s) Information',
    fields: ['Drug name (brand/generic)', 'Dose, route, frequency', 'Start/stop dates', 'Indication', 'Dechallenge/rechallenge'],
    explanation: 'Identifies the suspect medication and how it was used \u2014 coded via WHODrug, with the indication coded via ICD-10.',
  },
  {
    id: 'reporter',
    title: 'IV. Reporter / Sender Information',
    fields: ['Reporter name & qualification (HCP, patient, etc.)', 'Contact details', 'Report source', 'Initial or follow-up report'],
    explanation: 'Identifies who is reporting and how to reach them for follow-up \u2014 the other minimum criterion for a valid ICSR.',
  },
]

export interface CountryForm {
  key: string // matches Regulator.key
  formName: string
  channel: string
  detailed: boolean // true if the specific form name/number below is well-documented
}

export const COUNTRY_FORMS: CountryForm[] = [
  { key: 'FDA', formName: 'MedWatch Form 3500 (healthcare professionals) / 3500B (consumers) / 3500A (mandatory reporters)', channel: 'Online via FDA MedWatch Online, or by mail/fax', detailed: true },
  { key: 'HC', formName: 'Canada Vigilance Adverse Reaction Reporting Form', channel: 'Online, by mail, or by fax', detailed: true },
  { key: 'EMA', formName: 'Electronic ICSR in ICH E2B(R3) format submitted to EudraVigilance (EU-wide); individual member states may also offer national paper forms', channel: 'Electronic submission is standard EU-wide; some national forms available on paper', detailed: true },
  { key: 'MHRA', formName: 'Yellow Card', channel: 'Online, via the Yellow Card mobile app, or a paper card', detailed: true },
  { key: 'CDSCO', formName: 'PvPI Suspected Adverse Drug Reaction Reporting Form', channel: 'Online via the PvPI portal, or offline (paper form to the nearest ADR Monitoring Centre)', detailed: true },
  { key: 'TGA', formName: '"Report a problem or side effect" online form', channel: 'Online, or a downloadable paper form by mail/fax', detailed: true },
  { key: 'SWISSMEDIC', formName: 'National ADR reporting form', channel: 'Online and offline options are available; specific form name not detailed here', detailed: false },
  { key: 'PMDA', formName: 'National post-marketing safety reporting forms', channel: 'Primarily submitted by marketing authorization holders; specific consumer-facing form not detailed here', detailed: false },
  { key: 'NMPA', formName: 'National ADR monitoring system reporting forms', channel: 'Online and offline options exist; specific form name not detailed here', detailed: false },
  { key: 'HSA', formName: 'National adverse event reporting form', channel: 'Online and offline options are available; specific form name not detailed here', detailed: false },
  { key: 'MFDS', formName: 'National drug safety reporting forms', channel: 'Online and offline options exist; specific form name not detailed here', detailed: false },
  { key: 'BPOM', formName: 'MESO (Meso Esa Obat) reporting form', channel: 'Online and offline options are available; specific form details not confirmed here', detailed: false },
  { key: 'ANVISA', formName: 'National pharmacovigilance reporting forms (VigiMed/Notivisa)', channel: 'Online and offline options exist; specific form name not detailed here', detailed: false },
  { key: 'COFEPRIS', formName: 'National pharmacovigilance reporting forms', channel: 'Online and offline options are available; specific form name not detailed here', detailed: false },
  { key: 'ANMAT', formName: 'National pharmacovigilance reporting forms', channel: 'Online and offline options exist; specific form name not detailed here', detailed: false },
  { key: 'SFDA', formName: 'National pharmacovigilance reporting forms', channel: 'Online and offline options are available; specific form name not detailed here', detailed: false },
  { key: 'UAE_MOHAP', formName: 'National pharmacovigilance reporting forms', channel: 'Online and offline options exist; specific form name not detailed here', detailed: false },
  { key: 'SAHPRA', formName: 'National ADR reporting forms', channel: 'Online and offline options are available; specific form name not detailed here', detailed: false },
  { key: 'NAFDAC', formName: 'National pharmacovigilance reporting forms', channel: 'Online and offline options exist; specific form name not detailed here', detailed: false },
  { key: 'AMA', formName: 'Continental/member-state reporting frameworks', channel: 'Varies by African Union member state; not detailed here', detailed: false },
  { key: 'WHO_PQ', formName: 'VigiFlow (a case management system many national centers use to feed VigiBase)', channel: 'Electronic, via national centers', detailed: true },
]
export const COUNTRY_FORMS_NOTE = 'Every national form, whatever it\u2019s called, is built around the same universal 4-part anatomy shown above. Specific form names and numbers are included here only where they\u2019re well-documented publicly (marked in bold below); for the rest, only the general channel (online/offline availability) is shown rather than guessing at a specific form name.'
