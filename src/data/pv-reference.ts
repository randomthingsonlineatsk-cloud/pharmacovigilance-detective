// ---------------------------------------------------------------------------
// Reference content for Pharmacovigilance Detective: classification scales,
// regulatory bodies, product categories, case lifecycle, aggregate
// reporting, and coding dictionaries (MedDRA / WHODrug / ICD-10).
//
// Database/program names attached to regulators below were checked against
// public sources where noted; for agencies where a specific PV database name
// isn't confidently sourced here, only the agency's general pharmacovigilance
// role is described rather than guessing at a specific system name.
// ---------------------------------------------------------------------------

export interface Regulator {
  key: string
  name: string
  region: string
  color: string
  pvNote: string
}

export const REGULATORS: Regulator[] = [
  { key: 'FDA', name: 'FDA', region: 'North America', color: 'hsl(208 85% 58%)', pvNote: 'Spontaneous reports go into FAERS (FDA Adverse Event Reporting System); vaccines are reported separately to VAERS (jointly run with the CDC), and medical devices to MAUDE.' },
  { key: 'HC', name: 'Health Canada', region: 'North America', color: 'hsl(0 70% 62%)', pvNote: 'Adverse reaction reports are collected through the Canada Vigilance Program and published via the Canada Vigilance Adverse Reaction Online Database.' },
  { key: 'EMA', name: 'EMA', region: 'Europe', color: 'hsl(258 70% 65%)', pvNote: 'Suspected adverse reactions across the EU/EEA are reported into EudraVigilance, and safety signals are assessed by PRAC (the Pharmacovigilance Risk Assessment Committee).' },
  { key: 'MHRA', name: 'MHRA', region: 'Europe', color: 'hsl(220 70% 60%)', pvNote: 'UK spontaneous reports go through the Yellow Card Scheme.' },
  { key: 'SWISSMEDIC', name: 'Swissmedic', region: 'Europe', color: 'hsl(0 65% 55%)', pvNote: 'Runs Switzerland\u2019s national spontaneous adverse drug reaction reporting system.' },
  { key: 'TGA', name: 'TGA', region: 'Asia-Pacific', color: 'hsl(152 55% 48%)', pvNote: 'Adverse event reports are published in the DAEN (Database of Adverse Event Notifications).' },
  { key: 'PMDA', name: 'PMDA', region: 'Asia-Pacific', color: 'hsl(340 65% 60%)', pvNote: 'Japan\u2019s Pharmaceuticals and Medical Devices Agency collects and evaluates post-marketing safety reports on behalf of the MHLW.' },
  { key: 'NMPA', name: 'NMPA', region: 'Asia-Pacific', color: 'hsl(38 92% 55%)', pvNote: 'China\u2019s National Medical Products Administration oversees the national ADR monitoring system.' },
  { key: 'CDSCO', name: 'CDSCO', region: 'Asia-Pacific', color: 'hsl(30 80% 55%)', pvNote: 'India\u2019s Pharmacovigilance Programme of India (PvPI) is coordinated by the Indian Pharmacopoeia Commission (IPC) as the National Coordinating Centre, feeding into WHO\u2019s global database.' },
  { key: 'HSA', name: 'HSA', region: 'Asia-Pacific', color: 'hsl(190 70% 50%)', pvNote: 'Singapore\u2019s Health Sciences Authority runs the national adverse event reporting system for medicines and health products.' },
  { key: 'MFDS', name: 'MFDS', region: 'Asia-Pacific', color: 'hsl(265 60% 60%)', pvNote: 'South Korea\u2019s Ministry of Food and Drug Safety runs the national drug safety monitoring system.' },
  { key: 'BPOM', name: 'BPOM', region: 'Asia-Pacific', color: 'hsl(15 75% 55%)', pvNote: 'Indonesia\u2019s national food and drug agency runs the national ADR monitoring center (MESO).' },
  { key: 'ANVISA', name: 'ANVISA', region: 'Latin America', color: 'hsl(142 55% 45%)', pvNote: 'Brazil\u2019s health regulatory agency coordinates the national pharmacovigilance system (VigiMed/Notivisa).' },
  { key: 'COFEPRIS', name: 'Cofepris', region: 'Latin America', color: 'hsl(150 45% 42%)', pvNote: 'Mexico\u2019s health regulator runs the national pharmacovigilance system.' },
  { key: 'ANMAT', name: 'ANMAT', region: 'Latin America', color: 'hsl(200 55% 48%)', pvNote: 'Argentina\u2019s national regulator runs the national pharmacovigilance system (Sistema Nacional de Farmacovigilancia).' },
  { key: 'SFDA', name: 'SFDA', region: 'Middle East', color: 'hsl(158 50% 45%)', pvNote: 'Saudi Arabia\u2019s Food and Drug Authority runs the national pharmacovigilance center.' },
  { key: 'UAE_MOHAP', name: 'UAE MOHAP', region: 'Middle East', color: 'hsl(175 55% 45%)', pvNote: 'UAE\u2019s Ministry of Health and Prevention runs the national pharmacovigilance and drug safety department.' },
  { key: 'SAHPRA', name: 'SAHPRA', region: 'Africa', color: 'hsl(90 45% 45%)', pvNote: 'South Africa\u2019s Health Products Regulatory Authority runs the national adverse drug reaction monitoring program.' },
  { key: 'NAFDAC', name: 'NAFDAC', region: 'Africa', color: 'hsl(120 45% 42%)', pvNote: 'Nigeria\u2019s food and drug agency runs the national pharmacovigilance center.' },
  { key: 'AMA', name: 'AMA', region: 'Africa', color: 'hsl(45 70% 50%)', pvNote: 'Africa\u2019s continental medicines regulator, established to harmonize regulation (including safety monitoring) across African Union member states.' },
  { key: 'WHO_PQ', name: 'WHO PQ', region: 'Global', color: 'hsl(210 15% 55%)', pvNote: 'The global hub is the WHO Programme for International Drug Monitoring, run by the Uppsala Monitoring Centre (UMC) in Sweden, which maintains VigiBase — the world\u2019s largest individual case safety report database, fed by over 100 member countries.' },
]

export interface ProductCategory {
  key: string
  label: string
}

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  { key: 'small-molecule', label: 'Small Molecule (NCE)' },
  { key: 'biologic', label: 'Biologic' },
  { key: 'vaccine', label: 'Vaccine' },
  { key: 'cell-gene', label: 'Cell & Gene Therapy' },
  { key: 'pediatric', label: 'Pediatric' },
  { key: 'orphan', label: 'Orphan / Rare Disease' },
  { key: 'generic', label: 'Generic' },
  { key: 'biosimilar', label: 'Biosimilar' },
  { key: 'device', label: 'Medical Device' },
  { key: 'diagnostic', label: 'Diagnostic (IVD)' },
  { key: 'herbal', label: 'Herbal / Traditional Medicine' },
  { key: 'homeopathy', label: 'Homeopathy' },
  { key: 'cosmetic', label: 'Cosmetic' },
]

// ---------------------------------------------------------------------------
// Causality, severity, and preventability scales
// ---------------------------------------------------------------------------

export interface NaranjoQuestion {
  id: string
  question: string
  yes: number
  no: number
  unknown: number
}

export const NARANJO_QUESTIONS: NaranjoQuestion[] = [
  { id: 'q1', question: 'Are there previous conclusive reports on this reaction?', yes: 1, no: 0, unknown: 0 },
  { id: 'q2', question: 'Did the adverse event appear after the suspected drug was given?', yes: 2, no: -1, unknown: 0 },
  { id: 'q3', question: 'Did the adverse reaction improve when the drug was discontinued or a specific antagonist was given?', yes: 1, no: 0, unknown: 0 },
  { id: 'q4', question: 'Did the adverse reaction reappear when the drug was readministered?', yes: 2, no: -1, unknown: 0 },
  { id: 'q5', question: 'Are there alternative causes that could on their own have caused the reaction?', yes: -1, no: 2, unknown: 0 },
  { id: 'q6', question: 'Did the reaction reappear when a placebo was given?', yes: -1, no: 1, unknown: 0 },
  { id: 'q7', question: 'Was the drug detected in blood (or other fluids) in a concentration known to be toxic?', yes: 1, no: 0, unknown: 0 },
  { id: 'q8', question: 'Was the reaction more severe when the dose was increased, or less severe when the dose was decreased?', yes: 1, no: 0, unknown: 0 },
  { id: 'q9', question: 'Did the patient have a similar reaction to the same or similar drugs in any previous exposure?', yes: 1, no: 0, unknown: 0 },
  { id: 'q10', question: 'Was the adverse event confirmed by any objective evidence?', yes: 1, no: 0, unknown: 0 },
]

export function naranjoCategory(score: number): string {
  if (score >= 9) return 'Definite'
  if (score >= 5) return 'Probable'
  if (score >= 1) return 'Possible'
  return 'Doubtful'
}

export interface WhoUmcCategory {
  category: string
  criteria: string
}

export const WHO_UMC_CATEGORIES: WhoUmcCategory[] = [
  { category: 'Certain', criteria: 'Plausible time relationship; cannot be explained by disease or other drugs; response on withdrawal plausible; event pharmacologically/phenomenologically definitive; rechallenge satisfactory if necessary.' },
  { category: 'Probable/Likely', criteria: 'Reasonable time relationship; unlikely to be attributed to disease or other drugs; response to withdrawal clinically reasonable; rechallenge not required.' },
  { category: 'Possible', criteria: 'Reasonable time relationship; could also be explained by disease or other drugs; information on drug withdrawal may be lacking or unclear.' },
  { category: 'Unlikely', criteria: 'Time relationship makes a causal association improbable; disease or other drugs provide plausible explanations.' },
  { category: 'Conditional/Unclassified', criteria: 'Event reported as an adverse reaction; more data needed for proper assessment, or additional data under examination.' },
  { category: 'Unassessable/Unclassifiable', criteria: 'A report suggesting an adverse reaction cannot be judged because information is insufficient or contradictory, and cannot be supplemented or verified.' },
]

export interface HartwigLevel {
  level: string
  description: string
}

export const HARTWIG_SEVERITY: HartwigLevel[] = [
  { level: 'Level 1', description: 'Reaction requires no change in treatment with the suspected drug.' },
  { level: 'Level 2', description: 'Reaction requires the suspected drug to be discontinued, held, or the dose changed; no antidote or treatment required; hospital stay not increased.' },
  { level: 'Level 3', description: 'Level 2 criteria met AND an antidote or other treatment is required; no increase in hospital stay.' },
  { level: 'Level 4a', description: 'Any level 3 criteria met AND hospital stay is prolonged by at least one day due to the reaction.' },
  { level: 'Level 4b', description: 'Any level 3 criteria met AND the reaction is the reason for hospital admission.' },
  { level: 'Level 5', description: 'Level 4 criteria met AND the reaction causes permanent harm to the patient.' },
  { level: 'Level 6', description: 'The reaction directly or indirectly leads to intensive care or requires care to sustain life.' },
  { level: 'Level 7', description: 'The reaction directly or indirectly contributes to the patient\u2019s death.' },
]

export interface SchumockCriterion {
  question: string
}

export const SCHUMOCK_THORNTON_CRITERIA: SchumockCriterion[] = [
  { question: 'Was the drug involved not appropriate for the patient\u2019s clinical condition?' },
  { question: 'Was the dose, route, or frequency of administration inappropriate for the patient\u2019s age, weight, or disease state?' },
  { question: 'Was a lab test or therapeutic drug monitoring required by the drug not performed?' },
  { question: 'Did the patient have a history of a similar allergy or reaction to the same or a related drug?' },
  { question: 'Was a drug interaction involved in the reaction?' },
  { question: 'Was a toxic serum drug level documented?' },
  { question: 'Was there a documented history of poor compliance or drug/alcohol abuse involved?' },
  { question: 'Was a preventive measure (e.g., prophylaxis) that could have avoided the reaction not employed?' },
]
export const SCHUMOCK_THORNTON_NOTE = 'If the answer to ANY of these questions is yes, the reaction is generally classified as at least "possibly" preventable — the more yes answers, the stronger the case for a preventable ADR (as opposed to an unavoidable one).'

export interface RawlinsCategory {
  code: string
  name: string
  description: string
  example: string
}

export const RAWLINS_THOMPSON: RawlinsCategory[] = [
  { code: 'A', name: 'Augmented', description: 'Dose-related, predictable from the drug\u2019s known pharmacology, common, and usually mild — reversible on dose reduction or discontinuation.', example: 'Bradycardia from a beta-blocker.' },
  { code: 'B', name: 'Bizarre', description: 'Not dose-related, unpredictable from the drug\u2019s pharmacology, uncommon but often serious.', example: 'Anaphylaxis to penicillin.' },
  { code: 'C', name: 'Chronic', description: 'Related to cumulative dose over long-term use.', example: 'Osteonecrosis of the jaw with long-term bisphosphonate use.' },
  { code: 'D', name: 'Delayed', description: 'Occurs some time after exposure, sometimes even after the drug is stopped.', example: 'Teratogenicity, or carcinogenesis years after exposure.' },
  { code: 'E', name: 'End of use', description: 'Occurs on, or shortly after, drug withdrawal.', example: 'Rebound hypertension after abruptly stopping a beta-blocker.' },
  { code: 'F', name: 'Failure of therapy', description: 'Unexpected failure of a drug to work as intended, sometimes due to an interaction.', example: 'Contraceptive failure caused by an enzyme-inducing interacting drug.' },
]

export interface RucamDomain {
  domain: string
  description: string
}

// RUCAM (Roussel Uclaf Causality Assessment Method) — a real, widely used
// scale specifically for drug-induced liver injury. Presented here at the
// domain level (structure is well documented and stable); exact point
// allocations per answer are more granular than shown here, since different
// published versions vary slightly in their precise weighting.
export const RUCAM_DOMAINS: RucamDomain[] = [
  { domain: 'Time to onset', description: 'How soon the liver injury appeared after starting the drug, and — separately — after stopping it, scored differently depending on whether the pattern is hepatocellular or cholestatic/mixed.' },
  { domain: 'Course after stopping the drug', description: 'How quickly liver enzymes improved after discontinuation (a positive dechallenge supports a higher score).' },
  { domain: 'Risk factors', description: 'Alcohol use, pregnancy, and age are checked as factors that can raise (or in some versions, contextualize) the likelihood of drug-induced injury.' },
  { domain: 'Concomitant drugs', description: 'Whether another medication with known hepatotoxic potential was also being taken, which can lower confidence in the primary suspect drug.' },
  { domain: 'Exclusion of non-drug causes', description: 'Systematic exclusion of viral hepatitis, biliary obstruction, alcoholic liver disease, and other common non-drug causes of liver injury.' },
  { domain: 'Previous hepatotoxicity information', description: 'Whether the suspect drug has documented hepatotoxicity in prior literature or product labeling.' },
  { domain: 'Response to rechallenge', description: 'If the drug was restarted, whether liver enzymes rose again — a positive rechallenge is strong supporting evidence.' },
]
export const RUCAM_NOTE = 'RUCAM scores sum to a category commonly cited in the literature as: >8 Highly probable, 6-8 Probable, 3-5 Possible, 1-2 Unlikely, \u22640 Excluded. This app shows the real domain structure rather than a fully interactive point calculator, since exact point weightings vary slightly between published versions of the tool.'

export interface BradfordHillCriterion {
  criterion: string
  description: string
}

// Bradford Hill's 9 criteria — a real, foundational framework from
// epidemiology for judging causality at a population/signal level (as
// opposed to the individual-case scales above), still referenced in
// pharmacovigilance signal evaluation.
export const BRADFORD_HILL: BradfordHillCriterion[] = [
  { criterion: 'Strength', description: 'A larger, more pronounced association is more likely to be causal than a small one.' },
  { criterion: 'Consistency', description: 'The association is observed repeatedly, by different people, in different places, with different methods.' },
  { criterion: 'Specificity', description: 'A specific population/exposure is associated with a specific outcome, with no other likely explanation.' },
  { criterion: 'Temporality', description: 'The exposure must precede the outcome — the one criterion considered absolutely essential.' },
  { criterion: 'Biological gradient', description: 'A dose-response relationship (more exposure, more effect) supports causality.' },
  { criterion: 'Plausibility', description: 'A plausible biological mechanism exists (helpful, though absence doesn\u2019t rule out causality if the mechanism simply isn\u2019t yet known).' },
  { criterion: 'Coherence', description: 'The association doesn\u2019t conflict with what\u2019s otherwise known about the disease\u2019s natural history or biology.' },
  { criterion: 'Experiment', description: 'Experimental or semi-experimental evidence (e.g., removing the exposure reduces the outcome) strengthens the case.' },
  { criterion: 'Analogy', description: 'Similar exposures are already known to cause similar effects, making the proposed association more plausible.' },
]

export const FRENCH_METHOD_NOTE = 'The French Method (M\u00e9thode fran\u00e7aise d\u2019imputabilit\u00e9) combines a chronological score (based on time to onset, dechallenge, and rechallenge) with a separate semiological score (based on how suggestive the clinical picture is, exclusion of other causes, and objective test evidence) into a combined intrinsic imputability rating (I0 to I4). It also calculates a separate bibliographic score (B0 to B3) rating how well-documented the reaction already is in the literature — notably keeping "is this plausible for this case" and "is this already a known reaction" as two distinct questions.'

// ---------------------------------------------------------------------------
// Full case-resolution workflow ("the entire forward process") — receipt
// through post-closure signal feed, including the validity and follow-up
// branches.
// ---------------------------------------------------------------------------

export interface LifecycleStep {
  title: string
  description: string
}

export const CASE_REGISTRATION_STEPS: LifecycleStep[] = [
  { title: '1. Initial contact', description: 'A report reaches the organization through any channel: a phone call, email, letter, sales rep field report, website form, literature article, social media monitoring, clinical trial, market research program, or a regulatory authority forwarding a report.' },
  { title: '2. Case intake logging', description: 'The raw contact is logged with a timestamp — this initial receipt date is what starts the regulatory reporting clock for expedited cases, even before full triage is complete.' },
  { title: '3. Minimum criteria (validity) check', description: 'The report is checked against the four minimum criteria for a valid Individual Case Safety Report (ICSR): identifiable patient, identifiable reporter, at least one suspect drug, and at least one adverse event. Missing any one routes the report to the "incomplete/pending" queue rather than full registration.' },
  { title: '3a. Branch — invalid/incomplete report', description: 'If minimum criteria aren\u2019t met, the case is held as an inquiry; a follow-up request goes back to the original source. If the missing information never arrives, the report stays outside the formal ICSR process — it is never "rejected" outright so much as never activated.' },
  { title: '3b. Branch — valid report', description: 'Once all four minimum criteria are confirmed, the case is formally registered and assigned a unique case identifier.' },
  { title: '4. Duplicate search', description: 'The database is searched for existing cases that might describe the same event in the same patient from a different source (e.g., both the prescriber and the patient reporting separately), to avoid double-counting.' },
  { title: '5. Data entry', description: 'Structured fields (demographics, dates, dosing, outcome) and the free-text narrative are entered into the safety database.' },
  { title: '6. Medical coding', description: 'The adverse event(s) are coded to MedDRA Preferred Terms, the suspect and concomitant medications are coded via WHODrug, and relevant diagnoses/medical history are coded via ICD-10.' },
  { title: '7. Seriousness assessment', description: 'The case is assessed against the standard seriousness criteria (death, life-threatening, hospitalization/prolongation, persistent disability, congenital anomaly, or other medically important event).' },
  { title: '8. Expectedness assessment', description: 'Each coded event is compared against the current reference safety information (Company Core Data Sheet, approved label, or Investigator\u2019s Brochure for trials) to determine expected vs. unexpected.' },
  { title: '9. Causality assessment', description: 'A structured causality assessment is performed — informed by tools like the Naranjo scale, WHO-UMC categories, or RUCAM for liver injury — considering temporal relationship, dechallenge/rechallenge, and alternative explanations.' },
  { title: '10. Reportability determination', description: 'Seriousness + expectedness + causality together determine whether this is a SUSAR requiring expedited (7-day or 15-day) reporting, or a routine/periodic case, per the rules of every market where the product is authorized.' },
  { title: '11. Medical review & quality check', description: 'A qualified medical reviewer checks the coding, assessments, and narrative for accuracy and completeness before anything is finalized.' },
  { title: '12. Regulatory submission (if expedited)', description: 'Expedited cases are formatted (commonly as an E2B(R3) electronic ICSR) and transmitted to each relevant regulatory authority within its required timeline.' },
  { title: '13. Follow-up loop', description: 'If key information is missing (final outcome, lab values, autopsy results, rechallenge data), a follow-up request goes back to the reporter. New information triggers an updated ("follow-up") version of the case, which may itself need re-submission if it changes the reportability determination.' },
  { title: '14. Case closure', description: 'Once no further follow-up is expected and all fields are complete, the case is marked closed in the database — closure is a status, not a deletion, and the case can be reopened if genuinely new information arrives later.' },
  { title: '15. Feed into aggregate analysis', description: 'Even after individual closure, the case remains part of the cumulative dataset used for signal detection and feeds into the next Periodic Safety Update Report / Periodic Benefit-Risk Evaluation Report (PSUR/PBRER).' },
  { title: '16. Signal evaluation (if applicable)', description: 'If the case contributes to an emerging pattern identified during signal detection — sometimes assessed at the population level using frameworks like the Bradford Hill criteria — it feeds into a formal signal evaluation process that can lead to label updates, risk minimization measures, or further regulatory action.' },
]

export const INVALID_CASE_CRITERIA = [
  'No identifiable patient (e.g., a report referring vaguely to "some patients" with no specific individual described).',
  'No identifiable reporter (no way to trace the report back to a real, contactable source).',
  'No suspect drug or health product named.',
  'No adverse event or clinical outcome described at all.',
]
export const INVALID_CASE_NOTE = 'A report missing any one of these four elements is not yet a valid, reportable ICSR — it may be logged as an inquiry or held pending more information, but it doesn\u2019t enter the regulatory reporting clock until all four are present.'

export const SOLICITED_VS_UNSOLICITED = {
  solicited: 'Reports collected through an organized data-collection system: clinical trials, registries, patient support programs, disease management programs, market research surveys, or named-patient/compassionate-use programs. Because these systems actively ask about adverse events, causality generally still requires a genuine assessment rather than being automatically "related."',
  unsolicited: 'Spontaneous reports that arrive without having been specifically solicited: a healthcare professional or patient voluntarily contacting the company or a regulator, a report identified in the literature, or one from a regulatory authority or the general media. Most classic ICSR/SUSAR pharmacovigilance activity is built around unsolicited (spontaneous) reports.',
}

export const COMPLAINT_CLASSIFICATION_NOTE = 'When a complaint first arrives, it\u2019s triaged into one or more of three buckets: a pure Product Quality Complaint (PQC) with no associated adverse event (e.g., a broken seal, wrong color tablet, with no harm reported); a pure Adverse Event with no product quality issue; or a combined PQC-with-AE, which must be routed to both the quality/complaints team AND pharmacovigilance, since a quality defect that also caused harm is both a quality signal and a safety case.'

export const CASE_RESOLUTION_NOTE = 'A case is considered "resolved" for pharmacovigilance purposes once: the four minimum ICSR criteria are confirmed, medical coding (MedDRA/WHODrug/ICD-10) is complete, seriousness/expectedness/causality have been formally assessed, the correct regulatory reportability decision has been made and (if required) submitted within the applicable timeline, and no further follow-up information is expected. The case then feeds into ongoing aggregate analysis (signal detection, PSUR/PBRER data) even after its individual file is closed — see the full 16-step workflow above for the complete forward process.'

// ---------------------------------------------------------------------------
// Aggregate reporting: ICSR vs aggregate, PSUR/PBRER
// ---------------------------------------------------------------------------

export const ICSR_VS_AGGREGATE = {
  icsr: 'An Individual Case Safety Report (ICSR) documents a single adverse event experienced by a single identifiable patient with a single identifiable reporter — the fundamental unit of spontaneous pharmacovigilance reporting, submitted individually and, when serious and unexpected, on an expedited timeline.',
  aggregate: 'Aggregate reports summarize and analyze safety data across many cases over a defined period, looking for patterns rather than reacting to a single case. They\u2019re submitted on a periodic (not per-case) schedule and are where signal detection and evolving benefit-risk conclusions actually get documented.',
}

export const PSUR_PBRER_NOTE = 'The Periodic Safety Update Report (PSUR), now more often called the Periodic Benefit-Risk Evaluation Report (PBRER) under ICH E2C(R2), is the core aggregate safety document: it summarizes worldwide safety experience for a product over a defined interval, integrates it with what\u2019s known about efficacy/benefit, and concludes whether the overall benefit-risk balance remains favorable — including any recommended label or risk-management changes.'

// ---------------------------------------------------------------------------
// Coding dictionaries: MedDRA, WHODrug, ICD-10 — including real, public
// numeric/code structure facts. Specific MedDRA Preferred Term codes and
// WHODrug Drug Record Numbers are proprietary and versioned, so rather than
// invent a plausible-looking fake number, this section states the real
// FORMAT facts (confirmed, stable) and uses real, public ATC and ICD-10
// codes (both public classification systems) for concrete examples.
// ---------------------------------------------------------------------------

export interface DictionaryQA {
  question: string
  answer: string
}

export const DICTIONARY_QA: DictionaryQA[] = [
  { question: 'What is MedDRA used for?', answer: 'MedDRA (Medical Dictionary for Regulatory Activities) is the standard, internationally agreed dictionary used to code adverse events and indications into consistent, structured terms, organized in a 5-level hierarchy: System Organ Class (SOC) \u2192 High Level Group Term (HLGT) \u2192 High Level Term (HLT) \u2192 Preferred Term (PT) \u2192 Lowest Level Term (LLT).' },
  { question: 'What numeric format does MedDRA use for its codes?', answer: 'Every MedDRA term at every level has a unique 8-digit numeric code. The specific codes are proprietary and change with each twice-yearly MedDRA version release, so this app doesn\u2019t print invented example numbers as if they were real registry codes — only the real, stable structural fact (8 digits, 5 hierarchy levels) is shown.' },
  { question: 'What is WHODrug used for?', answer: 'WHODrug (the WHO Drug Dictionary) is the standard dictionary used to code the actual medicinal products/active ingredients named in a case report — trade names, generic names, and formulations — using a unique Drug Record Number (DRN) for each product, often paired with the product\u2019s ATC classification.' },
  { question: 'What is ICD-10 used for in pharmacovigilance?', answer: 'ICD-10 (International Classification of Diseases, 10th revision) is used to code the patient\u2019s underlying diagnoses, indication for the suspect drug, and relevant medical history — providing clinical context that supports causality and seriousness assessment.' },
  { question: 'Why use three different dictionaries instead of one?', answer: 'Each captures a different part of the case: MedDRA codes what happened (the event), WHODrug codes what was taken (the product), and ICD-10 codes why it was taken and what else was going on medically (indication and history) — together they make a case comparable and searchable across a global, multi-language reporting system.' },
  { question: 'What is a MedDRA Preferred Term (PT)?', answer: 'The PT is the standard, single medical concept level of MedDRA coding used for individual case reporting — e.g., "Anaphylactic reaction" — sitting above more granular Lowest Level Terms and below broader System Organ Classes used mainly for aggregate analysis and signal detection.' },
  { question: 'What is the ATC classification system, and how does it relate to WHODrug?', answer: 'The Anatomical Therapeutic Chemical (ATC) classification system, maintained by the WHO Collaborating Centre, groups drugs by the organ/system they act on and their therapeutic/chemical properties, using a code like "C09A" (ACE inhibitors, plain). It\u2019s a real, public classification, often coded alongside WHODrug\u2019s own product-level identifiers to describe what class a drug belongs to.' },
]

export interface AtcExample {
  code: string
  className: string
}

// Real, public top-level ATC classification examples (WHO Collaborating
// Centre for Drug Statistics Methodology) — used here to show genuine
// classification codes for the drug classes featured in this app.
export const ATC_EXAMPLES: AtcExample[] = [
  { code: 'C09A', className: 'ACE inhibitors, plain' },
  { code: 'C01B', className: 'Antiarrhythmics, class I and III' },
  { code: 'C08C', className: 'Selective calcium channel blockers' },
  { code: 'C10A', className: 'Lipid modifying agents, plain (statins)' },
  { code: 'N06A', className: 'Antidepressants' },
  { code: 'N05A', className: 'Antipsychotics' },
  { code: 'N03A', className: 'Antiepileptics' },
  { code: 'R03A', className: 'Adrenergics, inhalants' },
  { code: 'A10B', className: 'Blood glucose lowering drugs, excl. insulins' },
  { code: 'B01A', className: 'Antithrombotic agents' },
  { code: 'M01A', className: 'Anti-inflammatory and antirheumatic products, non-steroids' },
  { code: 'M05B', className: 'Drugs affecting bone structure and mineralization (bisphosphonates)' },
  { code: 'L01E', className: 'Protein kinase inhibitors' },
  { code: 'L04A', className: 'Immunosuppressants' },
  { code: 'J05A', className: 'Direct acting antivirals' },
  { code: 'J07A', className: 'Bacterial and viral vaccines' },
  { code: 'H03A', className: 'Thyroid preparations' },
  { code: 'D07A', className: 'Corticosteroids, plain (topical)' },
]

export interface Icd10Example {
  code: string
  description: string
}

// Real, well-established, high-confidence ICD-10 codes used for teaching
// illustration — a small, stable subset chosen specifically because they
// are among the most commonly cited codes in medical education.
export const ICD10_EXAMPLES: Icd10Example[] = [
  { code: 'I10', description: 'Essential (primary) hypertension' },
  { code: 'E11', description: 'Type 2 diabetes mellitus' },
  { code: 'J45', description: 'Asthma' },
  { code: 'N39.0', description: 'Urinary tract infection, site not specified' },
  { code: 'I48', description: 'Atrial fibrillation and flutter' },
  { code: 'K92.2', description: 'Gastrointestinal hemorrhage, unspecified' },
  { code: 'T78.3', description: 'Angioedema' },
  { code: 'K85', description: 'Acute pancreatitis' },
  { code: 'D64.9', description: 'Anemia, unspecified' },
  { code: 'M81', description: 'Osteoporosis without current pathological fracture' },
]

export const DICTIONARY_QUIZ: { question: string; options: string[]; correctIndex: number; explanation: string }[] = [
  { question: 'Which dictionary would you use to code "myocardial infarction" as the adverse event term?', options: ['MedDRA', 'WHODrug', 'ICD-10'], correctIndex: 0, explanation: 'MedDRA is the standard dictionary for coding the adverse event/reaction itself.' },
  { question: 'Which dictionary would you use to code the specific brand of aspirin the patient was taking?', options: ['MedDRA', 'WHODrug', 'ICD-10'], correctIndex: 1, explanation: 'WHODrug codes the medicinal product/active ingredient named in the report.' },
  { question: 'Which dictionary would you use to code the patient\u2019s pre-existing type 2 diabetes as relevant medical history?', options: ['MedDRA', 'WHODrug', 'ICD-10'], correctIndex: 2, explanation: 'ICD-10 codes diagnoses and medical history/indications, providing clinical context.' },
  { question: 'A case says the event was "Stevens-Johnson syndrome" — what MedDRA level does this typically sit at for individual case reporting?', options: ['System Organ Class', 'Preferred Term', 'Lowest Level Term only, never reported'], correctIndex: 1, explanation: 'Individual cases are coded to the Preferred Term level — the standard single-concept level used for case reporting.' },
  { question: 'How many digits does a MedDRA term code have?', options: ['4 digits', '6 digits', '8 digits'], correctIndex: 2, explanation: 'Every MedDRA term at every hierarchy level has a unique 8-digit numeric code.' },
  { question: 'What does the real ATC code "C09A" refer to?', options: ['Antidepressants', 'ACE inhibitors, plain', 'Antithrombotic agents'], correctIndex: 1, explanation: 'C09A is the genuine WHO ATC classification code for plain ACE inhibitors.' },
]
