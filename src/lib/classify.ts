// "Ask the Detective" classifier. It runs entirely in the browser (no AI
// service, no network). Each category has weighted word patterns; the question
// is normalised, scored against every category, and the best match wins. It
// also reports a second topic when the question spans two, and, when the text
// looks like a case description, reads out the seriousness / expectedness /
// causality cues it can see.

export interface ClassifyResult {
  category: string
  confidence: 'High' | 'Medium' | 'Low'
  explanation: string
  suggestedSection: string
  alsoRelevant?: { category: string; suggestedSection: string }
  caseReading?: string[]
}

interface Rule {
  category: string
  terms: [RegExp, number][]
  why: string
  section: string
}

// Patterns use \b at the start and leave the end open so stems match
// (e.g. /\bhospitali/ matches hospitalised, hospitalized, hospitalisation).
const RULES: Rule[] = [
  {
    category: 'Seriousness Criteria',
    terms: [
      [/\bserious/, 3], [/\bnon-?serious/, 3], [/\bhospitali[sz]/, 2], [/\badmitted|\badmission/, 1], [/\blife[- ]threaten/, 3],
      [/\bfatal|\bdied\b|\bdeath/, 2], [/\bdisabilit|\bincapacit/, 2], [/\bcongenital|\bbirth defect|\banomal/, 2],
      [/\bmedically important|\bimportant medical event/, 3], [/\bprolong\w* (the )?(hospital|stay)/, 2], [/\bicu\b|\bintensive care/, 1],
    ],
    why: 'The question is about whether an event meets the seriousness criteria: death, life-threatening, hospitalization or prolonged hospitalization, persistent disability, congenital anomaly, or another medically important event.',
    section: 'Detective tab → the Seriousness step on any case',
  },
  {
    category: 'Expectedness / Listedness',
    terms: [
      [/\bunexpected/, 3], [/\bexpected/, 2], [/\bunlisted/, 3], [/\blisted/, 2], [/\bon the label|\bin the label|\bproduct label|\blabel(l)?ing/, 2],
      [/\breference safety/, 3], [/\bcore data sheet|\bccds\b/, 3], [/\binvestigator'?s? brochure|\bib\b/, 3], [/\bsmpc\b|\buspi\b|\bpackage insert|\bprescribing information/, 2],
      [/\bknown (side effect|adverse|reaction)/, 2], [/\bnot (mentioned|described|documented)/, 1],
    ],
    why: 'The question is about whether an event is already described in the reference safety information (label, Company Core Data Sheet or Investigator\'s Brochure), which decides expected versus unexpected.',
    section: 'Detective tab → the Expectedness step on any case',
  },
  {
    category: 'Causality Assessment',
    terms: [
      [/\bcausal/, 3], [/\bnaranjo/, 4], [/\bwho[- ]?umc/, 4], [/\brucam/, 4], [/\bdechallenge/, 3], [/\brechallenge/, 3],
      [/\bunrelated|\brelated\b/, 2], [/\bcaused (by|the)|\bdue to the drug|\battribut/, 2], [/\balternative (cause|explanation)/, 3],
      [/\bbradford/, 3], [/\bimputab/, 3], [/\bprobable|\bpossible|\bunlikely|\bcertain\b/, 1], [/\bdrug[- ]induced|\bliver injury|\bhepatotox/, 2],
      [/\btemporal/, 2], [/\bstopp?ed the drug|\bdiscontinu/, 1], [/\bpreventab/, 2], [/\bhartwig|\bschumock/, 3],
    ],
    why: 'The question is about how likely the drug is to have caused the event, which is what structured causality scales (Naranjo, WHO-UMC, RUCAM) are built for.',
    section: 'Scales tab → Naranjo, WHO-UMC and RUCAM',
  },
  {
    category: 'SUSAR / Reporting Timeline',
    terms: [
      [/\bsusar/, 4], [/\bexpedited/, 3], [/\b7[- ]?day|\bseven[- ]day/, 3], [/\b15[- ]?day|\bfifteen[- ]day/, 3], [/\bdeadline|\bdue date|\bdue by/, 2],
      [/\btimeline|\btime ?frame|\btime ?limit/, 2], [/\bclock\b|\bday ?0\b|\bday zero/, 3], [/\bsubmit\w* (within|to|by)|\bhow (soon|quickly|long)/, 2],
      [/\bwhen (do|must|should|to) (i|we) (report|submit)/, 3], [/\breportab|\bneeds? (to be )?report/, 2], [/\bperiodic reporting|\broutine report/, 2],
    ],
    why: 'The question is about whether a case needs expedited reporting and how many days the sponsor or company has to submit it.',
    section: 'Detective tab → the Reporting Timeline step, then the Case Lifecycle tab',
  },
  {
    category: 'Coding (MedDRA / WHODrug / ICD-10)',
    terms: [
      [/\bmeddra/, 4], [/\bwho ?drug/, 4], [/\bicd[- ]?10|\bicd\b/, 4], [/\bpreferred term|\bllt\b|\bhlgt\b|\bhlt\b|\bsoc\b/, 3], [/\bsystem organ class/, 3],
      [/\bcod(e|ed|ing)\b/, 2], [/\batc\b|\banatomical therapeutic/, 3], [/\bdictionar/, 3], [/\bdrug record number|\bdrn\b/, 3], [/\bsmq\b|\bstandardi[sz]ed meddra/, 3],
    ],
    why: 'The question is about coding: MedDRA for events, WHODrug for products, and ICD-10 for diagnoses and history.',
    section: 'Dictionaries tab',
  },
  {
    category: 'Aggregate Reporting (ICSR vs PSUR/PBRER)',
    terms: [
      [/\bpsur/, 4], [/\bpbrer/, 4], [/\bdsur/, 4], [/\baggregate/, 4], [/\bperiodic (safety|benefit)/, 3], [/\bsignal/, 3],
      [/\bprr\b|\bror\b|\bdisproportionalit|\bproportional reporting/, 4], [/\bbenefit[- ]risk/, 3], [/\brmp\b|\brems\b|\brisk management|\brisk minimi[sz]ation/, 3],
      [/\bevans/, 3], [/\bicsr\b.*\bvs\b|\bvs\b.*\bicsr\b/, 2], [/\bsafety update/, 2], [/\bcumulative/, 2],
    ],
    why: 'The question is about analysing safety data across many cases over time (signals, periodic reports, benefit-risk, risk management) rather than a single case.',
    section: 'Aggregate Reporting tab',
  },
  {
    category: 'Case Validity & Registration',
    terms: [
      [/\bvalid/, 3], [/\bminimum (criteria|information|requirement)|\bfour (minimum )?criteria|\b4 (minimum )?criteria/, 4], [/\bidentifiable/, 3],
      [/\bincomplete|\bmissing (info|data|detail)/, 2], [/\bduplicate/, 3], [/\bregist(er|ration)/, 2], [/\bfollow[- ]?up/, 2], [/\bintake|\breceipt|\bday of receipt|\bfirst received/, 2],
      [/\bcase (closure|closed|processing|workflow|lifecycle)/, 3], [/\bicsr\b/, 1], [/\bnarrative/, 1], [/\bquery|\bqueries/, 1], [/\bproduct quality complaint|\bpqc\b/, 3],
    ],
    why: 'The question is about whether a report is a valid ICSR (identifiable patient and reporter, a suspect drug, an event) and how it moves through intake, duplicate checking, and follow-up.',
    section: 'Case Lifecycle tab → Case Registration',
  },
  {
    category: 'Solicited vs Unsolicited',
    terms: [
      [/\bunsolicited/, 4], [/\bsolicited/, 4], [/\bspontaneous/, 3], [/\bpatient support program|\bpatient assistance/, 3], [/\bregistr(y|ies)\b/, 2],
      [/\bmarket research/, 3], [/\bliterature/, 2], [/\bsocial media|\bwebsite|\bonline (post|forum)/, 2], [/\bcompassionate|\bnamed[- ]patient/, 3],
      [/\bclinical (trial|study)/, 1], [/\bsurvey/, 2], [/\bsales rep|\bfield report/, 2],
    ],
    why: 'The question is about where the report came from and whether it was actively collected (solicited) or arrived on its own (unsolicited / spontaneous).',
    section: 'Case Lifecycle tab → Solicited vs Unsolicited',
  },
  {
    category: 'Regulatory Requirement (country-specific)',
    terms: [
      [/\bfda\b|\bfaers|\bmedwatch|\bvaers/, 3], [/\bema\b|\beudravigilance|\bprac\b/, 3], [/\bmhra|\byellow card/, 3], [/\bcdsco|\bpvpi\b|\bindia/, 3],
      [/\bpmda|\bjapan/, 3], [/\btga\b|\bdaen|\baustralia/, 3], [/\bhealth canada|\bcanada vigilance/, 3], [/\bswissmedic|\bnmpa|\bhsa\b|\bmfds|\banvisa|\bcofepris|\banmat|\bsfda|\bsahpra|\bnafdac/, 3],
      [/\bvigibase|\buppsala|\bumc\b|\bwho programme/, 3], [/\bcountr(y|ies)/, 2], [/\bregulator|\bauthorit/, 2], [/\breporting form|\bwhich form|\bcioms/, 3], [/\be2b/, 3],
    ],
    why: 'The question is about the requirements, forms, or reporting channels of a particular regulatory authority or country.',
    section: 'Regulators tab and Forms tab',
  },
]

const FALLBACK: ClassifyResult = {
  category: 'Other / General Pharmacovigilance',
  confidence: 'Low',
  explanation: "This doesn't clearly match one specific topic. Try naming the concept (seriousness, expectedness, causality, reporting timeline, coding, signals) or paste a short case description.",
  suggestedSection: 'Case Lifecycle tab for the overall process, or the Dictionaries tab for terminology',
}

function normalise(q: string): string {
  return ` ${q.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9'\- ]+/g, ' ').replace(/\s+/g, ' ')} `
}

function score(rule: Rule, text: string): number {
  let total = 0
  for (const [re, weight] of rule.terms) if (re.test(text)) total += weight
  return total
}

const has = (text: string, re: RegExp) => re.test(text)

// If the text reads like a case (a patient, a drug, an event), summarise the
// cues for the three questions that decide reportability.
function readCase(text: string): string[] | undefined {
  const looksLikeCase = has(text, /\b\d{1,3}[- ]?(year|yr)[- ]?old|\b(patient|man|woman|male|female|child) (developed|presented|experienced|was admitted|was hospitali|died|had a|reported)|\b(developed|experienced) (a |an |severe |mild )?\w+ (after|while|on)\b/)
  if (!looksLikeCase) return undefined

  const notes: string[] = []

  const nonSerious = has(text, /\bnon-?serious|\bnot serious|\bmild\b|\bno treatment|\bresolved (on its own|without|spontaneously)|\bno (medical )?visit|\bmanaged at home/)
  const serious = !nonSerious && has(text, /\bhospitali[sz]|\badmitted|\bdied\b|\bdeath|\bfatal|\blife[- ]threaten|\bicu\b|\bintensive care|\bpersistent disabilit|\bcongenital|\bmedically important|\bemergency (department|room)/)
  const lifeThreat = has(text, /\bdied\b|\bdeath|\bfatal|\blife[- ]threaten|\bicu\b|\bintensive care/)
  if (serious) notes.push(lifeThreat ? 'Seriousness: reads as serious (fatal or life-threatening wording).' : 'Seriousness: reads as serious (hospitalization or another seriousness criterion is mentioned).')
  else if (nonSerious) notes.push('Seriousness: reads as non-serious (mild, no hospitalization or treatment mentioned).')
  else notes.push('Seriousness: not enough detail. Check for death, life-threatening, hospitalization, disability, congenital anomaly or another medically important event.')

  const unexpected = has(text, /\bnot listed|\bunlisted|\bnot (on|in) the (label|reference|ccds|ib|smpc|uspi)|\bnot (mentioned|described|documented)|\bunexpected|\bnot a known|\bnot previously (reported|described)/)
  const expected = !unexpected && has(text, /\bis listed|\bare listed|\bas listed|\bon the label|\bin the label|\bknown (side effect|adverse|reaction)|\bexpected (side|adverse|reaction)|\bexpected\b/)
  if (unexpected) notes.push('Expectedness: reads as unexpected (not in the reference safety information).')
  else if (expected) notes.push('Expectedness: reads as expected (already in the reference safety information).')
  else notes.push('Expectedness: not stated. Compare the event against the label or Company Core Data Sheet.')

  const unrelated = has(text, /\bunrelated|\bnot related|\balternative cause|\banother cause|\bother (medication|drug) (explain|caus)|\bpre-?existing (condition|disease)|\bclearly caused by|\bexplained by (the )?(disease|infection|trauma)/)
  const related = !unrelated && has(text, /\bpositive dechallenge|\bimproved (after|when|on) (stopp|discontinu|withdraw)|\bresolved (after|when) (stopp|discontinu|withdraw)|\bno (other|alternative) cause|\bnothing else explain|\bpositive rechallenge|\bsuspected (to be )?(related|caused)|\bdrug[- ]related|\bis related|\bwas related|\bprobably (related|caused)|\bplausible/)
  if (unrelated) notes.push('Causality: an alternative cause is described, which points to unrelated.')
  else if (related) notes.push('Causality: reads as related (dechallenge, no alternative cause, or similar).')
  else notes.push('Causality: not clear. Work through Naranjo or WHO-UMC on the Scales tab.')

  // Only show the readout when the text actually states at least one cue.
  if (!(serious || nonSerious || unexpected || expected || unrelated || related)) return undefined

  if (serious && unexpected && related) {
    notes.push(lifeThreat
      ? 'Putting it together: serious + unexpected + related looks like a SUSAR. Fatal or life-threatening cases are usually due in 7 days; other SUSARs in 15 days (clock starts at first awareness).'
      : 'Putting it together: serious + unexpected + related looks like a SUSAR, usually reportable within 15 days of first awareness.')
  } else if (serious || unexpected || related || nonSerious || expected || unrelated) {
    notes.push('Putting it together: expedited reporting needs all three of serious, unexpected and related. If any one is missing or unknown, it is routine or periodic reporting, or it needs more information first.')
  }
  return notes
}

export function classifyQuestion(question: string): ClassifyResult {
  const text = normalise(question)
  const scored = RULES.map((rule) => ({ rule, score: score(rule, text) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)

  const caseReading = readCase(text)

  if (scored.length === 0) {
    // A case with no topic words still gets the case reading.
    return caseReading
      ? { ...FALLBACK, category: 'Seriousness Criteria', confidence: 'Low', explanation: 'This reads like a case description rather than a question. Start by working out seriousness, expectedness and causality, which together decide reportability.', suggestedSection: 'Detective tab → classify a case step by step', caseReading }
      : FALLBACK
  }

  const [top, next] = scored
  const gap = next ? top.score / next.score : Infinity
  const confidence: ClassifyResult['confidence'] = top.score >= 4 && gap >= 1.5 ? 'High' : top.score >= 2 && gap > 1 ? 'Medium' : 'Low'
  const result: ClassifyResult = {
    category: top.rule.category,
    confidence,
    explanation: top.rule.why,
    suggestedSection: top.rule.section,
  }
  if (next && next.score >= 2) result.alsoRelevant = { category: next.rule.category, suggestedSection: next.rule.section }
  if (caseReading) result.caseReading = caseReading
  return result
}
