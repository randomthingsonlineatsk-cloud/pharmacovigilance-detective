// ---------------------------------------------------------------------------
// Combinatorial case generator — the mechanism behind "endless practice."
// Rather than hand-writing a fixed list, this combines a drug bank, a large
// adverse-event bank organized by real MedDRA System Organ Class names, and
// a set of causality/severity templates to generate cases on demand. Every
// generated case has its correct classification computed from the same
// choices used to build its narrative, so it's always internally consistent
// — the same approach the Mutation Quiz in the DNA app uses for its rounds.
// With 20 drugs, ~100 distinct adverse event terms, 2 expectedness branches,
// 2 causality branches, and randomized demographics/duration, the number of
// distinct combinations comfortably exceeds 1000 — this is a generator, not
// a fixed bank, so it effectively never runs out.
// ---------------------------------------------------------------------------

import type { PVCase, Seriousness, Expectedness, Causality, Difficulty } from './pv-cases'

export interface GenDrug {
  name: string
  therapeuticArea: string
  atcCode: string // real ATC (Anatomical Therapeutic Chemical) top-level class code
  atcClassName: string
  referenceSafetyInfo: string[]
  productCategory: string
}

// ATC codes are the real, public WHO classification system — the drug names
// themselves are entirely fictional, but the class codes are genuine.
export const GEN_DRUGS: GenDrug[] = [
  { name: 'Zolvamex', therapeuticArea: 'Cardiovascular', atcCode: 'C09A', atcClassName: 'ACE inhibitors, plain', referenceSafetyInfo: ['Dry cough', 'Dizziness', 'Hyperkalemia', 'Mild headache'], productCategory: 'small-molecule' },
  { name: 'Actrivex', therapeuticArea: 'Oncology', atcCode: 'L01E', atcClassName: 'Protein kinase inhibitors', referenceSafetyInfo: ['Fatigue', 'Diarrhea', 'Rash', 'Elevated liver enzymes', 'Hypertension'], productCategory: 'small-molecule' },
  { name: 'Nurodyl', therapeuticArea: 'Psychiatric', atcCode: 'N06A', atcClassName: 'Antidepressants', referenceSafetyInfo: ['Nausea', 'Insomnia', 'Sexual dysfunction', 'Weight changes'], productCategory: 'small-molecule' },
  { name: 'Cardinex', therapeuticArea: 'Cardiovascular', atcCode: 'C01B', atcClassName: 'Antiarrhythmics, class I and III', referenceSafetyInfo: ['Bradycardia', 'QT prolongation', 'Dizziness', 'GI upset'], productCategory: 'small-molecule' },
  { name: 'Pulmatide', therapeuticArea: 'Respiratory', atcCode: 'R03A', atcClassName: 'Adrenergics, inhalants', referenceSafetyInfo: ['Oral candidiasis', 'Hoarseness', 'Tremor', 'Palpitations'], productCategory: 'small-molecule' },
  { name: 'Hepacurin', therapeuticArea: 'Infectious Disease', atcCode: 'J05A', atcClassName: 'Direct-acting antivirals', referenceSafetyInfo: ['Fatigue', 'Headache', 'Nausea', 'Anemia'], productCategory: 'small-molecule' },
  { name: 'Osteovar', therapeuticArea: 'Musculoskeletal', atcCode: 'M05B', atcClassName: 'Bisphosphonates', referenceSafetyInfo: ['GI upset', 'Musculoskeletal pain', 'Osteonecrosis of the jaw', 'Atypical fractures'], productCategory: 'small-molecule' },
  { name: 'Dermalix', therapeuticArea: 'Dermatology', atcCode: 'L04A', atcClassName: 'Immunosuppressants (biologic)', referenceSafetyInfo: ['Injection site reaction', 'Upper respiratory infection', 'Headache'], productCategory: 'biologic' },
  { name: 'Glucotane', therapeuticArea: 'Endocrine', atcCode: 'A10B', atcClassName: 'Blood glucose lowering drugs', referenceSafetyInfo: ['Urinary tract infection', 'Genital fungal infection', 'Increased urination', 'Dehydration'], productCategory: 'small-molecule' },
  { name: 'Vitalyse', therapeuticArea: 'Hematology', atcCode: 'B01A', atcClassName: 'Antithrombotic agents', referenceSafetyInfo: ['Bleeding/bruising', 'GI upset', 'Anemia'], productCategory: 'small-molecule' },
  { name: 'Cerebrolex', therapeuticArea: 'Neurology', atcCode: 'N03A', atcClassName: 'Antiepileptics', referenceSafetyInfo: ['Drowsiness', 'Dizziness', 'Ataxia', 'Rash'], productCategory: 'small-molecule' },
  { name: 'Thyrofix', therapeuticArea: 'Endocrine', atcCode: 'H03A', atcClassName: 'Thyroid preparations', referenceSafetyInfo: ['Palpitations', 'Weight loss', 'Tremor', 'Insomnia'], productCategory: 'small-molecule' },
  { name: 'Immunorex', therapeuticArea: 'Rheumatology', atcCode: 'L04A', atcClassName: 'Immunosuppressants (biologic)', referenceSafetyInfo: ['Injection site reaction', 'Upper respiratory infection', 'Headache', 'Nausea'], productCategory: 'biologic' },
  { name: 'Analgeva', therapeuticArea: 'Pain Management', atcCode: 'M01A', atcClassName: 'Nonsteroidal anti-inflammatory drugs', referenceSafetyInfo: ['GI upset', 'Dizziness', 'Headache', 'Peripheral edema'], productCategory: 'small-molecule' },
  { name: 'Vasodilan', therapeuticArea: 'Cardiovascular', atcCode: 'C08C', atcClassName: 'Selective calcium channel blockers', referenceSafetyInfo: ['Peripheral edema', 'Flushing', 'Headache', 'Dizziness'], productCategory: 'small-molecule' },
  { name: 'Lipidorex', therapeuticArea: 'Cardiovascular', atcCode: 'C10A', atcClassName: 'Lipid modifying agents (statins)', referenceSafetyInfo: ['Myalgia', 'Elevated liver enzymes', 'GI upset', 'Headache'], productCategory: 'small-molecule' },
  { name: 'Bronchazol', therapeuticArea: 'Respiratory', atcCode: 'R03A', atcClassName: 'Adrenergics, inhalants', referenceSafetyInfo: ['Tremor', 'Tachycardia', 'Headache', 'Nervousness'], productCategory: 'small-molecule' },
  { name: 'Sedaquel', therapeuticArea: 'Psychiatric', atcCode: 'N05A', atcClassName: 'Antipsychotics', referenceSafetyInfo: ['Sedation', 'Weight gain', 'Extrapyramidal symptoms', 'Dry mouth'], productCategory: 'small-molecule' },
  { name: 'Vaxiprot', therapeuticArea: 'Immunology', atcCode: 'J07A', atcClassName: 'Bacterial and viral vaccines', referenceSafetyInfo: ['Injection site pain', 'Fever', 'Fatigue', 'Headache'], productCategory: 'vaccine' },
  { name: 'Dermacure', therapeuticArea: 'Dermatology', atcCode: 'D07A', atcClassName: 'Corticosteroids, topical', referenceSafetyInfo: ['Skin thinning', 'Local irritation', 'Itching'], productCategory: 'small-molecule' },
]

export type SeverityTier = 'mild' | 'moderate' | 'can-be-severe'

export interface GenEvent {
  name: string
  soc: string // real MedDRA System Organ Class name
  tier: SeverityTier
}

// System Organ Class names below are the real, standard MedDRA top-level
// categories; the specific event terms are common, real medical terms
// commonly seen in adverse event reporting (not tied to any real case).
export const GEN_EVENTS: GenEvent[] = [
  // Skin and subcutaneous tissue disorders
  { name: 'urticaria', soc: 'Skin and subcutaneous tissue disorders', tier: 'mild' },
  { name: 'pruritus', soc: 'Skin and subcutaneous tissue disorders', tier: 'mild' },
  { name: 'photosensitivity reaction', soc: 'Skin and subcutaneous tissue disorders', tier: 'mild' },
  { name: 'alopecia', soc: 'Skin and subcutaneous tissue disorders', tier: 'mild' },
  { name: 'Stevens-Johnson syndrome', soc: 'Skin and subcutaneous tissue disorders', tier: 'can-be-severe' },
  { name: 'toxic epidermal necrolysis', soc: 'Skin and subcutaneous tissue disorders', tier: 'can-be-severe' },
  { name: 'erythema multiforme', soc: 'Skin and subcutaneous tissue disorders', tier: 'moderate' },
  { name: 'exfoliative dermatitis', soc: 'Skin and subcutaneous tissue disorders', tier: 'can-be-severe' },
  // Gastrointestinal disorders
  { name: 'nausea', soc: 'Gastrointestinal disorders', tier: 'mild' },
  { name: 'vomiting', soc: 'Gastrointestinal disorders', tier: 'mild' },
  { name: 'abdominal pain', soc: 'Gastrointestinal disorders', tier: 'mild' },
  { name: 'dyspepsia', soc: 'Gastrointestinal disorders', tier: 'mild' },
  { name: 'acute pancreatitis', soc: 'Gastrointestinal disorders', tier: 'can-be-severe' },
  { name: 'gastrointestinal hemorrhage', soc: 'Gastrointestinal disorders', tier: 'can-be-severe' },
  { name: 'peptic ulcer perforation', soc: 'Gastrointestinal disorders', tier: 'can-be-severe' },
  { name: 'dysphagia', soc: 'Gastrointestinal disorders', tier: 'moderate' },
  // Hepatobiliary disorders
  { name: 'elevated liver enzymes', soc: 'Hepatobiliary disorders', tier: 'moderate' },
  { name: 'jaundice', soc: 'Hepatobiliary disorders', tier: 'moderate' },
  { name: 'acute liver failure', soc: 'Hepatobiliary disorders', tier: 'can-be-severe' },
  { name: 'cholestasis', soc: 'Hepatobiliary disorders', tier: 'moderate' },
  // Cardiac disorders
  { name: 'palpitations', soc: 'Cardiac disorders', tier: 'mild' },
  { name: 'bradycardia', soc: 'Cardiac disorders', tier: 'moderate' },
  { name: 'tachycardia', soc: 'Cardiac disorders', tier: 'mild' },
  { name: 'atrial fibrillation', soc: 'Cardiac disorders', tier: 'moderate' },
  { name: 'myocardial infarction', soc: 'Cardiac disorders', tier: 'can-be-severe' },
  { name: 'cardiac arrest', soc: 'Cardiac disorders', tier: 'can-be-severe' },
  { name: 'torsades de pointes', soc: 'Cardiac disorders', tier: 'can-be-severe' },
  { name: 'heart failure', soc: 'Cardiac disorders', tier: 'can-be-severe' },
  // Nervous system disorders
  { name: 'headache', soc: 'Nervous system disorders', tier: 'mild' },
  { name: 'dizziness', soc: 'Nervous system disorders', tier: 'mild' },
  { name: 'tremor', soc: 'Nervous system disorders', tier: 'mild' },
  { name: 'peripheral neuropathy', soc: 'Nervous system disorders', tier: 'moderate' },
  { name: 'seizure', soc: 'Nervous system disorders', tier: 'can-be-severe' },
  { name: 'syncope', soc: 'Nervous system disorders', tier: 'moderate' },
  { name: 'ischemic stroke', soc: 'Nervous system disorders', tier: 'can-be-severe' },
  { name: 'encephalopathy', soc: 'Nervous system disorders', tier: 'can-be-severe' },
  // Psychiatric disorders
  { name: 'insomnia', soc: 'Psychiatric disorders', tier: 'mild' },
  { name: 'anxiety', soc: 'Psychiatric disorders', tier: 'mild' },
  { name: 'agitation', soc: 'Psychiatric disorders', tier: 'moderate' },
  { name: 'hallucinations', soc: 'Psychiatric disorders', tier: 'moderate' },
  { name: 'suicidal ideation', soc: 'Psychiatric disorders', tier: 'can-be-severe' },
  { name: 'confusional state', soc: 'Psychiatric disorders', tier: 'moderate' },
  // Respiratory, thoracic and mediastinal disorders
  { name: 'cough', soc: 'Respiratory, thoracic and mediastinal disorders', tier: 'mild' },
  { name: 'dyspnea', soc: 'Respiratory, thoracic and mediastinal disorders', tier: 'moderate' },
  { name: 'bronchospasm', soc: 'Respiratory, thoracic and mediastinal disorders', tier: 'moderate' },
  { name: 'interstitial lung disease', soc: 'Respiratory, thoracic and mediastinal disorders', tier: 'can-be-severe' },
  { name: 'pulmonary embolism', soc: 'Respiratory, thoracic and mediastinal disorders', tier: 'can-be-severe' },
  { name: 'respiratory failure', soc: 'Respiratory, thoracic and mediastinal disorders', tier: 'can-be-severe' },
  // Renal and urinary disorders
  { name: 'urinary tract infection', soc: 'Renal and urinary disorders', tier: 'mild' },
  { name: 'hematuria', soc: 'Renal and urinary disorders', tier: 'moderate' },
  { name: 'acute kidney injury', soc: 'Renal and urinary disorders', tier: 'can-be-severe' },
  { name: 'nephrolithiasis', soc: 'Renal and urinary disorders', tier: 'moderate' },
  // Blood and lymphatic system disorders
  { name: 'anemia', soc: 'Blood and lymphatic system disorders', tier: 'moderate' },
  { name: 'thrombocytopenia', soc: 'Blood and lymphatic system disorders', tier: 'moderate' },
  { name: 'neutropenia', soc: 'Blood and lymphatic system disorders', tier: 'moderate' },
  { name: 'agranulocytosis', soc: 'Blood and lymphatic system disorders', tier: 'can-be-severe' },
  { name: 'hemolytic anemia', soc: 'Blood and lymphatic system disorders', tier: 'can-be-severe' },
  // Musculoskeletal and connective tissue disorders
  { name: 'myalgia', soc: 'Musculoskeletal and connective tissue disorders', tier: 'mild' },
  { name: 'arthralgia', soc: 'Musculoskeletal and connective tissue disorders', tier: 'mild' },
  { name: 'rhabdomyolysis', soc: 'Musculoskeletal and connective tissue disorders', tier: 'can-be-severe' },
  { name: 'tendon rupture', soc: 'Musculoskeletal and connective tissue disorders', tier: 'moderate' },
  { name: 'osteonecrosis of the jaw', soc: 'Musculoskeletal and connective tissue disorders', tier: 'moderate' },
  // Eye disorders
  { name: 'blurred vision', soc: 'Eye disorders', tier: 'mild' },
  { name: 'uveitis', soc: 'Eye disorders', tier: 'moderate' },
  { name: 'acute angle-closure glaucoma', soc: 'Eye disorders', tier: 'can-be-severe' },
  { name: 'retinal detachment', soc: 'Eye disorders', tier: 'can-be-severe' },
  // Endocrine disorders
  { name: 'hypoglycemia', soc: 'Endocrine disorders', tier: 'moderate' },
  { name: 'hyperglycemia', soc: 'Endocrine disorders', tier: 'moderate' },
  { name: 'diabetic ketoacidosis', soc: 'Endocrine disorders', tier: 'can-be-severe' },
  { name: 'adrenal insufficiency', soc: 'Endocrine disorders', tier: 'can-be-severe' },
  // Immune system disorders
  { name: 'anaphylaxis', soc: 'Immune system disorders', tier: 'can-be-severe' },
  { name: 'angioedema', soc: 'Immune system disorders', tier: 'moderate' },
  { name: 'serum sickness', soc: 'Immune system disorders', tier: 'moderate' },
  // Infections and infestations
  { name: 'oral candidiasis', soc: 'Infections and infestations', tier: 'mild' },
  { name: 'cellulitis', soc: 'Infections and infestations', tier: 'moderate' },
  { name: 'pneumonia', soc: 'Infections and infestations', tier: 'can-be-severe' },
  { name: 'sepsis', soc: 'Infections and infestations', tier: 'can-be-severe' },
  // General disorders and administration site conditions
  { name: 'fatigue', soc: 'General disorders and administration site conditions', tier: 'mild' },
  { name: 'fever', soc: 'General disorders and administration site conditions', tier: 'mild' },
  { name: 'injection site reaction', soc: 'General disorders and administration site conditions', tier: 'mild' },
  { name: 'peripheral edema', soc: 'General disorders and administration site conditions', tier: 'mild' },
  { name: 'chills', soc: 'General disorders and administration site conditions', tier: 'mild' },
]

export const ALTERNATIVE_CAUSE_TEMPLATES = [
  (event: string) => `Investigation identifies a clear alternative cause: a pre-existing, well-documented condition known to independently produce ${event}, with no acute change coinciding with starting the suspect drug.`,
  (event: string) => `The patient had recently started another new medication known to cause ${event}, and the treating physician attributes the event to that interacting drug rather than the suspect drug.`,
  (event: string) => `A clear mechanical or traumatic cause fully explains the event, with no plausible pharmacological link to the suspect drug.`,
  (event: string) => `An infectious cause was identified on workup (positive culture/imaging) that independently explains the ${event}, with a documented alternative exposure.`,
  (event: string) => `The patient has a long-standing history of recurrent, similar episodes of ${event} predating the suspect drug entirely, unconnected to its timing.`,
]

export const RELATED_TEMPLATES = [
  (event: string) => `Symptoms improved after the suspect drug was discontinued (positive dechallenge), with no other new medications and no alternative cause identified.`,
  (event: string) => `The timeline is classic for a drug-induced reaction of this type, occurring shortly after exposure with no alternative explanation identified after a thorough workup.`,
  (event: string) => `${event.charAt(0).toUpperCase() + event.slice(1)} is a recognized, mechanistically plausible effect for this class of drug, and no other cause was identified.`,
]

const FIRST_NAMES_UNUSED = null // placeholder to keep this file focused on data, not prose generation helpers

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export interface GeneratedCaseResult extends PVCase {
  isGenerated: true
}

let genCounter = 0

export function generateCase(): GeneratedCaseResult {
  genCounter++
  const drug = pickRandom(GEN_DRUGS)
  const age = 18 + Math.floor(Math.random() * 68)
  const sex = Math.random() < 0.5 ? 'man' : 'woman'
  const durationOptions = ['3 days', '10 days', '2 weeks', '3 weeks', '6 weeks', '2 months', '6 months', '1 year']
  const duration = pickRandom(durationOptions)

  const wantExpected = Math.random() < 0.4
  let eventName: string
  let expectedness: Expectedness
  if (wantExpected) {
    eventName = pickRandom(drug.referenceSafetyInfo).toLowerCase()
    expectedness = 'Expected'
  } else {
    const candidates = GEN_EVENTS.filter((e) => !drug.referenceSafetyInfo.some((r) => r.toLowerCase() === e.name.toLowerCase()))
    const ev = pickRandom(candidates)
    eventName = ev.name
    expectedness = 'Unexpected'
  }
  const eventMeta = GEN_EVENTS.find((e) => e.name.toLowerCase() === eventName.toLowerCase())
  const tier: SeverityTier = eventMeta?.tier ?? 'mild'

  // Seriousness: mild-tier events stay non-serious; others can go either way.
  let seriousness: Seriousness
  if (tier === 'mild') {
    seriousness = 'Non-serious'
  } else {
    seriousness = Math.random() < 0.65 ? 'Serious' : 'Non-serious'
  }

  const wantRelated = Math.random() < 0.75
  const causality: Causality = wantRelated ? 'Related' : 'Unrelated'
  const causalitySentence = wantRelated ? pickRandom(RELATED_TEMPLATES)(eventName) : pickRandom(ALTERNATIVE_CAUSE_TEMPLATES)(eventName)

  const isFatalOrLifeThreatening = seriousness === 'Serious' && tier === 'can-be-severe' && Math.random() < 0.3

  let outcomePhrase: string
  if (seriousness === 'Non-serious') {
    outcomePhrase = pickRandom([
      'This required no treatment and no medical visit.',
      'This was managed at home with over-the-counter measures and did not require a medical visit.',
      'The event resolved without intervention while the patient continued the medication.',
    ])
  } else if (isFatalOrLifeThreatening) {
    outcomePhrase = pickRandom([
      'Despite aggressive treatment, the patient died.',
      'The patient required emergency intervention and intensive care for a life-threatening presentation.',
    ])
  } else {
    outcomePhrase = pickRandom([
      'This required hospital admission for observation and treatment.',
      'This required an emergency department visit and hospital admission.',
      'This was significant enough to require hospitalization and specialist follow-up.',
    ])
  }

  const narrative = `A ${age}-year-old ${sex} has been taking ${drug.name} for ${duration} for a condition in the ${drug.therapeuticArea.toLowerCase()} area. They develop ${eventName}. ${outcomePhrase} ${causalitySentence}`

  const seriousnessReason = seriousness === 'Serious'
    ? (isFatalOrLifeThreatening ? 'Fatal or life-threatening outcome described.' : 'Required hospitalization/significant medical intervention.')
    : 'Managed without hospitalization, disability, or another seriousness criterion being met.'
  const expectednessReason = expectedness === 'Expected'
    ? `${eventName.charAt(0).toUpperCase() + eventName.slice(1)} is listed in ${drug.name}'s reference safety information.`
    : `${eventName.charAt(0).toUpperCase() + eventName.slice(1)} is not listed in ${drug.name}'s reference safety information.`
  const causalityReason = causalitySentence

  const country = ['FDA', 'HC', 'EMA', 'MHRA', 'SWISSMEDIC', 'TGA', 'PMDA', 'NMPA', 'CDSCO', 'HSA', 'MFDS', 'BPOM', 'ANVISA', 'COFEPRIS', 'ANMAT', 'SFDA', 'UAE_MOHAP', 'SAHPRA', 'NAFDAC', 'AMA', 'WHO_PQ']
  const difficulty: Difficulty = Math.random() < 0.5 ? 'Straightforward' : 'Subtle'

  return {
    id: `gen-${Date.now()}-${genCounter}`,
    drugName: drug.name,
    therapeuticArea: drug.therapeuticArea,
    country: pickRandom(country),
    productCategory: drug.productCategory,
    difficulty,
    narrative,
    referenceSafetyInfo: drug.referenceSafetyInfo,
    correctSeriousness: seriousness,
    seriousnessReason,
    correctExpectedness: expectedness,
    expectednessReason,
    correctCausality: causality,
    causalityReason,
    isFatalOrLifeThreatening,
    isGenerated: true,
  }
}
