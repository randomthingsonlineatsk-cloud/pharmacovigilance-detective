// Study SAEs: the four serious adverse events of the HRP-301 (VERDANT-1) trial, assessed the way a
// sponsor's safety team does before deciding whether each is a SUSAR. Expectedness is judged
// against the reference safety information (RSI) in section 7 of the lumiravostat Investigator's
// Brochure, edition 3. The cases come from the CDM Query & Edit-Check Console's locked database
// and safety cases, and export as the file the CSR & Narrative Studio reads.
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TRIAL_CASES_FILE } from '@/data/trial-cases'

const RSI = [
  { term: 'Upper respiratory tract infection', frequency: 'very common (12%)' },
  { term: 'Alanine aminotransferase increased', frequency: 'common (3%)' },
]
type Q = 'onTime' | 'serious' | 'expected' | 'related' | 'susar' | 'clock'
const QUESTIONS: { id: Q; label: string; options: string[] }[] = [
  { id: 'onTime', label: 'Did the investigator report it to the sponsor within 24 hours of becoming aware?', options: ['Yes', 'No'] },
  { id: 'serious', label: 'Is it serious?', options: ['Serious', 'Non-serious'] },
  { id: 'expected', label: 'Is it expected, against the RSI in the Investigator’s Brochure?', options: ['Expected', 'Unexpected'] },
  { id: 'related', label: 'Is there a reasonable possibility that study drug caused it (in either the investigator’s or the sponsor’s opinion)?', options: ['Related', 'Not related'] },
  { id: 'susar', label: 'After unblinding: is it a SUSAR?', options: ['SUSAR', 'Not a SUSAR'] },
  { id: 'clock', label: 'Expedited report to the regulators and ethics committees?', options: ['Within 7 days', 'Within 15 days', 'Not expedited: annual safety report'] },
]
const days = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5)
type C = (typeof TRIAL_CASES_FILE.cases)[number]
const armOf = (c: C) => c.e2b['G.k.2.2 medicinal product as reported'].replace(/^Blinded study drug \(unblinded: (.*)\)$/, '$1')
const related = (c: C) => c.causality !== 'NOT RELATED' || c.sponsorCausality !== 'NOT RELATED'
const expected = (c: C) => RSI.some((r) => r.term.toLowerCase() === c.e2b['E.i.2.1b reaction (study medical dictionary preferred term)'].toLowerCase())
const placebo = (c: C) => /placebo/i.test(armOf(c))
const fatalOrLt = (c: C) => (c.criteria as readonly string[]).some((x) => x === 'AESDTH' || x === 'AESLIFE')

function key(c: C): Record<Q, { answer: string; why: string }> {
  const late = days(c.aware, c.received)
  const susar = !expected(c) && related(c) && !placebo(c)
  return {
    onTime: late <= 1 ? { answer: 'Yes', why: `Aware ${c.aware}, received by the sponsor ${c.received}: within a day.` } : { answer: 'No', why: `Aware ${c.aware}, received by the sponsor ${c.received}: ${late} days late. Investigators report SAEs to the sponsor immediately, within 24 hours (ICH E6(R3); EU CTR Article 41). A late report is a protocol deviation and shortens the sponsor’s own clock.` },
    serious: { answer: 'Serious', why: `Seriousness criteria: ${c.e2b['E.i.3.2 seriousness'].join(', ')}.` },
    expected: expected(c) ? { answer: 'Expected', why: `${c.e2b['E.i.2.1b reaction (study medical dictionary preferred term)']} is listed in the RSI.` } : { answer: 'Unexpected', why: `${c.e2b['E.i.2.1b reaction (study medical dictionary preferred term)']} is not in the RSI, which lists only upper respiratory tract infection and ALT increased. The IB’s other sections (for example the class risk of hepatitis B reactivation) do not make an event expected: only the RSI does.` },
    related: related(c) ? { answer: 'Related', why: `Investigator: ${c.causality.toLowerCase()}; sponsor: ${c.sponsorCausality.toLowerCase()}. Either opinion of a reasonable possibility makes it a suspected adverse reaction; the sponsor cannot downgrade the investigator’s assessment.` } : { answer: 'Not related', why: 'Both the investigator and the sponsor assessed it as not related.' },
    susar: susar ? { answer: 'SUSAR', why: `Serious, unexpected and suspected; unblinding shows ${armOf(c)}, an active dose.` } : { answer: 'Not a SUSAR', why: placebo(c) && related(c) && !expected(c) ? `Serious, unexpected and suspected, but unblinding shows placebo: a reaction to placebo is not a suspected reaction to the investigational product, so it is not reported as a SUSAR (it stays in the annual safety report).` : 'At least one SUSAR criterion is missing (serious, unexpected and suspected related).' },
    clock: susar ? (fatalOrLt(c) ? { answer: 'Within 7 days', why: 'Fatal or life-threatening SUSAR: 7 days from awareness, with follow-up within 8 more days.' } : { answer: 'Within 15 days', why: `SUSAR, not fatal or life-threatening: 15 days from the sponsor’s awareness (EU CTR Article 42; 21 CFR 312.32 for an IND). Day 0 ${c.received}, due by ${new Date(Date.parse(c.received) + 15 * 864e5).toISOString().slice(0, 10)}.` }) : { answer: 'Not expedited: annual safety report', why: 'Not a SUSAR: it goes in the annual safety report (DSUR) line listings.' },
  }
}

export function TrialTab() {
  const cases = TRIAL_CASES_FILE.cases
  const [i, setI] = useState(0)
  const [ans, setAns] = useState<Record<string, Partial<Record<Q, string>>>>({})
  const [done, setDone] = useState<Record<string, boolean>>({})
  const c = cases[i], k = key(c), a = ans[c.caseId] ?? {}, shown = !!done[c.caseId]
  const score = cases.filter((x) => done[x.caseId]).reduce((n, x) => n + QUESTIONS.filter((q) => (ans[x.caseId] ?? {})[q.id] === key(x)[q.id].answer).length, 0)
  const download = () => {
    const blob = new Blob([JSON.stringify(TRIAL_CASES_FILE, null, 1)], { type: 'application/json' })
    const el = document.createElement('a'); el.href = URL.createObjectURL(blob); el.download = 'HRP-301-sae-cases-for-the-csr.json'; el.click(); setTimeout(() => URL.revokeObjectURL(el.href), 1000)
  }
  return (
    <div className="space-y-4">
      <Card className="bg-lab-panel border-2 border-lab-blue">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-sm text-lab-blue">Study SAEs: HRP-301 (VERDANT-1)</CardTitle>
          <CardDescription className="text-xs text-lab-text-muted">Four serious adverse events from a blinded phase 3 trial of lumiravostat (fictional) in chronic hand eczema. Decide for each what a sponsor’s safety team decides: was it reported on time, is it expected against the reference safety information, is it suspected, and after unblinding, is it a SUSAR and by when must it be reported?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <p className="font-mono text-lab-text">Reference safety information (IB edition 3, section 7): {RSI.map((r) => `${r.term} (${r.frequency})`).join('; ')}.</p>
          <div className="flex flex-wrap gap-2">{cases.map((x, n) => <Button key={x.caseId} size="sm" variant="outline" onClick={() => setI(n)} className={`border-2 font-mono text-xs ${n === i ? 'border-lab-blue text-lab-blue' : done[x.caseId] ? 'border-lab-emerald text-lab-emerald' : 'border-lab-line text-lab-text-muted'}`}>{x.caseId}</Button>)}</div>
          <p className="font-mono text-lab-text-muted">Score: {score} of {cases.filter((x) => done[x.caseId]).length * QUESTIONS.length} on the cases checked.</p>
        </CardContent>
      </Card>
      <Card className="bg-lab-panel border-lab-line">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-sm text-lab-text">{c.caseId}: {c.term}</CardTitle>
          <CardDescription className="text-xs text-lab-text-muted">Participant {c.usubjid} · onset {c.onset} (study day {c.e2b['study day of onset']}) · site aware {c.aware} · sponsor received {c.received}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-lab-text whitespace-pre-wrap">{c.e2b['H.1 case narrative'].replace(/\((?:Placebo|Lumiravostat \d+ mg)\)/, '(blinded)').replace(/randomised to (?:Placebo|Lumiravostat \d+ mg) and took the first dose of (?:placebo|Lumiravostat \d+ mg)/, 'randomised to blinded study drug and took the first dose')}</p>
          {QUESTIONS.map((q) => (
            <div key={q.id} className="space-y-1">
              <p className="text-xs font-mono text-lab-text">{q.label}</p>
              <div className="flex flex-wrap gap-2">{q.options.map((o) => {
                const picked = a[q.id] === o, right = k[q.id].answer === o
                return <Button key={o} size="sm" variant="outline" disabled={shown} onClick={() => setAns({ ...ans, [c.caseId]: { ...a, [q.id]: o } })} className={`border-2 font-mono text-xs ${shown ? (right ? 'border-lab-emerald text-lab-emerald' : picked ? 'border-lab-red text-lab-red' : 'border-lab-line text-lab-text-muted') : picked ? 'border-lab-blue text-lab-blue' : 'border-lab-line text-lab-text-muted'}`}>{o}</Button>
              })}</div>
              {shown && <p className={`text-xs ${a[q.id] === k[q.id].answer ? 'text-lab-emerald' : 'text-lab-red'}`}>{k[q.id].why}</p>}
            </div>
          ))}
          {shown && <p className="text-xs font-mono text-lab-gold">Unblinded treatment: {armOf(c)}.</p>}
          {!shown ? <Button disabled={QUESTIONS.some((q) => !a[q.id])} onClick={() => setDone({ ...done, [c.caseId]: true })} className="w-full bg-lab-blue text-lab-bg hover:bg-lab-blue/90 font-mono">Unblind and check</Button>
            : <Button onClick={() => setI((i + 1) % cases.length)} className="w-full bg-lab-gold text-lab-bg hover:bg-lab-gold/90 font-mono">Next case →</Button>}
        </CardContent>
      </Card>
      <Card className="bg-lab-panel border-lab-line">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-sm text-lab-text">For the clinical study report</CardTitle>
          <CardDescription className="text-xs text-lab-text-muted">The medical writer checks each SAE narrative in the CSR against its safety case. This file carries the four cases, shaped after ICH E2B(R3) (report from study, seriousness, outcome, both causality assessments, action taken, case narrative), in the format the CSR &amp; Narrative Studio reads.</CardDescription>
        </CardHeader>
        <CardContent><Button onClick={download} variant="outline" className="border-2 border-lab-line font-mono text-xs">Export the cases for the CSR (.json)</Button></CardContent>
      </Card>
    </div>
  )
}
