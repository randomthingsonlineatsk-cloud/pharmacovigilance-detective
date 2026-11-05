// ---------------------------------------------------------------------------
// Fictional adverse-event case bank for Pharmacovigilance Detective.
// All drug names, patients, and cases are entirely invented for teaching
// purposes — none of this represents real regulatory data or real products.
//
// Reporting-timeline logic follows standard international pharmacovigilance
// convention (ICH E2A-style): expedited reporting (7-day for fatal/
// life-threatening, 15-day otherwise) applies only when a case is
// SERIOUS, UNEXPECTED, and assessed as RELATED (a reasonable possibility of
// a causal relationship). Anything missing one of those three criteria goes
// to routine/periodic reporting instead — including serious, related
// reactions that are already expected, and serious, unexpected events later
// attributed to another cause. A case meeting all three of those criteria is,
// by definition, a SUSAR (Suspected Unexpected Serious Adverse Reaction) —
// the term most often used in a clinical-trial safety context, while
// "7-day/15-day expedited" is the post-marketing spontaneous-reporting
// framing of the same underlying logic. Both are derived programmatically
// below rather than hardcoded per case, so they're always consistent.
// ---------------------------------------------------------------------------

export type Seriousness = 'Serious' | 'Non-serious'
export type Expectedness = 'Expected' | 'Unexpected'
export type Causality = 'Related' | 'Unrelated'
export type ReportingTimeline = '7-day' | '15-day' | 'Routine'
export type Difficulty = 'Straightforward' | 'Subtle'

export interface PVCase {
  id: string
  drugName: string
  therapeuticArea: string
  country: string // regulator key, see pv-reference.ts REGULATORS
  productCategory: string // category key, see pv-reference.ts PRODUCT_CATEGORIES
  difficulty: Difficulty
  narrative: string
  referenceSafetyInfo: string[]
  correctSeriousness: Seriousness
  seriousnessReason: string
  correctExpectedness: Expectedness
  expectednessReason: string
  correctCausality: Causality
  causalityReason: string
  isFatalOrLifeThreatening: boolean
}

export function deriveReportingTimeline(c: PVCase): { timeline: ReportingTimeline; reason: string } {
  if (c.correctSeriousness === 'Non-serious') {
    return { timeline: 'Routine', reason: 'Not serious, so only routine/periodic reporting applies — expedited reporting is reserved for serious cases regardless of expectedness or causality.' }
  }
  if (c.correctExpectedness === 'Expected') {
    return { timeline: 'Routine', reason: 'Serious, but a known/expected reaction — expedited reporting exists specifically to flag new safety information, so an already-labeled reaction (even a severe or fatal one) goes into periodic reporting instead.' }
  }
  if (c.correctCausality === 'Unrelated') {
    return { timeline: 'Routine', reason: 'Serious and unexpected, but assessed as unrelated to the suspect drug — expedited reporting requires a reasonable possibility of a causal relationship, which isn\u2019t met here.' }
  }
  if (c.isFatalOrLifeThreatening) {
    return { timeline: '7-day', reason: 'Serious (fatal/life-threatening), unexpected, and related — this combination meets the criteria for the most urgent expedited timeline.' }
  }
  return { timeline: '15-day', reason: 'Serious, unexpected, and related, but not fatal or immediately life-threatening — the standard expedited reporting timeline applies.' }
}

export function deriveSUSAR(c: PVCase): { isSUSAR: boolean; reason: string } {
  const isSUSAR = c.correctSeriousness === 'Serious' && c.correctExpectedness === 'Unexpected' && c.correctCausality === 'Related'
  const reason = isSUSAR
    ? 'Serious + Unexpected + (at least reasonably) Related — this is exactly the definition of a SUSAR: a Suspected Unexpected Serious Adverse Reaction.'
    : 'Missing at least one of the three SUSAR criteria (serious, unexpected, and related), so this is not a SUSAR — the same three-part test that determines expedited reporting.'
  return { isSUSAR, reason }
}

export const PV_CASES: PVCase[] = [
  {
    id: 'c01', drugName: 'Zolvamex', therapeuticArea: 'Cardiovascular', country: 'FDA', productCategory: 'small-molecule', difficulty: 'Straightforward',
    narrative: 'A 58-year-old man started Zolvamex 10 days ago for hypertension. He develops sudden facial and tongue swelling and is taken to the emergency department, where he is kept overnight for observation. Symptoms resolve after antihistamine and steroid treatment and discontinuation of the drug. He is taking no other new medications and has no prior history of allergic reactions.',
    referenceSafetyInfo: ['Dry cough', 'Dizziness', 'Hyperkalemia', 'Mild headache'],
    correctSeriousness: 'Serious', seriousnessReason: 'Required overnight hospitalization.',
    correctExpectedness: 'Unexpected', expectednessReason: 'Facial/tongue swelling (angioedema) is not listed in the reference safety information for this drug.',
    correctCausality: 'Related', causalityReason: 'Clear temporal relationship (10 days after starting), positive dechallenge (resolved after stopping the drug), and no alternative explanation.',
    isFatalOrLifeThreatening: false,
  },
  {
    id: 'c02', drugName: 'Actrivex', therapeuticArea: 'Oncology', country: 'EMA', productCategory: 'small-molecule', difficulty: 'Straightforward',
    narrative: 'A 64-year-old woman on Actrivex for 3 weeks for metastatic lung cancer reports mild diarrhea (3-4 loose stools per day), managed at home with over-the-counter loperamide. She did not require a medical visit or hospitalization.',
    referenceSafetyInfo: ['Fatigue', 'Diarrhea', 'Rash', 'Elevated liver enzymes', 'Hypertension'],
    correctSeriousness: 'Non-serious', seriousnessReason: 'Managed at home; no hospitalization, disability, or other seriousness criterion met.',
    correctExpectedness: 'Expected', expectednessReason: 'Diarrhea is explicitly listed in the reference safety information.',
    correctCausality: 'Related', causalityReason: 'Known reaction with a plausible temporal relationship.',
    isFatalOrLifeThreatening: false,
  },
  {
    id: 'c03', drugName: 'Nurodyl', therapeuticArea: 'Psychiatric', country: 'MHRA', productCategory: 'small-molecule', difficulty: 'Subtle',
    narrative: 'A 34-year-old man on Nurodyl for 6 months for depression, previously stable, presents with a new-onset seizure requiring hospitalization. He admits to a recent alcohol binge and abrupt discontinuation of long-term alprazolam that he had not disclosed to his psychiatrist, 2 days before the seizure. EEG and workup are consistent with an alcohol/benzodiazepine withdrawal seizure. There has been no change in his Nurodyl dose.',
    referenceSafetyInfo: ['Nausea', 'Insomnia', 'Sexual dysfunction', 'Weight changes'],
    correctSeriousness: 'Serious', seriousnessReason: 'Required hospitalization.',
    correctExpectedness: 'Unexpected', expectednessReason: 'Seizure is not listed in the reference safety information.',
    correctCausality: 'Unrelated', causalityReason: 'A clear, much more plausible alternative explanation (alcohol and benzodiazepine withdrawal) fully accounts for the event, with no change in the suspect drug.',
    isFatalOrLifeThreatening: false,
  },
  {
    id: 'c04', drugName: 'Cardinex', therapeuticArea: 'Cardiovascular', country: 'HC', productCategory: 'small-molecule', difficulty: 'Subtle',
    narrative: 'A 71-year-old woman started Cardinex 4 days ago for atrial fibrillation. Within an hour of a dose she develops sudden hives, throat swelling, and hypotension, requiring emergency epinephrine and ICU admission. Despite treatment she suffers cardiac arrest and dies. She has no prior known drug allergies and has started no other new substances.',
    referenceSafetyInfo: ['Bradycardia', 'QT prolongation', 'Dizziness', 'GI upset'],
    correctSeriousness: 'Serious', seriousnessReason: 'Fatal outcome.',
    correctExpectedness: 'Unexpected', expectednessReason: 'Anaphylaxis is not listed in the reference safety information.',
    correctCausality: 'Related', causalityReason: 'Classic hypersensitivity timeline (within an hour of dosing) with no alternative cause identified.',
    isFatalOrLifeThreatening: true,
  },
  {
    id: 'c05', drugName: 'Pulmatide', therapeuticArea: 'Respiratory', country: 'TGA', productCategory: 'small-molecule', difficulty: 'Straightforward',
    narrative: 'A 45-year-old man using Pulmatide inhaler for 2 months for asthma reports a new mild metallic taste in his mouth. It required no treatment or medical visit and resolved spontaneously while he continued the medication.',
    referenceSafetyInfo: ['Oral candidiasis', 'Hoarseness', 'Tremor', 'Palpitations'],
    correctSeriousness: 'Non-serious', seriousnessReason: 'No hospitalization, disability, or other seriousness criterion met.',
    correctExpectedness: 'Unexpected', expectednessReason: 'Metallic taste is not listed in the reference safety information.',
    correctCausality: 'Related', causalityReason: 'Plausible local effect of an inhaled medication with clear temporal association.',
    isFatalOrLifeThreatening: false,
  },
  {
    id: 'c06', drugName: 'Hepacurin', therapeuticArea: 'Infectious Disease', country: 'CDSCO', productCategory: 'small-molecule', difficulty: 'Subtle',
    narrative: 'A 52-year-old man on Hepacurin for chronic hepatitis C, 8 weeks into treatment, develops progressively worsening anemia (hemoglobin drop from 13 to 7.5 g/dL) requiring a blood transfusion and one night of hospital observation. Anemia is a known class effect of this antiviral. His dose was reduced per protocol and his hemoglobin began recovering.',
    referenceSafetyInfo: ['Fatigue', 'Headache', 'Nausea', 'Anemia'],
    correctSeriousness: 'Serious', seriousnessReason: 'Required hospitalization and blood transfusion (a medically important intervention).',
    correctExpectedness: 'Expected', expectednessReason: 'Anemia is explicitly listed in the reference safety information.',
    correctCausality: 'Related', causalityReason: 'Positive dechallenge with dose reduction and a well-established mechanism.',
    isFatalOrLifeThreatening: false,
  },
  {
    id: 'c07', drugName: 'Osteovar', therapeuticArea: 'Musculoskeletal', country: 'SWISSMEDIC', productCategory: 'small-molecule', difficulty: 'Subtle',
    narrative: 'A 68-year-old woman on Osteovar for 6 weeks for osteoporosis develops a sudden painful red eye diagnosed as severe uveitis, requiring hospitalization for IV corticosteroid treatment. She has no prior eye disease and is taking no other new medications. Symptoms improved after Osteovar was discontinued and steroids were started.',
    referenceSafetyInfo: ['GI upset', 'Musculoskeletal pain', 'Osteonecrosis of the jaw (rare)', 'Atypical fractures (rare)'],
    correctSeriousness: 'Serious', seriousnessReason: 'Required hospitalization.',
    correctExpectedness: 'Unexpected', expectednessReason: 'Uveitis is not listed in the reference safety information.',
    correctCausality: 'Related', causalityReason: 'Reasonable temporal relationship and no other identified cause, though the concurrent steroid treatment makes dechallenge somewhat harder to interpret in isolation.',
    isFatalOrLifeThreatening: false,
  },
  {
    id: 'c08', drugName: 'Dermalix', therapeuticArea: 'Dermatology', country: 'PMDA', productCategory: 'biologic', difficulty: 'Straightforward',
    narrative: 'A 29-year-old woman on Dermalix for psoriasis reports mild redness and itching at the injection site lasting 2 days after her most recent dose, resolving without treatment.',
    referenceSafetyInfo: ['Injection site reactions', 'Upper respiratory infections', 'Headache'],
    correctSeriousness: 'Non-serious', seriousnessReason: 'Resolved without treatment; no seriousness criteria met.',
    correctExpectedness: 'Expected', expectednessReason: 'Injection site reactions are explicitly listed.',
    correctCausality: 'Related', causalityReason: 'Classic local reaction with clear temporal relationship to dosing.',
    isFatalOrLifeThreatening: false,
  },
  {
    id: 'c09', drugName: 'Glucotane', therapeuticArea: 'Endocrine', country: 'NMPA', productCategory: 'small-molecule', difficulty: 'Subtle',
    narrative: 'A 55-year-old man with type 2 diabetes started Glucotane 3 weeks ago and presents to the emergency department with nausea, vomiting, and abdominal pain. Labs show diabetic ketoacidosis with only mildly elevated blood glucose, requiring a 2-day hospital admission for IV insulin and fluids. He has not missed insulin doses, no infection is identified, and he has started no other new medications.',
    referenceSafetyInfo: ['Urinary tract infections', 'Genital fungal infections', 'Increased urination', 'Dehydration'],
    correctSeriousness: 'Serious', seriousnessReason: 'Required hospitalization.',
    correctExpectedness: 'Unexpected', expectednessReason: 'Diabetic ketoacidosis is not listed in the reference safety information for this fictional drug.',
    correctCausality: 'Related', causalityReason: 'Clear temporal relationship, no alternative precipitant identified, and a plausible mechanism for this drug class.',
    isFatalOrLifeThreatening: false,
  },
  {
    id: 'c10', drugName: 'Vitalyse', therapeuticArea: 'Hematology', country: 'HSA', productCategory: 'small-molecule', difficulty: 'Subtle',
    narrative: 'A 76-year-old man on Vitalyse for atrial fibrillation develops major gastrointestinal bleeding requiring hospitalization and blood transfusion. Colonoscopy identifies a bleeding source consistent with anticoagulation effect, with no other cause found. Despite treatment, he develops hemorrhagic shock and dies. Bleeding is the primary known risk of this class of anticoagulant and is clearly listed in the reference safety information.',
    referenceSafetyInfo: ['Bleeding/bruising', 'GI upset', 'Anemia'],
    correctSeriousness: 'Serious', seriousnessReason: 'Fatal outcome.',
    correctExpectedness: 'Expected', expectednessReason: 'Bleeding is explicitly listed in the reference safety information — this is a severe manifestation of a known, labeled risk, not a new type of reaction.',
    correctCausality: 'Related', causalityReason: 'Well-established mechanism, clear temporal relationship, no other bleeding source found.',
    isFatalOrLifeThreatening: true,
  },
  {
    id: 'c11', drugName: 'Zolvamex', therapeuticArea: 'Cardiovascular', country: 'FDA', productCategory: 'small-molecule', difficulty: 'Straightforward',
    narrative: 'A 50-year-old man on Zolvamex for 2 months sprains his ankle while playing basketball, requiring only rest and ice at home, with no medical visit.',
    referenceSafetyInfo: ['Dry cough', 'Dizziness', 'Hyperkalemia', 'Mild headache'],
    correctSeriousness: 'Non-serious', seriousnessReason: 'No seriousness criteria met.',
    correctExpectedness: 'Unexpected', expectednessReason: 'An ankle sprain is not a listed reaction (and is not a pharmacological effect of this drug at all).',
    correctCausality: 'Unrelated', causalityReason: 'Clear mechanical/traumatic alternative cause with no plausible pharmacological link.',
    isFatalOrLifeThreatening: false,
  },
  {
    id: 'c12', drugName: 'Actrivex', therapeuticArea: 'Oncology', country: 'EMA', productCategory: 'small-molecule', difficulty: 'Subtle',
    narrative: 'A 61-year-old woman on Actrivex for 5 weeks develops a widespread, painful blistering rash with mucosal involvement, diagnosed as Stevens-Johnson syndrome, and is admitted to a burn/ICU unit. Despite treatment she develops overwhelming sepsis and dies. She has no prior similar reactions and has started no other new medications; the timeline is consistent with drug-induced Stevens-Johnson syndrome.',
    referenceSafetyInfo: ['Fatigue', 'Diarrhea', 'Rash', 'Elevated liver enzymes', 'Hypertension'],
    correctSeriousness: 'Serious', seriousnessReason: 'Fatal outcome.',
    correctExpectedness: 'Unexpected', expectednessReason: 'The reference safety information lists mild rash, not a distinct and far more severe reaction like Stevens-Johnson syndrome.',
    correctCausality: 'Related', causalityReason: 'Classic drug-induced timeline for this type of reaction with no alternative cause.',
    isFatalOrLifeThreatening: true,
  },
  {
    id: 'c13', drugName: 'Nurodyl', therapeuticArea: 'Psychiatric', country: 'MHRA', productCategory: 'small-molecule', difficulty: 'Straightforward',
    narrative: 'A 27-year-old woman started Nurodyl 3 weeks ago and develops acute angle-closure glaucoma with severe eye pain and rapidly progressive vision loss, requiring emergency surgery and hospitalization. She has no prior eye disease and has started no other new medications.',
    referenceSafetyInfo: ['Nausea', 'Insomnia', 'Sexual dysfunction', 'Weight changes'],
    correctSeriousness: 'Serious', seriousnessReason: 'Required hospitalization, with risk of persistent vision loss.',
    correctExpectedness: 'Unexpected', expectednessReason: 'Not listed in the reference safety information.',
    correctCausality: 'Related', causalityReason: 'Plausible temporal relationship with no alternative explanation.',
    isFatalOrLifeThreatening: false,
  },
  {
    id: 'c14', drugName: 'Cardinex', therapeuticArea: 'Cardiovascular', country: 'HC', productCategory: 'small-molecule', difficulty: 'Straightforward',
    narrative: 'A 66-year-old man on Cardinex for 1 month reports mild intermittent dizziness when standing up quickly. It requires no treatment or medical visit.',
    referenceSafetyInfo: ['Bradycardia', 'QT prolongation', 'Dizziness', 'GI upset'],
    correctSeriousness: 'Non-serious', seriousnessReason: 'No seriousness criteria met.',
    correctExpectedness: 'Expected', expectednessReason: 'Dizziness is explicitly listed.',
    correctCausality: 'Related', causalityReason: 'Known reaction, plausible temporal relationship.',
    isFatalOrLifeThreatening: false,
  },
  {
    id: 'c15', drugName: 'Pulmatide', therapeuticArea: 'Respiratory', country: 'TGA', productCategory: 'small-molecule', difficulty: 'Subtle',
    narrative: 'A 39-year-old woman using Pulmatide for 1 year presents with severe pneumonia requiring hospitalization and IV antibiotics. Sputum culture identifies a specific bacterial pathogen, and she had a documented sick contact with pneumonia after recent travel. There has been no change in her inhaler use or dose.',
    referenceSafetyInfo: ['Oral candidiasis', 'Hoarseness', 'Tremor', 'Palpitations'],
    correctSeriousness: 'Serious', seriousnessReason: 'Required hospitalization.',
    correctExpectedness: 'Unexpected', expectednessReason: 'Bacterial pneumonia is not listed in the reference safety information.',
    correctCausality: 'Unrelated', causalityReason: 'An identified bacterial cause plus a clear alternative exposure (sick contact, travel) fully accounts for the event.',
    isFatalOrLifeThreatening: false,
  },
  {
    id: 'c16', drugName: 'Hepacurin', therapeuticArea: 'Infectious Disease', country: 'CDSCO', productCategory: 'small-molecule', difficulty: 'Straightforward',
    narrative: 'A 48-year-old man on Hepacurin for 2 weeks reports a new mild metallic taste and reduced appetite. It requires no treatment, is tolerable, and he continues the medication.',
    referenceSafetyInfo: ['Fatigue', 'Headache', 'Nausea', 'Anemia'],
    correctSeriousness: 'Non-serious', seriousnessReason: 'No seriousness criteria met.',
    correctExpectedness: 'Unexpected', expectednessReason: 'Taste change and appetite loss are not listed in the reference safety information.',
    correctCausality: 'Related', causalityReason: 'Clear temporal relationship, no alternative cause, plausible GI-type effect.',
    isFatalOrLifeThreatening: false,
  },
  {
    id: 'c17', drugName: 'Osteovar', therapeuticArea: 'Musculoskeletal', country: 'SWISSMEDIC', productCategory: 'small-molecule', difficulty: 'Straightforward',
    narrative: 'A 70-year-old woman on Osteovar for 4 years develops osteonecrosis of the jaw after a dental extraction, requiring hospitalization for surgical debridement. This is a known, listed rare reaction of this drug class.',
    referenceSafetyInfo: ['GI upset', 'Musculoskeletal pain', 'Osteonecrosis of the jaw (rare)', 'Atypical fractures (rare)'],
    correctSeriousness: 'Serious', seriousnessReason: 'Required hospitalization.',
    correctExpectedness: 'Expected', expectednessReason: 'Osteonecrosis of the jaw is explicitly listed, even though rare.',
    correctCausality: 'Related', causalityReason: 'Known, listed mechanism with plausible trigger (dental extraction).',
    isFatalOrLifeThreatening: false,
  },
  {
    id: 'c18', drugName: 'Glucotane', therapeuticArea: 'Endocrine', country: 'NMPA', productCategory: 'small-molecule', difficulty: 'Straightforward',
    narrative: 'A 61-year-old woman started Glucotane 1 month ago develops a mild vaginal yeast infection, treated successfully with an over-the-counter antifungal, with no medical visit needed.',
    referenceSafetyInfo: ['Urinary tract infections', 'Genital fungal infections', 'Increased urination', 'Dehydration'],
    correctSeriousness: 'Non-serious', seriousnessReason: 'Treated at home; no seriousness criteria met.',
    correctExpectedness: 'Expected', expectednessReason: 'Genital fungal infections are explicitly listed.',
    correctCausality: 'Related', causalityReason: 'Known class effect with clear temporal relationship.',
    isFatalOrLifeThreatening: false,
  },
  {
    id: 'c19', drugName: 'Vitalyse', therapeuticArea: 'Hematology', country: 'HSA', productCategory: 'small-molecule', difficulty: 'Straightforward',
    narrative: 'A 58-year-old man on Vitalyse notices a small, spontaneous bruise on his forearm. There is no bleeding elsewhere, no intervention is needed, and he continues the medication without a dose change.',
    referenceSafetyInfo: ['Bleeding/bruising', 'GI upset', 'Anemia'],
    correctSeriousness: 'Non-serious', seriousnessReason: 'Minor finding; no seriousness criteria met.',
    correctExpectedness: 'Expected', expectednessReason: 'Bruising is explicitly listed.',
    correctCausality: 'Related', causalityReason: 'Known reaction with plausible temporal relationship.',
    isFatalOrLifeThreatening: false,
  },
  {
    id: 'c20', drugName: 'Zolvamex', therapeuticArea: 'Cardiovascular', country: 'MFDS', productCategory: 'small-molecule', difficulty: 'Subtle',
    narrative: 'A 44-year-old pregnant woman (18 weeks gestation) inadvertently continues Zolvamex after conception. A fetal ultrasound at 20 weeks reveals oligohydramnios and renal abnormalities consistent with a known toxic effect of this drug class on fetal kidney development. The pregnancy is being closely monitored; the mother has not required hospitalization, but this is considered a medically important event given the risk to the fetus.',
    referenceSafetyInfo: ['Dry cough', 'Dizziness', 'Hyperkalemia', 'Mild headache'],
    correctSeriousness: 'Serious', seriousnessReason: 'Meets the "medically important event" seriousness criterion (risk of congenital anomaly), even without maternal hospitalization.',
    correctExpectedness: 'Unexpected', expectednessReason: 'Fetal toxicity is not listed in this drug\u2019s reference safety information.',
    correctCausality: 'Related', causalityReason: 'Known mechanism for this drug class, clear exposure relationship, no alternative explanation.',
    isFatalOrLifeThreatening: false,
  },
  {
    id: 'c21', drugName: 'Dermalix', therapeuticArea: 'Dermatology', country: 'PMDA', productCategory: 'biologic', difficulty: 'Subtle',
    narrative: 'A 33-year-old man on Dermalix for 6 weeks develops rapidly progressive shortness of breath and is diagnosed with severe drug-induced interstitial lung disease. Despite ICU care and mechanical ventilation, he dies of respiratory failure. He has no prior lung disease, no infection is identified on extensive workup, and the clinical course and biopsy findings are consistent with drug-induced pneumonitis.',
    referenceSafetyInfo: ['Injection site reactions', 'Upper respiratory infections', 'Headache'],
    correctSeriousness: 'Serious', seriousnessReason: 'Fatal outcome.',
    correctExpectedness: 'Unexpected', expectednessReason: 'Interstitial lung disease is not listed in the reference safety information.',
    correctCausality: 'Related', causalityReason: 'Thorough workup ruling out alternatives, with supportive biopsy findings and a plausible temporal course.',
    isFatalOrLifeThreatening: true,
  },
  {
    id: 'c22', drugName: 'Glucotane', therapeuticArea: 'Endocrine', country: 'NMPA', productCategory: 'small-molecule', difficulty: 'Subtle',
    narrative: 'A 67-year-old man with long-standing chronic kidney disease started Glucotane 2 weeks ago and presents with worsening kidney function requiring hospitalization. His nephrologist attributes this primarily to progression of his well-documented pre-existing chronic kidney disease, with no acute change in trajectory since starting the new medication and no supporting lab findings implicating the drug.',
    referenceSafetyInfo: ['Urinary tract infections', 'Genital fungal infections', 'Increased urination', 'Dehydration'],
    correctSeriousness: 'Serious', seriousnessReason: 'Required hospitalization.',
    correctExpectedness: 'Unexpected', expectednessReason: 'Acute worsening of kidney function is not listed in the reference safety information.',
    correctCausality: 'Unrelated', causalityReason: 'The treating specialist attributes it to pre-existing disease progression, with no acute change coinciding with the drug and no supporting evidence for a drug effect.',
    isFatalOrLifeThreatening: false,
  },
  {
    id: 'c23', drugName: 'Cardinex', therapeuticArea: 'Cardiovascular', country: 'BPOM', productCategory: 'small-molecule', difficulty: 'Straightforward',
    narrative: 'A 59-year-old woman started Cardinex 5 days ago and develops severe abdominal pain, diagnosed as acute pancreatitis, requiring hospital admission. Imaging shows no gallstones, she does not drink alcohol, lipase is markedly elevated, and her symptoms improve after the drug is stopped.',
    referenceSafetyInfo: ['Bradycardia', 'QT prolongation', 'Dizziness', 'GI upset'],
    correctSeriousness: 'Serious', seriousnessReason: 'Required hospitalization.',
    correctExpectedness: 'Unexpected', expectednessReason: 'Pancreatitis is a distinct, more severe diagnosis than the general "GI upset" listed in the reference safety information.',
    correctCausality: 'Related', causalityReason: 'Positive dechallenge and the two most common alternative causes (gallstones, alcohol) are specifically ruled out.',
    isFatalOrLifeThreatening: false,
  },
  {
    id: 'c24', drugName: 'Hepacurin', therapeuticArea: 'Infectious Disease', country: 'ANVISA', productCategory: 'small-molecule', difficulty: 'Subtle',
    narrative: 'A 41-year-old woman on Hepacurin for 3 months develops a mild tension headache during a particularly stressful work week, relieved with over-the-counter acetaminophen. She notes she has had similar stress headaches in the past, unrelated to any medication.',
    referenceSafetyInfo: ['Fatigue', 'Headache', 'Nausea', 'Anemia'],
    correctSeriousness: 'Non-serious', seriousnessReason: 'Managed at home; no seriousness criteria met.',
    correctExpectedness: 'Expected', expectednessReason: 'Headache is explicitly listed in the reference safety information.',
    correctCausality: 'Unrelated', causalityReason: 'A well-documented pre-existing pattern of similar stress headaches, unconnected to drug timing, provides a clear alternative explanation.',
    isFatalOrLifeThreatening: false,
  },
  {
    id: 'c25', drugName: 'Cerebrolex', therapeuticArea: 'Neurology', country: 'FDA', productCategory: 'small-molecule', difficulty: 'Subtle',
    narrative: 'A 22-year-old woman started Cerebrolex 4 weeks ago for epilepsy. She develops fever, sore throat, and widespread painful blistering of the skin and mucous membranes, diagnosed as toxic epidermal necrolysis, requiring transfer to a burn unit for intensive supportive care. She survives after a prolonged admission. No other new medications, no infection identified as the cause on workup.',
    referenceSafetyInfo: ['Drowsiness', 'Dizziness', 'Ataxia', 'Rash'],
    correctSeriousness: 'Serious', seriousnessReason: 'Required intensive, prolonged hospitalization for a life-threatening condition.',
    correctExpectedness: 'Unexpected', expectednessReason: 'The label lists mild rash, not the specific and far more severe reaction toxic epidermal necrolysis.',
    correctCausality: 'Related', causalityReason: 'Classic drug-induced timeline for this reaction type (antiepileptics are a well-known trigger class), with no alternative cause identified.',
    isFatalOrLifeThreatening: true,
  },
  {
    id: 'c26', drugName: 'Thyrofix', therapeuticArea: 'Endocrine', country: 'EMA', productCategory: 'small-molecule', difficulty: 'Subtle',
    narrative: 'A 60-year-old woman on Thyrofix for 2 months for hypothyroidism develops new-onset atrial fibrillation with a rapid heart rate, requiring hospital admission for rate control. Thyroid function tests show she is now significantly overtreated (suppressed TSH), consistent with a dose that has become too high for her.',
    referenceSafetyInfo: ['Palpitations', 'Weight loss', 'Tremor', 'Insomnia'],
    correctSeriousness: 'Serious', seriousnessReason: 'Required hospitalization.',
    correctExpectedness: 'Unexpected', expectednessReason: 'Palpitations are listed, but new-onset atrial fibrillation is a distinct, more severe cardiac diagnosis not itself listed.',
    correctCausality: 'Related', causalityReason: 'Laboratory-confirmed overtreatment provides a clear, well-established mechanism with no alternative explanation.',
    isFatalOrLifeThreatening: false,
  },
  {
    id: 'c27', drugName: 'Immunorex', therapeuticArea: 'Rheumatology', country: 'MHRA', productCategory: 'biologic', difficulty: 'Subtle',
    narrative: 'A 47-year-old man on Immunorex for 6 months for rheumatoid arthritis develops a persistent cough, night sweats, and weight loss; workup confirms reactivation of latent tuberculosis, requiring hospitalization and antitubercular therapy. He had a positive latent TB screening test before starting treatment but had not yet completed prophylactic treatment.',
    referenceSafetyInfo: ['Injection site reaction', 'Upper respiratory infection', 'Headache', 'Nausea'],
    correctSeriousness: 'Serious', seriousnessReason: 'Required hospitalization for a serious infection.',
    correctExpectedness: 'Unexpected', expectednessReason: 'Tuberculosis reactivation is not listed in this fictional drug\u2019s reference safety information.',
    correctCausality: 'Related', causalityReason: 'Immunosuppressive biologics are a well-established mechanism for reactivating latent TB, and the patient\u2019s known latent infection plus temporal course support a plausible causal link.',
    isFatalOrLifeThreatening: false,
  },
  {
    id: 'c28', drugName: 'Analgeva', therapeuticArea: 'Pain Management', country: 'HC', productCategory: 'small-molecule', difficulty: 'Straightforward',
    narrative: 'A 73-year-old woman on Analgeva for 3 months for osteoarthritis presents with sudden severe abdominal pain and is found to have a perforated peptic ulcer, requiring emergency surgery and hospitalization. She has no history of ulcer disease and takes no other NSAIDs or blood thinners.',
    referenceSafetyInfo: ['GI upset', 'Dizziness', 'Headache', 'Peripheral edema'],
    correctSeriousness: 'Serious', seriousnessReason: 'Required emergency surgery and hospitalization.',
    correctExpectedness: 'Unexpected', expectednessReason: 'General "GI upset" is listed, but ulcer perforation is a distinct and far more severe complication not itself listed.',
    correctCausality: 'Related', causalityReason: 'Well-established mechanism for this drug class, clear temporal relationship, and no other risk factors (no prior ulcer disease, no other NSAIDs/anticoagulants) identified.',
    isFatalOrLifeThreatening: false,
  },
  {
    id: 'c29', drugName: 'Vasodilan', therapeuticArea: 'Cardiovascular', country: 'SWISSMEDIC', productCategory: 'small-molecule', difficulty: 'Straightforward',
    narrative: 'A 65-year-old man on Vasodilan for 2 months for hypertension develops significant swelling in both legs, requiring a short hospital admission for diuretic treatment and monitoring. This is a well-documented, common effect of this drug class.',
    referenceSafetyInfo: ['Peripheral edema', 'Flushing', 'Headache', 'Dizziness'],
    correctSeriousness: 'Serious', seriousnessReason: 'Required hospital admission for treatment.',
    correctExpectedness: 'Expected', expectednessReason: 'Peripheral edema is explicitly listed in the reference safety information.',
    correctCausality: 'Related', causalityReason: 'Well-known class effect with a clear temporal relationship.',
    isFatalOrLifeThreatening: false,
  },
  {
    id: 'c30', drugName: 'Lipidorex', therapeuticArea: 'Cardiovascular', country: 'TGA', productCategory: 'small-molecule', difficulty: 'Subtle',
    narrative: 'A 55-year-old man on Lipidorex for 4 months for high cholesterol develops severe muscle pain and dark urine; labs confirm rhabdomyolysis with a markedly elevated creatine kinase, requiring hospitalization for IV fluids and monitoring of kidney function. Symptoms and lab values improved after the drug was stopped. He was not taking any other interacting medications.',
    referenceSafetyInfo: ['Myalgia', 'Elevated liver enzymes', 'GI upset', 'Headache'],
    correctSeriousness: 'Serious', seriousnessReason: 'Required hospitalization.',
    correctExpectedness: 'Unexpected', expectednessReason: 'Mild myalgia is listed, but rhabdomyolysis is a distinct, far more severe, and specifically named complication not itself listed.',
    correctCausality: 'Related', causalityReason: 'Positive dechallenge, well-established mechanism for this drug class, and no interacting medications identified.',
    isFatalOrLifeThreatening: false,
  },
  {
    id: 'c31', drugName: 'Bronchazol', therapeuticArea: 'Respiratory', country: 'PMDA', productCategory: 'small-molecule', difficulty: 'Subtle',
    narrative: 'A 70-year-old man with known coronary artery disease using Bronchazol for 1 year for COPD develops an episode of rapid irregular heartbeat requiring hospitalization. His cardiologist attributes this to progression of his pre-existing coronary disease, noting a recent abnormal stress test and no change in his inhaler regimen or dose.',
    referenceSafetyInfo: ['Tremor', 'Tachycardia', 'Headache', 'Nervousness'],
    correctSeriousness: 'Serious', seriousnessReason: 'Required hospitalization.',
    correctExpectedness: 'Unexpected', expectednessReason: 'Mild tachycardia is listed, but a distinct arrhythmia requiring hospitalization is a more severe, unlisted presentation.',
    correctCausality: 'Unrelated', causalityReason: 'The treating cardiologist attributes the event to documented progression of pre-existing coronary artery disease, with no change in the suspect drug and objective evidence (abnormal stress test) supporting the alternative cause.',
    isFatalOrLifeThreatening: false,
  },
  {
    id: 'c32', drugName: 'Sedaquel', therapeuticArea: 'Psychiatric', country: 'CDSCO', productCategory: 'small-molecule', difficulty: 'Subtle',
    narrative: 'A 38-year-old man on Sedaquel for 3 weeks for schizophrenia develops high fever, severe muscle rigidity, confusion, and unstable blood pressure, diagnosed as neuroleptic malignant syndrome, requiring ICU admission for life-threatening autonomic instability. Symptoms improved after the drug was stopped and supportive care was given.',
    referenceSafetyInfo: ['Sedation', 'Weight gain', 'Extrapyramidal symptoms', 'Dry mouth'],
    correctSeriousness: 'Serious', seriousnessReason: 'Required ICU admission for a life-threatening presentation.',
    correctExpectedness: 'Unexpected', expectednessReason: 'Extrapyramidal symptoms are listed, but neuroleptic malignant syndrome is a distinct, specifically named, life-threatening syndrome not itself listed.',
    correctCausality: 'Related', causalityReason: 'Positive dechallenge and a well-established mechanism for this drug class, with no alternative cause identified.',
    isFatalOrLifeThreatening: true,
  },
  {
    id: 'c33', drugName: 'Vaxiprot', therapeuticArea: 'Immunology', country: 'FDA', productCategory: 'vaccine', difficulty: 'Straightforward',
    narrative: 'A 24-year-old woman receives a dose of Vaxiprot. Within 15 minutes she develops hives, facial swelling, wheezing, and a drop in blood pressure, requiring emergency epinephrine and observation in the emergency department overnight. She recovers fully. She has no history of prior vaccine reactions.',
    referenceSafetyInfo: ['Injection site pain', 'Fever', 'Fatigue', 'Headache'],
    correctSeriousness: 'Serious', seriousnessReason: 'Required emergency treatment and overnight observation for a life-threatening presentation.',
    correctExpectedness: 'Unexpected', expectednessReason: 'Anaphylaxis is not listed in the reference safety information.',
    correctCausality: 'Related', causalityReason: 'Classic immediate-hypersensitivity timeline (within 15 minutes of vaccination) with no alternative cause.',
    isFatalOrLifeThreatening: true,
  },
  {
    id: 'c34', drugName: 'Vaxiprot', therapeuticArea: 'Immunology', country: 'HC', productCategory: 'vaccine', difficulty: 'Straightforward',
    narrative: 'A 30-year-old man receives a dose of Vaxiprot and develops mild soreness at the injection site and a low-grade fever for one day, resolving without treatment.',
    referenceSafetyInfo: ['Injection site pain', 'Fever', 'Fatigue', 'Headache'],
    correctSeriousness: 'Non-serious', seriousnessReason: 'Resolved without treatment; no seriousness criteria met.',
    correctExpectedness: 'Expected', expectednessReason: 'Injection site pain and fever are both explicitly listed.',
    correctCausality: 'Related', causalityReason: 'Classic, well-documented short-term reactogenicity pattern with clear temporal relationship.',
    isFatalOrLifeThreatening: false,
  },
  {
    id: 'c35', drugName: 'Dermacure', therapeuticArea: 'Dermatology', country: 'SFDA', productCategory: 'small-molecule', difficulty: 'Subtle',
    narrative: 'A 4-year-old child using Dermacure topical cream over a large body surface area for severe eczema for 6 weeks is found on routine follow-up to have suppressed cortisol levels and growth deceleration, consistent with systemic absorption of the topical steroid causing adrenal suppression. This requires specialist endocrinology follow-up and a tapering plan, though the child has not required hospitalization.',
    referenceSafetyInfo: ['Skin thinning', 'Local irritation', 'Itching'],
    correctSeriousness: 'Serious', seriousnessReason: 'Meets the "other medically important event" seriousness criterion given the risk to a child\u2019s growth and adrenal function, even without hospitalization.',
    correctExpectedness: 'Unexpected', expectednessReason: 'Systemic adrenal suppression is not listed in the reference safety information (only local skin effects are listed).',
    correctCausality: 'Related', causalityReason: 'Well-established mechanism (systemic absorption from topical steroid use over a large surface area in a child, a recognized higher-risk scenario) with no alternative explanation.',
    isFatalOrLifeThreatening: false,
  },
  {
    id: 'c36', drugName: 'Zolvamex', therapeuticArea: 'Cardiovascular', country: 'FDA', productCategory: 'small-molecule', difficulty: 'Subtle',
    narrative: 'A 49-year-old man on Zolvamex developed angioedema after 2 weeks, which resolved after the drug was stopped. Six months later, unaware of the prior episode\u2019s cause, a different physician restarted Zolvamex for recurrent hypertension; the facial swelling recurred within days and resolved again after discontinuation. No other new medications were involved in either episode.',
    referenceSafetyInfo: ['Dry cough', 'Dizziness', 'Hyperkalemia', 'Mild headache'],
    correctSeriousness: 'Serious', seriousnessReason: 'Meets the "medically important event" criterion — angioedema carries a risk of airway compromise even in a case without hospitalization documented here.',
    correctExpectedness: 'Unexpected', expectednessReason: 'Angioedema is not listed in the reference safety information.',
    correctCausality: 'Related', causalityReason: 'A positive rechallenge (the reaction recurred when the drug was restarted) is some of the strongest possible evidence of a causal relationship.',
    isFatalOrLifeThreatening: false,
  },
  {
    id: 'c37', drugName: 'Actrivex', therapeuticArea: 'Oncology', country: 'EMA', productCategory: 'small-molecule', difficulty: 'Subtle',
    narrative: 'A 58-year-old man on Actrivex develops mild elevated liver enzymes at the standard dose. After a planned dose increase for inadequate tumor response, his liver enzymes rise sharply to over 10 times the upper limit of normal, requiring hospitalization and temporary discontinuation; enzymes improved when the drug was held and he was restarted at the original lower dose without recurrence.',
    referenceSafetyInfo: ['Fatigue', 'Diarrhea', 'Rash', 'Elevated liver enzymes', 'Hypertension'],
    correctSeriousness: 'Serious', seriousnessReason: 'Required hospitalization.',
    correctExpectedness: 'Expected', expectednessReason: 'Elevated liver enzymes are explicitly listed, even though this episode was more severe than his baseline mild elevation.',
    correctCausality: 'Related', causalityReason: 'A clear dose-response relationship (worse at higher dose, tolerated again at the lower dose) is strong evidence of a causal relationship.',
    isFatalOrLifeThreatening: false,
  },
  {
    id: 'c38', drugName: 'Cardinex', therapeuticArea: 'Cardiovascular', country: 'ANMAT', productCategory: 'small-molecule', difficulty: 'Subtle',
    narrative: 'An 80-year-old woman on Cardinex is found to have new significant bradycardia on a routine visit, but is lost to follow-up before further workup could be completed, and it is unknown whether any other new medications were started or what her outcome was. The information available is incomplete.',
    referenceSafetyInfo: ['Bradycardia', 'QT prolongation', 'Dizziness', 'GI upset'],
    correctSeriousness: 'Non-serious', seriousnessReason: 'Based on the limited information available, no seriousness criterion (hospitalization, death, disability, etc.) is documented — though this assessment could change if more information became available.',
    correctExpectedness: 'Expected', expectednessReason: 'Bradycardia is explicitly listed in the reference safety information.',
    correctCausality: 'Related', causalityReason: 'Even with incomplete follow-up information, the reaction is a listed, mechanistically plausible effect with a consistent temporal relationship — real-world cases are often assessed on incomplete information like this rather than waiting indefinitely for perfect data.',
    isFatalOrLifeThreatening: false,
  },
  {
    id: 'c39', drugName: 'CardioPace', therapeuticArea: 'Cardiovascular', country: 'TGA', productCategory: 'device', difficulty: 'Subtle',
    narrative: 'A 74-year-old man with an implantable CardioPace pacemaker experiences a sudden failure to pace appropriately, causing loss of consciousness and a fall that results in a hip fracture requiring surgery and hospitalization. Device interrogation confirms the battery depleted significantly earlier than its expected service life, consistent with a manufacturing-related premature battery failure.',
    referenceSafetyInfo: ['Generator pocket discomfort', 'Minor lead migration', 'Expected battery depletion at end of normal service life'],
    correctSeriousness: 'Serious', seriousnessReason: 'Required surgery and hospitalization.',
    correctExpectedness: 'Unexpected', expectednessReason: 'Premature battery failure well before the expected service life is not the same as the listed, normal end-of-life depletion.',
    correctCausality: 'Related', causalityReason: 'Device interrogation directly confirmed the malfunction as the cause of the syncope and fall.',
    isFatalOrLifeThreatening: false,
  },
  {
    id: 'c40', drugName: 'GlucoSense', therapeuticArea: 'Endocrine', country: 'HSA', productCategory: 'diagnostic', difficulty: 'Subtle',
    narrative: 'A 45-year-old woman using a GlucoSense continuous glucose monitor develops a mild headache on the same day as a new sensor insertion. She and two family members are concurrently diagnosed with a viral upper respiratory illness circulating in the household that week, with headache a documented symptom of that illness.',
    referenceSafetyInfo: ['Sensor site skin irritation', 'Inaccurate readings during rapid glucose changes', 'Sensor adhesive detachment'],
    correctSeriousness: 'Non-serious', seriousnessReason: 'Mild, self-limited symptom; no seriousness criteria met.',
    correctExpectedness: 'Unexpected', expectednessReason: 'Headache is not listed in the device\u2019s reference safety information.',
    correctCausality: 'Unrelated', causalityReason: 'A concurrent, independently diagnosed household viral illness with headache as a known symptom fully explains the event.',
    isFatalOrLifeThreatening: false,
  },
  {
    id: 'c41', drugName: 'HerbaCalm', therapeuticArea: 'Sleep Medicine', country: 'BPOM', productCategory: 'herbal', difficulty: 'Subtle',
    narrative: 'A 39-year-old woman taking HerbaCalm (a valerian-and-chamomile herbal sleep supplement) for 3 weeks develops acute hepatitis with markedly elevated liver enzymes and jaundice, requiring hospitalization. Extensive workup rules out viral hepatitis, alcohol use, and other hepatotoxic medications. Liver enzymes begin improving after the supplement is stopped.',
    referenceSafetyInfo: ['Drowsiness', 'Mild GI upset', 'Headache'],
    correctSeriousness: 'Serious', seriousnessReason: 'Required hospitalization.',
    correctExpectedness: 'Unexpected', expectednessReason: 'Hepatitis is not listed in the reference safety information for this herbal product.',
    correctCausality: 'Related', causalityReason: 'Thorough exclusion of the common alternative causes of hepatitis, plus a positive dechallenge, supports a causal link even for a "natural" product.',
    isFatalOrLifeThreatening: false,
  },
  {
    id: 'c42', drugName: 'AquaDilut 30C', therapeuticArea: 'Allergy', country: 'ANMAT', productCategory: 'homeopathy', difficulty: 'Straightforward',
    narrative: 'A 52-year-old man taking a 30C-dilution homeopathic remedy for seasonal allergies reports mild fatigue during a demanding work period marked by poor sleep, which he himself attributes to overwork rather than the remedy.',
    referenceSafetyInfo: ['No known pharmacological adverse effects reported at this dilution'],
    correctSeriousness: 'Non-serious', seriousnessReason: 'Mild, self-attributed symptom; no seriousness criteria met.',
    correctExpectedness: 'Unexpected', expectednessReason: 'Fatigue is not listed, and at this extreme dilution a pharmacological mechanism is implausible in any case.',
    correctCausality: 'Unrelated', causalityReason: 'The patient\u2019s own alternative explanation (overwork, poor sleep) is plausible, and the extreme dilution makes a pharmacological mechanism highly implausible.',
    isFatalOrLifeThreatening: false,
  },
  {
    id: 'c43', drugName: 'LumiGlow', therapeuticArea: 'Dermatology', country: 'SFDA', productCategory: 'cosmetic', difficulty: 'Straightforward',
    narrative: 'A 27-year-old woman using LumiGlow brightening cream for 2 weeks develops severe allergic contact dermatitis with widespread facial and neck blistering, requiring an emergency room visit and a short hospital observation to manage the risk of secondary infection.',
    referenceSafetyInfo: ['Mild redness', 'Temporary tingling sensation', 'Dryness'],
    correctSeriousness: 'Serious', seriousnessReason: 'Required hospitalization.',
    correctExpectedness: 'Unexpected', expectednessReason: 'Severe blistering dermatitis is a distinct, far more severe reaction than the mild redness/tingling listed.',
    correctCausality: 'Related', causalityReason: 'Classic contact dermatitis timeline with no other new products introduced.',
    isFatalOrLifeThreatening: false,
  },
  {
    id: 'c44', drugName: 'Vitalyse (generic)', therapeuticArea: 'Hematology', country: 'COFEPRIS', productCategory: 'generic', difficulty: 'Straightforward',
    narrative: 'A pharmacy dispensing error results in a 68-year-old man receiving double his prescribed dose of generic Vitalyse for one week before the error is caught. He develops increased bruising and gum bleeding, managed with dose correction and monitoring, without requiring hospitalization. Because the error itself (not just the resulting adverse event) is safety-relevant, it is also logged as a special-situation medication-error report alongside the case.',
    referenceSafetyInfo: ['Bleeding/bruising', 'GI upset', 'Anemia'],
    correctSeriousness: 'Non-serious', seriousnessReason: 'Managed without hospitalization; no seriousness criteria met.',
    correctExpectedness: 'Expected', expectednessReason: 'Bruising is explicitly listed.',
    correctCausality: 'Related', causalityReason: 'Clear, dose-dependent mechanism directly tied to the confirmed dispensing error.',
    isFatalOrLifeThreatening: false,
  },
  {
    id: 'c45', drugName: 'Dermalix-B (biosimilar)', therapeuticArea: 'Dermatology', country: 'WHO_PQ', productCategory: 'biosimilar', difficulty: 'Straightforward',
    narrative: 'A 41-year-old man switched from originator Dermalix to its biosimilar Dermalix-B for psoriasis. Two weeks after the switch he develops a moderate injection site reaction, somewhat more pronounced than he experienced on the originator, managed with antihistamine cream and resolving over several days without further treatment.',
    referenceSafetyInfo: ['Injection site reaction', 'Upper respiratory infection', 'Headache'],
    correctSeriousness: 'Non-serious', seriousnessReason: 'Resolved with minimal self-treatment; no seriousness criteria met.',
    correctExpectedness: 'Expected', expectednessReason: 'Injection site reaction is explicitly listed, even though this episode was somewhat more pronounced than his prior experience.',
    correctCausality: 'Related', causalityReason: 'Classic local reaction with a clear temporal relationship — a switch to a biosimilar doesn\u2019t change how a listed, mechanistically expected reaction should be assessed.',
    isFatalOrLifeThreatening: false,
  },
  {
    id: 'c46', drugName: 'Hepacurin', therapeuticArea: 'Hepatology', country: 'ANVISA', productCategory: 'orphan', difficulty: 'Subtle',
    narrative: 'A 30-year-old woman with a rare genetic metabolic liver disorder receives Hepacurin under a compassionate-use, named-patient program for an unlicensed indication. After 4 weeks she develops sudden severe abdominal pain, and imaging shows a portal vein thrombosis requiring hospitalization and anticoagulation. Hematology attributes the thrombosis primarily to her rare underlying disorder, which is independently known to cause a hypercoagulable state, with no other supporting evidence for a drug effect.',
    referenceSafetyInfo: ['Fatigue', 'Headache', 'Nausea', 'Anemia'],
    correctSeriousness: 'Serious', seriousnessReason: 'Required hospitalization.',
    correctExpectedness: 'Unexpected', expectednessReason: 'Portal vein thrombosis is not listed in the reference safety information.',
    correctCausality: 'Unrelated', causalityReason: 'Hematology specifically attributes the event to the patient\u2019s well-documented, independently hypercoagulable rare disease, with no supporting evidence implicating the drug. (Reported via a solicited, named-patient program rather than spontaneously.)',
    isFatalOrLifeThreatening: false,
  },
]

export const THERAPEUTIC_AREAS = Array.from(new Set(PV_CASES.map((c) => c.therapeuticArea)))
