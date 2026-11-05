import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { api, useMutation, useQuery } from '@/lib/backend'
import { classifyQuestion } from '@/lib/classify'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  PV_CASES,
  THERAPEUTIC_AREAS,
  deriveReportingTimeline,
  deriveSUSAR,
  type PVCase,
  type Seriousness,
  type Expectedness,
  type Causality,
  type ReportingTimeline,
  type Difficulty,
} from '@/data/pv-cases'
import { generateCase, GEN_DRUGS, GEN_EVENTS } from '@/data/pv-generator'
import {
  REGULATORS,
  PRODUCT_CATEGORIES,
  NARANJO_QUESTIONS,
  naranjoCategory,
  WHO_UMC_CATEGORIES,
  HARTWIG_SEVERITY,
  SCHUMOCK_THORNTON_CRITERIA,
  SCHUMOCK_THORNTON_NOTE,
  RAWLINS_THOMPSON,
  RUCAM_DOMAINS,
  RUCAM_NOTE,
  BRADFORD_HILL,
  FRENCH_METHOD_NOTE,
  CASE_REGISTRATION_STEPS,
  INVALID_CASE_CRITERIA,
  INVALID_CASE_NOTE,
  SOLICITED_VS_UNSOLICITED,
  COMPLAINT_CLASSIFICATION_NOTE,
  CASE_RESOLUTION_NOTE,
  ICSR_VS_AGGREGATE,
  PSUR_PBRER_NOTE,
  DICTIONARY_QA,
  DICTIONARY_QUIZ,
  ATC_EXAMPLES,
  ICD10_EXAMPLES,
} from '@/data/pv-reference'
import {
  ICSR_BUILDER_CASES,
  SIGNAL_2X2_EXPLANATION,
  computeSignalStats,
  EVANS_CRITERIA_NOTE,
  RMP_NOTE,
  REMS_NOTE,
  CIOMS_FORM_SECTIONS,
  COUNTRY_FORMS,
  COUNTRY_FORMS_NOTE,
} from '@/data/pv-forms'

export const Route = createFileRoute('/')({ component: App })

const SERIOUSNESS_OPTIONS: Seriousness[] = ['Serious', 'Non-serious']
const EXPECTEDNESS_OPTIONS: Expectedness[] = ['Expected', 'Unexpected']
const CAUSALITY_OPTIONS: Causality[] = ['Related', 'Unrelated']
const TIMELINE_OPTIONS: ReportingTimeline[] = ['7-day', '15-day', 'Routine']

interface Answers {
  seriousness: Seriousness | null
  expectedness: Expectedness | null
  causality: Causality | null
  timeline: ReportingTimeline | null
}
const EMPTY_ANSWERS: Answers = { seriousness: null, expectedness: null, causality: null, timeline: null }

interface HistoryEntry {
  pvCase: PVCase
  answers: Answers
  submitted: boolean
}

type PracticeMode = 'curated' | 'endless'

interface Filters { area: string; difficulty: string; country: string; category: string }
const ALL_FILTERS: Filters = { area: 'All', difficulty: 'All', country: 'All', category: 'All' }

function pickCase(pool: PVCase[], excludeId: string | null): PVCase {
  const options = pool.length > 1 && excludeId ? pool.filter((c) => c.id !== excludeId) : pool
  return options[Math.floor(Math.random() * options.length)]
}

function computeCuratedPool(filters: Filters): PVCase[] {
  return PV_CASES.filter((c) =>
    (filters.area === 'All' || c.therapeuticArea === filters.area) &&
    (filters.difficulty === 'All' || c.difficulty === filters.difficulty) &&
    (filters.country === 'All' || c.country === filters.country) &&
    (filters.category === 'All' || c.productCategory === filters.category)
  )
}

function pickFilteredCase(mode: PracticeMode, pool: PVCase[], excludeId: string | null, filters: Filters): PVCase {
  if (mode === 'curated') return pickCase(pool.length > 0 ? pool : PV_CASES, excludeId)
  for (let i = 0; i < 30; i++) {
    const c = generateCase()
    if (
      (filters.area === 'All' || c.therapeuticArea === filters.area) &&
      (filters.difficulty === 'All' || c.difficulty === filters.difficulty) &&
      (filters.country === 'All' || c.country === filters.country) &&
      (filters.category === 'All' || c.productCategory === filters.category)
    ) {
      return c
    }
  }
  return generateCase()
}

function AnswerRow({ label, value, correct, isCorrect, reason }: { label: string; value: string; correct: string; isCorrect: boolean; reason: string }) {
  return (
    <div className={`rounded border p-2.5 ${isCorrect ? 'border-lab-emerald bg-lab-emerald-soft' : 'border-lab-red bg-lab-red-soft'}`}>
      <div className="flex items-center justify-between flex-wrap gap-1">
        <span className="text-xs font-mono text-lab-text-muted">{label}</span>
        <span className={`text-xs font-mono font-bold ${isCorrect ? 'text-lab-emerald' : 'text-lab-red'}`}>
          {isCorrect ? '✓ Correct' : `✗ You said ${value} — correct: ${correct}`}
        </span>
      </div>
      <p className="text-sm text-lab-text mt-1">{reason}</p>
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Button onClick={onClick} variant="outline" size="sm" className={`border-2 font-mono text-xs ${active ? 'border-lab-red text-lab-red' : 'border-lab-line text-lab-text-muted'}`}>
      {children}
    </Button>
  )
}

function downloadTextFile(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// History / badges / sync (localStorage + Convex sync code)
// ---------------------------------------------------------------------------

const PRACTICE_HISTORY_KEY = 'pvd_history_v1'
const SYNC_CODE_KEY = 'pvd_sync_code_v1'
const MAX_HISTORY = 300

interface PracticeEntry { ts: number; correct: number; total: number }

function loadPracticeHistory(): PracticeEntry[] {
  try {
    const raw = localStorage.getItem(PRACTICE_HISTORY_KEY)
    return raw ? (JSON.parse(raw) as PracticeEntry[]) : []
  } catch { return [] }
}
function savePracticeHistory(h: PracticeEntry[]) {
  try { localStorage.setItem(PRACTICE_HISTORY_KEY, JSON.stringify(h.slice(-MAX_HISTORY))) } catch { /* ignore */ }
}
function appendPracticeEntry(entry: PracticeEntry) {
  const h = loadPracticeHistory()
  h.push(entry)
  savePracticeHistory(h)
}
function loadSyncCode(): string | null {
  try { return localStorage.getItem(SYNC_CODE_KEY) } catch { return null }
}
function saveSyncCode(code: string) {
  try { localStorage.setItem(SYNC_CODE_KEY, code) } catch { /* ignore */ }
}

interface Badge { key: string; label: string; icon: string; earned: boolean; hint: string }
function computeBadges(history: PracticeEntry[]): Badge[] {
  const totalCases = history.length
  const totalCorrect = history.reduce((s, h) => s + h.correct, 0)
  const totalDims = history.reduce((s, h) => s + h.total, 0)
  const perfectRounds = history.filter((h) => h.total > 0 && h.correct === h.total).length
  return [
    { key: 'first', label: 'First Case', icon: '🔎', earned: totalCases >= 1, hint: 'Submit 1 case assessment' },
    { key: 'ten', label: 'Ten Cases', icon: '🗂️', earned: totalCases >= 10, hint: `Review 10 cases (${totalCases}/10)` },
    { key: 'fifty', label: 'Fifty Cases', icon: '📚', earned: totalCases >= 50, hint: `Review 50 cases (${totalCases}/50)` },
    { key: 'perfect5', label: 'Perfect Streak', icon: '🏆', earned: perfectRounds >= 5, hint: `5 perfect (4/4) rounds (${perfectRounds}/5)` },
    { key: 'century', label: 'Century Club', icon: '💯', earned: totalDims >= 100, hint: `100 dimensions correct total (${totalCorrect}/${totalDims || 1})` },
  ]
}

function HistoryTab() {
  const [history, setHistory] = useState<PracticeEntry[]>(() => (typeof window !== 'undefined' ? loadPracticeHistory() : []))
  const [syncCode, setSyncCode] = useState<string | null>(() => (typeof window !== 'undefined' ? loadSyncCode() : null))
  const [syncCodeInput, setSyncCodeInput] = useState('')
  const [syncBusy, setSyncBusy] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [pullTarget, setPullTarget] = useState<string | null>(null)

  const generateSyncCode = useMutation(api.sync.generate)
  const pushSync = useMutation(api.sync.push)
  const pullResult = useQuery(api.sync.pull, pullTarget ? { code: pullTarget } : 'skip')

  useEffect(() => {
    if (pullResult === undefined || pullResult === null) return
    try {
      const pulled = JSON.parse(pullResult.historyJson) as PracticeEntry[]
      savePracticeHistory(pulled)
      setHistory(pulled)
      if (pullTarget) { saveSyncCode(pullTarget); setSyncCode(pullTarget) }
      setSyncMessage(`Loaded ${pulled.length} rounds from code ${pullTarget}.`)
    } catch {
      setSyncMessage('Could not read data from that code.')
    }
    setSyncBusy(false)
    setPullTarget(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pullResult])

  async function handleGenerateSync() {
    setSyncBusy(true)
    setSyncMessage(null)
    try {
      const code = await generateSyncCode({})
      saveSyncCode(code)
      setSyncCode(code)
      await pushSync({ code, historyJson: JSON.stringify(loadPracticeHistory()) })
      setSyncMessage('Sync code created and your current history pushed.')
    } catch {
      setSyncMessage('Could not generate a sync code — try again.')
    }
    setSyncBusy(false)
  }
  function handlePullSync() {
    const code = syncCodeInput.trim().toUpperCase()
    if (code.length < 4) return
    setSyncBusy(true)
    setSyncMessage(null)
    setPullTarget(code)
  }

  const badges = computeBadges(history)
  const totalCorrect = history.reduce((s, h) => s + h.correct, 0)
  const totalDims = history.reduce((s, h) => s + h.total, 0)
  const accuracy = totalDims > 0 ? Math.round((totalCorrect / totalDims) * 100) : 0

  return (
    <div className="space-y-4">
      <Card className="bg-lab-panel border-lab-line">
        <CardContent className="pt-4 grid grid-cols-2 gap-3">
          <div><p className="text-xs font-mono text-lab-text-muted">Cases reviewed</p><p className="text-2xl font-mono text-lab-red">{history.length}</p></div>
          <div><p className="text-xs font-mono text-lab-text-muted">Overall accuracy</p><p className="text-2xl font-mono text-lab-red">{accuracy}%</p></div>
        </CardContent>
      </Card>
      <Card className="bg-lab-panel border-lab-line">
        <CardHeader className="pb-2"><CardTitle className="font-mono text-sm text-lab-text-muted">Achievements</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {badges.map((b) => (
              <div key={b.key} className={`rounded-md border p-2 text-center ${b.earned ? 'border-lab-gold bg-lab-gold-soft' : 'border-lab-line opacity-40'}`} title={b.hint}>
                <div className="text-xl">{b.icon}</div>
                <p className="text-[10px] font-mono text-lab-text mt-1">{b.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="bg-lab-panel border-lab-line">
        <CardHeader className="pb-2"><CardTitle className="font-mono text-sm text-lab-text-muted">Sync across devices</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-lab-text-muted">No account needed — a short code links this device\u2019s history to any other device. Anyone with the code can view it.</p>
          {syncCode ? (
            <div className="rounded-md border border-lab-gold bg-lab-gold-soft p-2 flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm font-mono text-lab-gold">Your sync code: <span className="font-bold">{syncCode}</span></p>
              <Button onClick={() => navigator.clipboard?.writeText(syncCode)} size="sm" variant="outline" className="border-2 border-lab-gold text-lab-gold font-mono">Copy</Button>
            </div>
          ) : (
            <Button onClick={handleGenerateSync} disabled={syncBusy} size="sm" className="bg-lab-red text-white hover:bg-lab-red/90 font-mono">{syncBusy ? 'Generating…' : 'Generate my sync code'}</Button>
          )}
          <div className="flex gap-2">
            <Input value={syncCodeInput} onChange={(e) => setSyncCodeInput(e.target.value.toUpperCase())} placeholder="Enter a code from another device" maxLength={8} className="bg-lab-panel-strong border-lab-line text-lab-text font-mono" />
            <Button onClick={handlePullSync} disabled={syncBusy || syncCodeInput.trim().length < 4} variant="outline" className="border-2 border-lab-line font-mono">Load</Button>
          </div>
          {syncMessage && <p className="text-xs font-mono text-lab-text-muted">{syncMessage}</p>}
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Detective tab
// ---------------------------------------------------------------------------

function DetectiveTab() {
  const [mode, setMode] = useState<PracticeMode>('curated')
  const [filters, setFilters] = useState<Filters>(ALL_FILTERS)

  const pool = useMemo(() => computeCuratedPool(filters), [filters])

  // Start from a fixed case so the prerendered HTML matches the first client render,
  // then swap in a random case once mounted.
  const [history, setHistory] = useState<HistoryEntry[]>(() => [{ pvCase: PV_CASES[0], answers: EMPTY_ANSWERS, submitted: false }])
  useEffect(() => {
    setHistory((h) => (h.length === 1 && !h[0].submitted ? [{ pvCase: pickCase(PV_CASES, null), answers: EMPTY_ANSWERS, submitted: false }] : h))
  }, [])
  const [historyIndex, setHistoryIndex] = useState(0)
  const entry = history[historyIndex]
  const current = entry.pvCase

  const [sessionCorrect, setSessionCorrect] = useState(0)
  const [sessionTotal, setSessionTotal] = useState(0)
  const [casesReviewed, setCasesReviewed] = useState(0)
  const [playerName, setPlayerName] = useState('')
  const [scoreSubmitted, setScoreSubmitted] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [sessionLog, setSessionLog] = useState<{ case: PVCase; answers: Answers; correctCount: number }[]>([])

  const leaderboard = useQuery(api.leaderboard.top, {})
  const submitScore = useMutation(api.leaderboard.submit)

  const derivedTimeline = useMemo(() => deriveReportingTimeline(current), [current])
  const derivedSUSAR = useMemo(() => deriveSUSAR(current), [current])
  const answers = entry.answers
  const allAnswered = answers.seriousness && answers.expectedness && answers.causality && answers.timeline

  const country = REGULATORS.find((r) => r.key === current.country)
  const category = PRODUCT_CATEGORIES.find((p) => p.key === current.productCategory)

  function updateEntry(patch: Partial<HistoryEntry>) {
    setHistory((prev) => prev.map((e, i) => (i === historyIndex ? { ...e, ...patch } : e)))
  }

  function selectAnswer<K extends keyof Answers>(key: K, value: Answers[K]) {
    if (entry.submitted) return
    updateEntry({ answers: { ...answers, [key]: value } })
  }

  function refreshCaseWithFilters(newFilters: Filters, newMode: PracticeMode = mode) {
    const newPool = computeCuratedPool(newFilters)
    const newCase = pickFilteredCase(newMode, newPool, null, newFilters)
    setHistory([{ pvCase: newCase, answers: EMPTY_ANSWERS, submitted: false }])
    setHistoryIndex(0)
  }

  function setFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    const next = { ...filters, [key]: value }
    setFilters(next)
    refreshCaseWithFilters(next)
  }

  function switchMode(next: PracticeMode) {
    if (next === mode) return
    setMode(next)
    refreshCaseWithFilters(filters, next)
  }

  function submit() {
    if (!allAnswered) return
    let correctCount = 0
    if (answers.seriousness === current.correctSeriousness) correctCount++
    if (answers.expectedness === current.correctExpectedness) correctCount++
    if (answers.causality === current.correctCausality) correctCount++
    if (answers.timeline === derivedTimeline.timeline) correctCount++
    setSessionCorrect((c) => c + correctCount)
    setSessionTotal((t) => t + 4)
    setCasesReviewed((n) => n + 1)
    setSessionLog((prev) => [...prev, { case: current, answers, correctCount }])
    appendPracticeEntry({ ts: Date.now(), correct: correctCount, total: 4 })
    updateEntry({ submitted: true })
  }

  function goNext() {
    if (historyIndex === history.length - 1) {
      const next: HistoryEntry = { pvCase: pickFilteredCase(mode, pool, current.id, filters), answers: EMPTY_ANSWERS, submitted: false }
      setHistory((prev) => [...prev, next])
      setHistoryIndex((i) => i + 1)
    } else {
      setHistoryIndex((i) => i + 1)
    }
  }

  function goPrev() {
    if (historyIndex > 0) setHistoryIndex((i) => i - 1)
  }

  function resetSession() {
    setSessionCorrect(0)
    setSessionTotal(0)
    setCasesReviewed(0)
    setScoreSubmitted(false)
    setSessionLog([])
  }

  async function handleSubmitScore() {
    const name = playerName.trim()
    if (!name || scoreSubmitted || casesReviewed < 5) return
    setScoreSubmitted(true)
    try {
      await submitScore({ name, correctDimensions: sessionCorrect, totalDimensions: sessionTotal, casesReviewed })
    } catch {
      setScoreSubmitted(false)
    }
  }

  function downloadReport() {
    const lines: string[] = []
    lines.push('Pharmacovigilance Detective — Session Report')
    lines.push(`Cases reviewed: ${casesReviewed} · Dimensions correct: ${sessionCorrect}/${sessionTotal}`)
    lines.push('')
    sessionLog.forEach((entry, i) => {
      lines.push(`Case ${i + 1}: ${entry.case.drugName} — ${entry.case.therapeuticArea} (${entry.correctCount}/4 correct)`)
      lines.push(`  ${entry.case.narrative}`)
      lines.push(`  Your answers: Seriousness=${entry.answers.seriousness}, Expectedness=${entry.answers.expectedness}, Causality=${entry.answers.causality}, Timeline=${entry.answers.timeline}`)
      lines.push(`  Correct: Seriousness=${entry.case.correctSeriousness}, Expectedness=${entry.case.correctExpectedness}, Causality=${entry.case.correctCausality}`)
      lines.push('')
    })
    lines.push('All drug names and case reports are entirely fictional, for educational use only.')
    lines.push('built by Khan Gulrez Shagufa Fazal Ahmed')
    downloadTextFile('pharmacovigilance-detective-session-report.txt', lines.join('\n'))
  }

  const canSubmitScore = casesReviewed >= 5
  const accuracy = sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button onClick={() => switchMode('curated')} variant="outline" className={`flex-1 border-2 font-mono text-xs ${mode === 'curated' ? 'border-lab-red text-lab-red' : 'border-lab-line text-lab-text-muted'}`}>Curated Cases (46)</Button>
        <Button onClick={() => switchMode('endless')} variant="outline" className={`flex-1 border-2 font-mono text-xs ${mode === 'endless' ? 'border-lab-violet text-lab-violet' : 'border-lab-line text-lab-text-muted'}`}>Endless Practice (1000+)</Button>
      </div>
      {mode === 'endless' && (
        <p className="text-xs font-mono text-lab-violet">Combinatorially generated from {GEN_DRUGS.length} drug classes × {GEN_EVENTS.length} adverse event types × 2 expectedness branches × 2 causality branches × randomized demographics — comfortably over 1000 distinct combinations, each correctly classified on the fly, never a fixed repeating list.</p>
      )}
      <p className="text-[10px] font-mono text-lab-text-muted">Tip: clicking any filter below immediately loads a new matching case — it doesn't affect the case you've already started answering, but it does replace it.</p>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs font-mono text-lab-text-muted">session: {sessionCorrect}/{sessionTotal} dimensions correct ({accuracy}%) · {casesReviewed} case{casesReviewed === 1 ? '' : 's'}</span>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={downloadReport} disabled={sessionLog.length === 0} variant="ghost" size="sm" className="border border-lab-line text-lab-text-muted font-mono">⬇ Report</Button>
          <Button onClick={resetSession} variant="ghost" size="sm" className="border border-lab-line text-lab-text-muted font-mono">Reset session</Button>
          <Button onClick={() => setShowLeaderboard((v) => !v)} variant="ghost" size="sm" className="border border-lab-line text-lab-text-muted font-mono">Leaderboard</Button>
        </div>
      </div>

      {showLeaderboard && (
        <Card className="bg-lab-panel border-lab-line">
          <CardContent className="pt-4 space-y-3">
            <div className="flex gap-2">
              <Input value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Your name" maxLength={24} className="bg-lab-panel-strong border-lab-line text-lab-text" />
              <Button onClick={handleSubmitScore} disabled={!playerName.trim() || !canSubmitScore || scoreSubmitted} className="bg-lab-red text-white hover:bg-lab-red/90 font-mono">
                {scoreSubmitted ? 'Submitted' : 'Submit'}
              </Button>
            </div>
            {!canSubmitScore && <p className="text-xs text-lab-text-muted font-mono">Review at least 5 cases before submitting a score.</p>}
            <p className="text-xs uppercase tracking-widest text-lab-blue font-mono">Top detectives (by accuracy)</p>
            {leaderboard === undefined ? (
              <p className="text-sm text-lab-text-muted">Loading…</p>
            ) : leaderboard.length === 0 ? (
              <p className="text-sm text-lab-text-muted">No scores yet — be the first.</p>
            ) : (
              <ol className="space-y-1">
                {leaderboard.map((e, i) => (
                  <li key={e._id} className="flex justify-between text-sm font-mono">
                    <span className="text-lab-text-muted">{i + 1}. {e.name}</span>
                    <span className="text-lab-text">{e.pct.toFixed(0)}% ({e.correctDimensions}/{e.totalDimensions}, {e.casesReviewed} cases)</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          <Button onClick={() => setFilter('area', 'All')} variant="outline" size="sm" className={`border-2 font-mono text-[11px] ${filters.area === 'All' ? 'border-lab-red text-lab-red' : 'border-lab-line text-lab-text-muted'}`}>All areas</Button>
          {(mode === 'curated' ? THERAPEUTIC_AREAS : Array.from(new Set(GEN_DRUGS.map((d) => d.therapeuticArea)))).map((a) => (
            <Button key={a} onClick={() => setFilter('area', a)} variant="outline" size="sm" className={`border-2 font-mono text-[11px] ${filters.area === a ? 'border-lab-red text-lab-red' : 'border-lab-line text-lab-text-muted'}`}>{a}</Button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {(['All', 'Straightforward', 'Subtle'] as const).map((d) => (
            <Button key={d} onClick={() => setFilter('difficulty', d)} variant="outline" size="sm" className={`border-2 font-mono ${filters.difficulty === d ? 'border-lab-gold text-lab-gold' : 'border-lab-line text-lab-text-muted'}`}>{d}</Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button onClick={() => setFilter('country', 'All')} variant="outline" size="sm" className={`border-2 font-mono text-[11px] ${filters.country === 'All' ? 'border-lab-blue text-lab-blue' : 'border-lab-line text-lab-text-muted'}`}>All countries</Button>
          {(mode === 'curated' ? Array.from(new Set(PV_CASES.map((c) => c.country))) : REGULATORS.map((r) => r.key)).map((key) => {
            const r = REGULATORS.find((x) => x.key === key)
            return <Button key={key} onClick={() => setFilter('country', key)} variant="outline" size="sm" className={`border-2 font-mono text-[11px] ${filters.country === key ? 'border-lab-blue text-lab-blue' : 'border-lab-line text-lab-text-muted'}`}>{r?.name ?? key}</Button>
          })}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button onClick={() => setFilter('category', 'All')} variant="outline" size="sm" className={`border-2 font-mono text-[11px] ${filters.category === 'All' ? 'border-lab-violet text-lab-violet' : 'border-lab-line text-lab-text-muted'}`}>All product types</Button>
          {(mode === 'curated' ? Array.from(new Set(PV_CASES.map((c) => c.productCategory))) : Array.from(new Set(GEN_DRUGS.map((d) => d.productCategory)))).map((key) => {
            const p = PRODUCT_CATEGORIES.find((x) => x.key === key)
            return <Button key={key} onClick={() => setFilter('category', key)} variant="outline" size="sm" className={`border-2 font-mono text-[11px] ${filters.category === key ? 'border-lab-violet text-lab-violet' : 'border-lab-line text-lab-text-muted'}`}>{p?.label ?? key}</Button>
          })}
        </div>
      </div>

      <Card className="border-2 border-lab-line bg-lab-panel">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <span className="text-[10px] font-mono text-lab-red uppercase tracking-wide">{current.therapeuticArea} · {current.difficulty}</span>
            <span className="text-[10px] font-mono text-lab-text-muted">{country?.name ?? current.country} · {category?.label ?? current.productCategory}</span>
          </div>
          <CardTitle className="font-mono text-base text-lab-text leading-relaxed font-normal">{current.narrative}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded border border-lab-line bg-lab-panel-strong p-3">
            <p className="text-[10px] font-mono uppercase tracking-wide text-lab-text-muted mb-1">Reference safety information for {current.drugName}</p>
            <p className="text-sm text-lab-text">{current.referenceSafetyInfo.join(', ')}</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div>
          <p className="text-xs font-mono text-lab-text-muted mb-1">Seriousness</p>
          <div className="flex gap-2">
            {SERIOUSNESS_OPTIONS.map((o) => (
              <Button key={o} onClick={() => selectAnswer('seriousness', o)} disabled={entry.submitted} variant="outline" className={`flex-1 border-2 font-mono ${answers.seriousness === o ? 'border-lab-red text-lab-red bg-lab-red-soft' : 'border-lab-line text-lab-text-muted'}`}>{o}</Button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-mono text-lab-text-muted mb-1">Expectedness</p>
          <div className="flex gap-2">
            {EXPECTEDNESS_OPTIONS.map((o) => (
              <Button key={o} onClick={() => selectAnswer('expectedness', o)} disabled={entry.submitted} variant="outline" className={`flex-1 border-2 font-mono ${answers.expectedness === o ? 'border-lab-gold text-lab-gold bg-lab-gold-soft' : 'border-lab-line text-lab-text-muted'}`}>{o}</Button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-mono text-lab-text-muted mb-1">Causality (to the suspect drug)</p>
          <div className="flex gap-2">
            {CAUSALITY_OPTIONS.map((o) => (
              <Button key={o} onClick={() => selectAnswer('causality', o)} disabled={entry.submitted} variant="outline" className={`flex-1 border-2 font-mono ${answers.causality === o ? 'border-lab-blue text-lab-blue bg-lab-blue-soft' : 'border-lab-line text-lab-text-muted'}`}>{o}</Button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-mono text-lab-text-muted mb-1">Correct reporting timeline</p>
          <div className="flex gap-2">
            {TIMELINE_OPTIONS.map((o) => (
              <Button key={o} onClick={() => selectAnswer('timeline', o)} disabled={entry.submitted} variant="outline" className={`flex-1 border-2 font-mono ${answers.timeline === o ? 'border-lab-emerald text-lab-emerald bg-lab-emerald-soft' : 'border-lab-line text-lab-text-muted'}`}>{o}</Button>
            ))}
          </div>
        </div>
      </div>

      {!entry.submitted ? (
        <Button onClick={submit} disabled={!allAnswered} className="w-full bg-lab-red text-white hover:bg-lab-red/90 font-mono">
          {allAnswered ? 'Submit Assessment' : 'Answer all four dimensions to continue'}
        </Button>
      ) : (
        <div className="space-y-3" style={{ animation: 'stampIn 0.35s ease-out' }}>
          <AnswerRow label="Seriousness" value={answers.seriousness!} correct={current.correctSeriousness} isCorrect={answers.seriousness === current.correctSeriousness} reason={current.seriousnessReason} />
          <AnswerRow label="Expectedness" value={answers.expectedness!} correct={current.correctExpectedness} isCorrect={answers.expectedness === current.correctExpectedness} reason={current.expectednessReason} />
          <AnswerRow label="Causality" value={answers.causality!} correct={current.correctCausality} isCorrect={answers.causality === current.correctCausality} reason={current.causalityReason} />
          <AnswerRow label="Reporting timeline" value={answers.timeline!} correct={derivedTimeline.timeline} isCorrect={answers.timeline === derivedTimeline.timeline} reason={derivedTimeline.reason} />
          <div className={`rounded border p-2.5 ${derivedSUSAR.isSUSAR ? 'border-lab-violet bg-lab-violet-soft' : 'border-lab-line bg-lab-panel-strong'}`}>
            <span className="text-xs font-mono font-bold text-lab-violet">{derivedSUSAR.isSUSAR ? '⚠ This is a SUSAR' : 'Not a SUSAR'}</span>
            <p className="text-sm text-lab-text mt-1">{derivedSUSAR.reason}</p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={goPrev} disabled={historyIndex === 0} variant="outline" className="flex-1 border-2 border-lab-line font-mono">← Previous case</Button>
        <Button onClick={goNext} disabled={!entry.submitted} className="flex-1 bg-lab-gold text-lab-bg hover:bg-lab-gold/90 font-mono">Next case →</Button>
      </div>
      <p className="text-center text-[10px] font-mono text-lab-text-muted">case {historyIndex + 1} of {history.length} viewed this session</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Scales tab
// ---------------------------------------------------------------------------

function NaranjoCalculator() {
  const [answersMap, setAnswersMap] = useState<Record<string, 'yes' | 'no' | 'unknown' | null>>({})
  const score = NARANJO_QUESTIONS.reduce((sum, q) => {
    const a = answersMap[q.id]
    if (a === 'yes') return sum + q.yes
    if (a === 'no') return sum + q.no
    if (a === 'unknown') return sum + q.unknown
    return sum
  }, 0)
  const allAnswered = NARANJO_QUESTIONS.every((q) => answersMap[q.id])

  return (
    <Card className="bg-lab-panel border-lab-line">
      <CardHeader className="pb-2">
        <CardTitle className="font-mono text-sm text-lab-red">Naranjo Adverse Drug Reaction Probability Scale</CardTitle>
        <CardDescription className="text-xs text-lab-text-muted">Answer all 10 questions about a real or hypothetical case to get a causality score. ≥9 Definite · 5-8 Probable · 1-4 Possible · ≤0 Doubtful.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {NARANJO_QUESTIONS.map((q) => (
          <div key={q.id} className="space-y-1">
            <p className="text-sm text-lab-text">{q.question}</p>
            <div className="flex gap-2">
              {(['yes', 'no', 'unknown'] as const).map((opt) => (
                <Button key={opt} onClick={() => setAnswersMap((prev) => ({ ...prev, [q.id]: opt }))} size="sm" variant="outline" className={`flex-1 border-2 font-mono text-xs capitalize ${answersMap[q.id] === opt ? 'border-lab-red text-lab-red bg-lab-red-soft' : 'border-lab-line text-lab-text-muted'}`}>{opt} ({opt === 'yes' ? q.yes : opt === 'no' ? q.no : q.unknown >= 0 ? '+' + q.unknown : q.unknown})</Button>
              ))}
            </div>
          </div>
        ))}
        {allAnswered && (
          <div className="rounded border-2 border-lab-gold bg-lab-gold-soft p-3 text-center" style={{ animation: 'stampIn 0.3s ease-out' }}>
            <p className="text-2xl font-mono text-lab-gold">{score}</p>
            <p className="text-sm font-mono text-lab-text">{naranjoCategory(score)}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ScalesTab() {
  return (
    <div className="space-y-4">
      <NaranjoCalculator />
      <Card className="bg-lab-panel border-lab-line">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-sm text-lab-blue">WHO-UMC Causality Categories</CardTitle>
          <CardDescription className="text-xs text-lab-text-muted">The Uppsala Monitoring Centre's standard causality assessment categories, used globally.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {WHO_UMC_CATEGORIES.map((c) => (
            <div key={c.category} className="rounded border border-lab-line p-2">
              <p className="font-mono font-bold text-lab-blue text-sm">{c.category}</p>
              <p className="text-xs text-lab-text-muted mt-1">{c.criteria}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="bg-lab-panel border-lab-line">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-sm text-lab-emerald">Hartwig Severity Assessment Scale</CardTitle>
          <CardDescription className="text-xs text-lab-text-muted">Grades how severe a reaction was, not whether it was caused by the drug.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {HARTWIG_SEVERITY.map((h) => (
            <div key={h.level} className="flex gap-2 text-sm">
              <span className="font-mono font-bold text-lab-emerald w-16 shrink-0">{h.level}</span>
              <span className="text-lab-text-muted">{h.description}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="bg-lab-panel border-lab-line">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-sm text-lab-gold">Schumock &amp; Thornton Preventability Criteria</CardTitle>
          <CardDescription className="text-xs text-lab-text-muted">{SCHUMOCK_THORNTON_NOTE}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1.5 text-sm text-lab-text list-disc list-inside">
            {SCHUMOCK_THORNTON_CRITERIA.map((c, i) => <li key={i}>{c.question}</li>)}
          </ul>
        </CardContent>
      </Card>
      <Card className="bg-lab-panel border-lab-line">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-sm text-lab-magenta">Rawlins-Thompson Classification (ABCDEF)</CardTitle>
          <CardDescription className="text-xs text-lab-text-muted">Classifies adverse drug reactions by mechanism/pattern rather than by causality or severity.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {RAWLINS_THOMPSON.map((r) => (
            <div key={r.code} className="rounded border border-lab-line p-2">
              <p className="font-mono font-bold text-lab-magenta text-sm">{r.code} — {r.name}</p>
              <p className="text-xs text-lab-text-muted mt-1">{r.description}</p>
              <p className="text-xs text-lab-text mt-1 italic">Example: {r.example}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="bg-lab-panel border-lab-line">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-sm text-lab-red">RUCAM (Drug-Induced Liver Injury)</CardTitle>
          <CardDescription className="text-xs text-lab-text-muted">{RUCAM_NOTE}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {RUCAM_DOMAINS.map((d) => (
            <div key={d.domain} className="rounded border border-lab-line p-2">
              <p className="font-mono font-bold text-lab-red text-sm">{d.domain}</p>
              <p className="text-xs text-lab-text-muted mt-1">{d.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="bg-lab-panel border-lab-line">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-sm text-lab-blue">Bradford Hill Criteria (Signal-Level Causality)</CardTitle>
          <CardDescription className="text-xs text-lab-text-muted">A population-level framework, used in signal evaluation rather than individual-case assessment.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {BRADFORD_HILL.map((c) => (
            <div key={c.criterion} className="rounded border border-lab-line p-2">
              <p className="font-mono font-bold text-lab-blue text-sm">{c.criterion}</p>
              <p className="text-xs text-lab-text-muted mt-1">{c.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="bg-lab-panel border-lab-line">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-sm text-lab-emerald">French Method (French: Méthode française)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-lab-text">{FRENCH_METHOD_NOTE}</p>
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Lifecycle tab
// ---------------------------------------------------------------------------

function LifecycleTab() {
  return (
    <div className="space-y-4">
      <Card className="bg-lab-panel border-lab-line">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-sm text-lab-red">The Full Case-Resolution Workflow (16 steps)</CardTitle>
          <CardDescription className="text-xs text-lab-text-muted">From first contact through post-closure signal feed, including the validity and follow-up branches.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {CASE_REGISTRATION_STEPS.map((s) => (
            <div key={s.title} className="rounded border border-lab-line p-2">
              <p className="font-mono font-bold text-lab-red text-sm">{s.title}</p>
              <p className="text-xs text-lab-text-muted mt-1">{s.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="bg-lab-panel border-lab-line">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-sm text-lab-gold">Cases That Get Rejected (Invalid ICSRs)</CardTitle>
          <CardDescription className="text-xs text-lab-text-muted">{INVALID_CASE_NOTE}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1.5 text-sm text-lab-text list-disc list-inside">
            {INVALID_CASE_CRITERIA.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </CardContent>
      </Card>
      <Card className="bg-lab-panel border-lab-line">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-sm text-lab-blue">How Complaints Get Classified</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-lab-text">{COMPLAINT_CLASSIFICATION_NOTE}</p>
        </CardContent>
      </Card>
      <Card className="bg-lab-panel border-lab-line">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-sm text-lab-emerald">Solicited vs. Unsolicited Cases</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div><p className="font-mono font-bold text-lab-emerald text-sm">Solicited</p><p className="text-sm text-lab-text-muted">{SOLICITED_VS_UNSOLICITED.solicited}</p></div>
          <div><p className="font-mono font-bold text-lab-emerald text-sm">Unsolicited</p><p className="text-sm text-lab-text-muted">{SOLICITED_VS_UNSOLICITED.unsolicited}</p></div>
        </CardContent>
      </Card>
      <Card className="bg-lab-panel border-lab-line">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-sm text-lab-violet">How Cases Are Resolved (Summary)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-lab-text">{CASE_RESOLUTION_NOTE}</p>
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Aggregate tab (+ signal detection, + RMP/REMS)
// ---------------------------------------------------------------------------

function SignalCalculator() {
  const [a, setA] = useState('12')
  const [b, setB] = useState('88')
  const [c, setC] = useState('45')
  const [d, setD] = useState('9855')
  const stats = useMemo(() => computeSignalStats(Number(a) || 0, Number(b) || 0, Number(c) || 0, Number(d) || 0), [a, b, c, d])

  return (
    <Card className="bg-lab-panel border-lab-line">
      <CardHeader className="pb-2">
        <CardTitle className="font-mono text-sm text-lab-magenta">Signal Detection Calculator (PRR / ROR / IC)</CardTitle>
        <CardDescription className="text-xs text-lab-text-muted">{SIGNAL_2X2_EXPLANATION}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div><p className="text-[10px] font-mono text-lab-text-muted mb-1">a — drug + event</p><Input value={a} onChange={(e) => setA(e.target.value)} className="bg-lab-panel-strong border-lab-line text-lab-text font-mono" /></div>
          <div><p className="text-[10px] font-mono text-lab-text-muted mb-1">b — drug + other events</p><Input value={b} onChange={(e) => setB(e.target.value)} className="bg-lab-panel-strong border-lab-line text-lab-text font-mono" /></div>
          <div><p className="text-[10px] font-mono text-lab-text-muted mb-1">c — other drugs + event</p><Input value={c} onChange={(e) => setC(e.target.value)} className="bg-lab-panel-strong border-lab-line text-lab-text font-mono" /></div>
          <div><p className="text-[10px] font-mono text-lab-text-muted mb-1">d — other drugs + other events</p><Input value={d} onChange={(e) => setD(e.target.value)} className="bg-lab-panel-strong border-lab-line text-lab-text font-mono" /></div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded border border-lab-line p-2"><p className="text-[10px] font-mono text-lab-text-muted">PRR</p><p className="text-lg font-mono text-lab-magenta">{isNaN(stats.prr) ? '—' : stats.prr.toFixed(2)}</p></div>
          <div className="rounded border border-lab-line p-2"><p className="text-[10px] font-mono text-lab-text-muted">ROR</p><p className="text-lg font-mono text-lab-magenta">{isNaN(stats.ror) ? '—' : stats.ror.toFixed(2)}</p></div>
          <div className="rounded border border-lab-line p-2"><p className="text-[10px] font-mono text-lab-text-muted">IC</p><p className="text-lg font-mono text-lab-magenta">{isNaN(stats.ic) ? '—' : stats.ic.toFixed(2)}</p></div>
        </div>
        <p className="text-xs text-lab-text-muted">{EVANS_CRITERIA_NOTE}</p>
      </CardContent>
    </Card>
  )
}

function AggregateTab() {
  return (
    <div className="space-y-4">
      <Card className="bg-lab-panel border-lab-line">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-sm text-lab-red">ICSR vs. Aggregate Reporting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div><p className="font-mono font-bold text-lab-red text-sm">Individual Case Safety Report (ICSR)</p><p className="text-sm text-lab-text-muted">{ICSR_VS_AGGREGATE.icsr}</p></div>
          <div><p className="font-mono font-bold text-lab-red text-sm">Aggregate Report</p><p className="text-sm text-lab-text-muted">{ICSR_VS_AGGREGATE.aggregate}</p></div>
        </CardContent>
      </Card>
      <Card className="bg-lab-panel border-lab-line">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-sm text-lab-gold">PSUR / PBRER</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-lab-text">{PSUR_PBRER_NOTE}</p>
        </CardContent>
      </Card>
      <SignalCalculator />
      <Card className="bg-lab-panel border-lab-line">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-sm text-lab-blue">Risk Management Plan (RMP)</CardTitle>
        </CardHeader>
        <CardContent><p className="text-sm text-lab-text">{RMP_NOTE}</p></CardContent>
      </Card>
      <Card className="bg-lab-panel border-lab-line">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-sm text-lab-emerald">REMS (Risk Evaluation and Mitigation Strategy)</CardTitle>
        </CardHeader>
        <CardContent><p className="text-sm text-lab-text">{REMS_NOTE}</p></CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Dictionaries tab
// ---------------------------------------------------------------------------

function DictionariesTab() {
  const [quizIndex, setQuizIndex] = useState(0)
  const [guess, setGuess] = useState<number | null>(null)
  const q = DICTIONARY_QUIZ[quizIndex]

  return (
    <div className="space-y-4">
      <Card className="bg-lab-panel border-lab-line">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-sm text-lab-blue">MedDRA / WHODrug / ICD-10</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {DICTIONARY_QA.map((qa) => (
            <div key={qa.question}>
              <p className="font-mono font-bold text-lab-blue text-sm">{qa.question}</p>
              <p className="text-sm text-lab-text-muted mt-1">{qa.answer}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="bg-lab-panel border-lab-line">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-sm text-lab-gold">Real ATC Classification Codes</CardTitle>
          <CardDescription className="text-xs text-lab-text-muted">The Anatomical Therapeutic Chemical system is a genuine, public WHO classification — these codes are real, matched here to the fictional drug classes used elsewhere in this app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {ATC_EXAMPLES.map((a) => (
            <div key={a.code} className="flex justify-between text-sm font-mono">
              <span className="text-lab-gold">{a.code}</span>
              <span className="text-lab-text-muted">{a.className}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="bg-lab-panel border-lab-line">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-sm text-lab-emerald">Real ICD-10 Codes (common examples)</CardTitle>
          <CardDescription className="text-xs text-lab-text-muted">A small set of well-established, high-confidence codes, used for teaching illustration.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {ICD10_EXAMPLES.map((c) => (
            <div key={c.code} className="flex justify-between text-sm font-mono">
              <span className="text-lab-emerald">{c.code}</span>
              <span className="text-lab-text-muted">{c.description}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="bg-lab-panel border-2 border-lab-violet">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-sm text-lab-violet">Quick Quiz: which dictionary?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-lab-text">{q.question}</p>
          <div className="grid grid-cols-1 gap-2">
            {q.options.map((opt, i) => (
              <Button key={opt} onClick={() => setGuess(i)} disabled={guess !== null} variant="outline" className={`border-2 font-mono ${guess === i ? (i === q.correctIndex ? 'border-lab-emerald text-lab-emerald bg-lab-emerald-soft' : 'border-lab-red text-lab-red bg-lab-red-soft') : 'border-lab-line text-lab-text-muted'}`}>{opt}</Button>
            ))}
          </div>
          {guess !== null && (
            <div style={{ animation: 'fadeInUp 0.2s ease-out' }} className="space-y-2">
              <p className={`text-sm font-mono font-bold ${guess === q.correctIndex ? 'text-lab-emerald' : 'text-lab-red'}`}>{guess === q.correctIndex ? 'Correct!' : `Not quite — it's ${q.options[q.correctIndex]}`}</p>
              <p className="text-sm text-lab-text">{q.explanation}</p>
              <Button onClick={() => { setQuizIndex((i) => (i + 1) % DICTIONARY_QUIZ.length); setGuess(null) }} className="w-full bg-lab-violet text-lab-bg hover:bg-lab-violet/90 font-mono">Next →</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Regulators tab (+ quiz)
// ---------------------------------------------------------------------------

function RegulatorQuiz() {
  const [round, setRound] = useState(() => {
    const target = REGULATORS[Math.floor(Math.random() * REGULATORS.length)]
    const distractors = REGULATORS.filter((r) => r.key !== target.key).sort(() => Math.random() - 0.5).slice(0, 2)
    const options = [target, ...distractors].sort(() => Math.random() - 0.5)
    return { target, options }
  })
  const [guess, setGuess] = useState<string | null>(null)

  function next() {
    const target = REGULATORS[Math.floor(Math.random() * REGULATORS.length)]
    const distractors = REGULATORS.filter((r) => r.key !== target.key).sort(() => Math.random() - 0.5).slice(0, 2)
    const options = [target, ...distractors].sort(() => Math.random() - 0.5)
    setRound({ target, options })
    setGuess(null)
  }

  return (
    <Card className="bg-lab-panel border-2 border-lab-gold">
      <CardHeader className="pb-2">
        <CardTitle className="font-mono text-sm text-lab-gold">Which Regulator? Quiz</CardTitle>
        <CardDescription className="text-xs text-lab-text-muted">Which authority runs this pharmacovigilance program?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-lab-text">{round.target.pvNote}</p>
        <div className="grid grid-cols-1 gap-2">
          {round.options.map((o) => (
            <Button key={o.key} onClick={() => setGuess(o.key)} disabled={guess !== null} variant="outline" className={`border-2 font-mono ${guess === o.key ? (o.key === round.target.key ? 'border-lab-emerald text-lab-emerald bg-lab-emerald-soft' : 'border-lab-red text-lab-red bg-lab-red-soft') : 'border-lab-line text-lab-text-muted'}`}>{o.name}</Button>
          ))}
        </div>
        {guess !== null && (
          <div style={{ animation: 'fadeInUp 0.2s ease-out' }} className="space-y-2">
            <p className={`text-sm font-mono font-bold ${guess === round.target.key ? 'text-lab-emerald' : 'text-lab-red'}`}>{guess === round.target.key ? 'Correct!' : `Not quite — it's ${round.target.name}`}</p>
            <Button onClick={next} className="w-full bg-lab-gold text-lab-bg hover:bg-lab-gold/90 font-mono">Next →</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function RegulatorsTab() {
  const regions = Array.from(new Set(REGULATORS.map((r) => r.region)))
  return (
    <div className="space-y-4">
      <RegulatorQuiz />
      <Card className="bg-lab-panel border-lab-line">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-sm text-lab-red">Regulatory &amp; Pharmacovigilance Bodies</CardTitle>
          <CardDescription className="text-xs text-lab-text-muted">21 regulators, each with the national pharmacovigilance database or program they run.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {regions.map((region) => (
            <div key={region}>
              <p className="text-[10px] uppercase tracking-widest font-mono text-lab-text-muted mb-1">{region}</p>
              <div className="space-y-2">
                {REGULATORS.filter((r) => r.region === region).map((r) => (
                  <div key={r.key} className="rounded border border-lab-line p-2">
                    <p className="font-mono font-bold text-sm" style={{ color: r.color }}>{r.name}</p>
                    <p className="text-xs text-lab-text-muted mt-1">{r.pvNote}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="bg-lab-panel border-lab-line">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-sm text-lab-violet">Product Categories</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1.5">
          {PRODUCT_CATEGORIES.map((c) => (
            <span key={c.key} className="text-xs font-mono px-2 py-1 rounded bg-lab-panel-strong text-lab-text-muted">{c.label}</span>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Builder tab (ICSR matching exercise)
// ---------------------------------------------------------------------------

function BuilderTab() {
  const [index, setIndex] = useState(0)
  const [event, setEvent] = useState<string | null>(null)
  const [product, setProduct] = useState<string | null>(null)
  const [diagnosis, setDiagnosis] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)
  const c = ICSR_BUILDER_CASES[index]

  const allSelected = event && product && diagnosis
  const eventCorrect = event === c.correctEvent
  const productCorrect = product === c.correctProduct
  const diagnosisCorrect = diagnosis === c.correctDiagnosis

  function next() {
    setIndex((i) => (i + 1) % ICSR_BUILDER_CASES.length)
    setEvent(null); setProduct(null); setDiagnosis(null); setChecked(false)
  }

  return (
    <Card className="bg-lab-panel border-lab-line">
      <CardHeader className="pb-2">
        <CardTitle className="font-mono text-sm text-lab-red">Build the ICSR</CardTitle>
        <CardDescription className="text-xs text-lab-text-muted">Read the narrative, then assign the correct MedDRA-style event term, WHODrug-style product, and ICD-10-style diagnosis (the indication/history, not the event).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-lab-text">{c.narrative}</p>

        <div>
          <p className="text-xs font-mono text-lab-gold mb-1">MedDRA event term</p>
          <div className="flex flex-col gap-1.5">
            {c.eventOptions.map((o) => (
              <Button key={o} onClick={() => setEvent(o)} disabled={checked} variant="outline" size="sm" className={`border-2 font-mono text-xs justify-start ${event === o ? 'border-lab-gold text-lab-gold bg-lab-gold-soft' : 'border-lab-line text-lab-text-muted'}`}>{o}</Button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-mono text-lab-blue mb-1">WHODrug product</p>
          <div className="flex flex-col gap-1.5">
            {c.productOptions.map((o) => (
              <Button key={o} onClick={() => setProduct(o)} disabled={checked} variant="outline" size="sm" className={`border-2 font-mono text-xs justify-start ${product === o ? 'border-lab-blue text-lab-blue bg-lab-blue-soft' : 'border-lab-line text-lab-text-muted'}`}>{o}</Button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-mono text-lab-emerald mb-1">ICD-10 diagnosis / indication</p>
          <div className="flex flex-col gap-1.5">
            {c.diagnosisOptions.map((o) => (
              <Button key={o} onClick={() => setDiagnosis(o)} disabled={checked} variant="outline" size="sm" className={`border-2 font-mono text-xs justify-start ${diagnosis === o ? 'border-lab-emerald text-lab-emerald bg-lab-emerald-soft' : 'border-lab-line text-lab-text-muted'}`}>{o}</Button>
            ))}
          </div>
        </div>

        {!checked ? (
          <Button onClick={() => setChecked(true)} disabled={!allSelected} className="w-full bg-lab-red text-white hover:bg-lab-red/90 font-mono">Check</Button>
        ) : (
          <div className="space-y-2" style={{ animation: 'stampIn 0.3s ease-out' }}>
            <p className={`text-sm font-mono ${eventCorrect ? 'text-lab-emerald' : 'text-lab-red'}`}>Event: {eventCorrect ? '✓ correct' : `✗ correct answer was ${c.correctEvent}`}</p>
            <p className={`text-sm font-mono ${productCorrect ? 'text-lab-emerald' : 'text-lab-red'}`}>Product: {productCorrect ? '✓ correct' : `✗ correct answer was ${c.correctProduct}`}</p>
            <p className={`text-sm font-mono ${diagnosisCorrect ? 'text-lab-emerald' : 'text-lab-red'}`}>Diagnosis: {diagnosisCorrect ? '✓ correct' : `✗ correct answer was ${c.correctDiagnosis}`}</p>
            <Button onClick={next} className="w-full bg-lab-gold text-lab-bg hover:bg-lab-gold/90 font-mono">Next case →</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Forms tab (annotated CIOMS/E2B form anatomy + country forms)
// ---------------------------------------------------------------------------

const SECTION_COLORS = ['hsl(var(--lab-red))', 'hsl(var(--lab-gold))', 'hsl(var(--lab-blue))', 'hsl(var(--lab-emerald))']

function AnnotatedFormDiagram() {
  const W = 380
  const H = 460
  const formX = 20
  const formW = 190
  const bandH = 90
  const bandGap = 8
  const bandY = (i: number) => 20 + i * (bandH + bandGap)
  const calloutX = formX + formW + 60

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[420px] h-auto mx-auto">
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="hsl(var(--lab-text-muted))" />
          </marker>
        </defs>
        {CIOMS_FORM_SECTIONS.map((s, i) => (
          <g key={s.id}>
            <rect x={formX} y={bandY(i)} width={formW} height={bandH} rx={6} fill="hsl(var(--lab-panel-strong))" stroke={SECTION_COLORS[i]} strokeWidth={2} />
            <text x={formX + 8} y={bandY(i) + 16} fontSize={9} fontWeight="bold" fill={SECTION_COLORS[i]} className="font-mono">{s.title}</text>
            {s.fields.slice(0, 3).map((f, fi) => (
              <text key={fi} x={formX + 8} y={bandY(i) + 30 + fi * 12} fontSize={7} fill="hsl(var(--lab-text-muted))" className="font-mono">• {f.length > 26 ? f.slice(0, 24) + '…' : f}</text>
            ))}
            <line x1={calloutX - 6} y1={bandY(i) + bandH / 2} x2={formX + formW + 4} y2={bandY(i) + bandH / 2} stroke="hsl(var(--lab-text-muted))" strokeWidth={1.5} markerEnd="url(#arrowhead)" />
            <text x={calloutX} y={bandY(i) + bandH / 2 - 4} fontSize={8} fontWeight="bold" fill={SECTION_COLORS[i]} className="font-mono">{i + 1}</text>
          </g>
        ))}
      </svg>
      <div className="space-y-2 mt-2">
        {CIOMS_FORM_SECTIONS.map((s, i) => (
          <p key={s.id} className="text-xs text-lab-text-muted"><span className="font-mono font-bold" style={{ color: SECTION_COLORS[i] }}>{i + 1}.</span> {s.explanation}</p>
        ))}
      </div>
    </div>
  )
}

function FormsTab() {
  return (
    <div className="space-y-4">
      <Card className="bg-lab-panel border-lab-line">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-sm text-lab-red">Universal ICSR Form Anatomy</CardTitle>
          <CardDescription className="text-xs text-lab-text-muted">Based on the CIOMS I form / ICH E2B structure — almost every national ADR form, whatever it's called locally, is organized around these same four sections. Arrows point from each numbered explanation to the section it describes.</CardDescription>
        </CardHeader>
        <CardContent>
          <AnnotatedFormDiagram />
        </CardContent>
      </Card>
      <Card className="bg-lab-panel border-lab-line">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-sm text-lab-blue">Country-by-Country Reporting Forms</CardTitle>
          <CardDescription className="text-xs text-lab-text-muted">{COUNTRY_FORMS_NOTE}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {COUNTRY_FORMS.map((f) => {
            const r = REGULATORS.find((x) => x.key === f.key)
            return (
              <div key={f.key} className={`rounded border p-2 ${f.detailed ? 'border-lab-gold' : 'border-lab-line'}`}>
                <p className="font-mono font-bold text-sm" style={{ color: r?.color }}>{r?.name ?? f.key}{f.detailed && <span className="ml-2 text-[9px] text-lab-gold">(documented)</span>}</p>
                <p className="text-xs text-lab-text mt-1"><span className="text-lab-text-muted">Form:</span> {f.formName}</p>
                <p className="text-xs text-lab-text-muted mt-1"><span className="text-lab-text-muted">Channel:</span> {f.channel}</p>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Ask tab (keyword question classifier)
// ---------------------------------------------------------------------------

function AskTab() {
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState<{ category: string; confidence: string; explanation: string; suggestedSection: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClassify() {
    if (!question.trim() || loading) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      setResult(classifyQuestion(question.trim()))
    } catch {
      setError('Could not classify that right now — try again in a moment.')
    }
    setLoading(false)
  }

  return (
    <Card className="bg-lab-panel border-lab-line">
      <CardHeader className="pb-2">
        <CardTitle className="font-mono text-sm text-lab-red">Ask the Detective</CardTitle>
        <CardDescription className="text-xs text-lab-text-muted">Paste a pharmacovigilance question or case snippet, and a keyword-based classifier will identify what type of PV question it is and point you to the right section of this app. It matches the words in your question against each topic, so phrasing matters — and it classifies, it doesn't replace a real qualified assessment.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. 'A patient developed a rash 2 weeks after starting a new drug, not listed on the label — how do I code this and does it need expedited reporting?'"
          className="w-full min-h-24 rounded border border-lab-line bg-lab-panel-strong text-lab-text text-sm p-3 font-sans"
        />
        <Button onClick={handleClassify} disabled={!question.trim() || loading} className="w-full bg-lab-red text-white hover:bg-lab-red/90 font-mono">
          {loading ? 'Classifying…' : 'Classify this question'}
        </Button>
        {error && <p className="text-sm text-lab-red">{error}</p>}
        {result && (
          <div className="rounded border-2 border-lab-gold bg-lab-gold-soft p-3 space-y-1" style={{ animation: 'stampIn 0.3s ease-out' }}>
            <p className="font-mono font-bold text-lab-gold">{result.category} <span className="text-xs text-lab-text-muted">({result.confidence} confidence)</span></p>
            <p className="text-sm text-lab-text">{result.explanation}</p>
            <p className="text-xs font-mono text-lab-text-muted">→ {result.suggestedSection}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

type Tab = 'detective' | 'scales' | 'lifecycle' | 'aggregate' | 'dictionaries' | 'regulators' | 'builder' | 'forms' | 'history' | 'ask'

function App() {
  const [tab, setTab] = useState<Tab>('detective')

  return (
    <div className="min-h-screen bg-lab-bg text-lab-text">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-widest font-mono text-lab-red">Pharmacovigilance Detective</p>
          <h1 className="text-xl font-mono font-bold text-lab-text">Classify the case</h1>
          <p className="text-sm text-lab-text-muted">Practice case classification, explore every major PV scale and framework, and ask your own questions.</p>
        </header>

        <div className="flex flex-wrap gap-2">
          <TabButton active={tab === 'detective'} onClick={() => setTab('detective')}>Detective</TabButton>
          <TabButton active={tab === 'builder'} onClick={() => setTab('builder')}>Build ICSR</TabButton>
          <TabButton active={tab === 'scales'} onClick={() => setTab('scales')}>Scales</TabButton>
          <TabButton active={tab === 'lifecycle'} onClick={() => setTab('lifecycle')}>Case Lifecycle</TabButton>
          <TabButton active={tab === 'aggregate'} onClick={() => setTab('aggregate')}>Aggregate Reporting</TabButton>
          <TabButton active={tab === 'dictionaries'} onClick={() => setTab('dictionaries')}>Dictionaries</TabButton>
          <TabButton active={tab === 'forms'} onClick={() => setTab('forms')}>Forms</TabButton>
          <TabButton active={tab === 'regulators'} onClick={() => setTab('regulators')}>Regulators</TabButton>
          <TabButton active={tab === 'history'} onClick={() => setTab('history')}>History</TabButton>
          <TabButton active={tab === 'ask'} onClick={() => setTab('ask')}>Ask</TabButton>
        </div>

        {tab === 'detective' && <DetectiveTab />}
        {tab === 'builder' && <BuilderTab />}
        {tab === 'scales' && <ScalesTab />}
        {tab === 'lifecycle' && <LifecycleTab />}
        {tab === 'aggregate' && <AggregateTab />}
        {tab === 'dictionaries' && <DictionariesTab />}
        {tab === 'forms' && <FormsTab />}
        {tab === 'regulators' && <RegulatorsTab />}
        {tab === 'history' && <HistoryTab />}
        {tab === 'ask' && <AskTab />}

        <p className="text-center text-xs text-lab-text-muted font-mono">All drug names and case reports are entirely fictional, for educational use only.</p>
        <p className="text-center text-xs text-lab-text-muted font-mono">built by Khan Gulrez Shagufa Fazal Ahmed</p>
      </div>
    </div>
  )
}

