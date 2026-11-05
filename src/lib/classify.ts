// Keyword-based question classifier for the "Ask the Detective" tab. It runs
// entirely in the browser (no AI service, no network): each category has a set
// of phrases, and the category with the most matches wins.

export interface ClassifyResult {
  category: string
  confidence: 'High' | 'Medium' | 'Low'
  explanation: string
  suggestedSection: string
}

interface Rule {
  category: string
  keywords: string[]
  why: string
  section: string
}

const RULES: Rule[] = [
  {
    category: 'Seriousness Criteria',
    keywords: ['serious', 'seriousness', 'hospital', 'hospitalis', 'hospitaliz', 'life-threatening', 'life threatening', 'disability', 'congenital', 'birth defect', 'fatal', 'death', 'died', 'medically important', 'prolong'],
    why: 'The question is about whether an event meets the seriousness criteria (death, life-threatening, hospitalization, disability, congenital anomaly, or another medically important event).',
    section: 'Detective tab → the Seriousness step on any case',
  },
  {
    category: 'Expectedness / Listedness',
    keywords: ['expected', 'unexpected', 'listed', 'unlisted', 'label', 'reference safety', 'core data sheet', 'ccds', 'investigator brochure', 'smpc', 'uspi', 'package insert'],
    why: 'The question is about whether an event is already described in the reference safety information, which decides expected versus unexpected.',
    section: 'Detective tab → the Expectedness step on any case',
  },
  {
    category: 'Causality Assessment',
    keywords: ['causal', 'causality', 'related', 'naranjo', 'who-umc', 'who umc', 'rucam', 'dechallenge', 'rechallenge', 'alternative cause', 'bradford', 'imputab', 'probable', 'possible', 'drug-induced', 'liver injury'],
    why: 'The question is about how likely the drug is to have caused the event, which is what structured causality scales are for.',
    section: 'Scales tab → Naranjo, WHO-UMC and RUCAM',
  },
  {
    category: 'SUSAR / Reporting Timeline',
    keywords: ['susar', 'expedited', '7-day', '7 day', '15-day', '15 day', 'deadline', 'timeline', 'clock', 'day 0', 'submit within', 'how soon', 'due date'],
    why: 'The question is about whether a case needs expedited reporting and how many days the sponsor or company has to submit it.',
    section: 'Detective tab → the Reporting Timeline step, then Case Lifecycle',
  },
  {
    category: 'Coding (MedDRA / WHODrug / ICD-10)',
    keywords: ['meddra', 'whodrug', 'who drug', 'icd', 'preferred term', 'llt', 'soc', 'code ', 'coding', 'atc', 'dictionary', 'hlt', 'hlgt'],
    why: 'The question is about coding events, drugs or diagnoses to a standard dictionary.',
    section: 'Dictionaries tab',
  },
  {
    category: 'Aggregate Reporting (ICSR vs PSUR/PBRER)',
    keywords: ['psur', 'pbrer', 'aggregate', 'periodic', 'dsur', 'signal', 'prr', 'ror', 'disproportionality', 'benefit-risk', 'benefit risk', 'rmp', 'rems', 'risk management'],
    why: 'The question is about summarizing safety data over time, detecting signals, or managing risk at the product level rather than a single case.',
    section: 'Aggregate Reporting tab',
  },
  {
    category: 'Case Validity & Registration',
    keywords: ['valid', 'validity', 'minimum criteria', 'four criteria', '4 criteria', 'identifiable', 'incomplete', 'duplicate', 'register', 'registration', 'follow-up', 'follow up', 'intake', 'receipt', 'case closure'],
    why: 'The question is about whether a report is a valid ICSR and how it moves through intake, duplicate checking and follow-up.',
    section: 'Case Lifecycle tab → Case Registration',
  },
  {
    category: 'Solicited vs Unsolicited',
    keywords: ['solicited', 'unsolicited', 'spontaneous', 'patient support', 'registry', 'market research', 'literature', 'social media', 'compassionate', 'named patient'],
    why: 'The question is about the source of the report and whether it was actively collected or arrived spontaneously.',
    section: 'Case Lifecycle tab → Solicited vs Unsolicited',
  },
  {
    category: 'Regulatory Requirement (country-specific)',
    keywords: ['fda', 'ema', 'mhra', 'cdsco', 'pvpi', 'pmda', 'tga', 'health canada', 'swissmedic', 'eudravigilance', 'faers', 'medwatch', 'yellow card', 'vigibase', 'country', 'regulator', 'authority'],
    why: 'The question is about the requirements or reporting channels of a specific regulatory authority.',
    section: 'Regulators tab and Forms tab',
  },
]

const FALLBACK: ClassifyResult = {
  category: 'Other / General Pharmacovigilance',
  confidence: 'Low',
  explanation: "This doesn't clearly match one specific topic. Try rephrasing it as a question about a particular case or concept (for example seriousness, causality or reporting timelines).",
  suggestedSection: 'Case Lifecycle tab or the Dictionaries tab',
}

export function classifyQuestion(question: string): ClassifyResult {
  const text = ` ${question.toLowerCase()} `
  let best: { rule: Rule; score: number } | null = null
  let second = 0
  for (const rule of RULES) {
    const score = rule.keywords.reduce((n, k) => (text.includes(k) ? n + 1 : n), 0)
    if (score === 0) continue
    if (!best || score > best.score) {
      if (best) second = best.score
      best = { rule, score }
    } else if (score > second) {
      second = score
    }
  }
  if (!best) return FALLBACK
  const confidence = best.score >= 2 && best.score > second ? 'High' : best.score > second ? 'Medium' : 'Low'
  return { category: best.rule.category, confidence, explanation: best.rule.why, suggestedSection: best.rule.section }
}
