import { useMemo, useState } from 'react'
import {
  generateInterviewKit,
  type InterviewAiResult,
  type QuestionBankItem,
} from '../services/interviewAi'

const LEVELS = ['Junior', 'Mid', 'Senior', 'Staff', 'Director'] as const

type Rating = 'strong' | 'mixed' | 'weak' | ''

interface QuestionNote {
  text: string
  rating: Rating
}

function questionKey(prefix: string, index: number) {
  return `${prefix}-${index}`
}

function buildNotesExport(params: {
  candidateName: string
  jobTitle: string
  level: string
  questions: { key: string; category: string; question: string }[]
  notes: Record<string, QuestionNote>
  overallNotes: string
}) {
  const { candidateName, jobTitle, level, questions, notes, overallNotes } = params
  const lines = [
    `Interview notes — ${level} ${jobTitle}`,
    `Candidate: ${candidateName || '(not set)'}`,
    `Date: ${new Date().toLocaleDateString()}`,
    '',
  ]

  for (const q of questions) {
    const note = notes[q.key]
    lines.push(`## ${q.category}`)
    lines.push(`Q: ${q.question}`)
    if (note?.rating) lines.push(`Rating: ${note.rating}`)
    lines.push(`Notes: ${note?.text?.trim() || '(none)'}`)
    lines.push('')
  }

  if (overallNotes.trim()) {
    lines.push('## Overall assessment')
    lines.push(overallNotes.trim())
    lines.push('')
  }

  return lines.join('\n')
}

function QuestionCard({
  q,
  index,
  noteKey,
  note,
  onNoteChange,
  showNote = true,
  compact = false,
}: {
  q: QuestionBankItem
  index: number
  noteKey: string
  note?: QuestionNote
  onNoteChange: (key: string, patch: Partial<QuestionNote>) => void
  showNote?: boolean
  compact?: boolean
}) {
  return (
    <article
      className="q-item"
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      <div className="cat">{q.category}</div>
      <p className="q">{q.question}</p>
      {!compact && (
        <p className="why">
          <strong>Why it matters:</strong> {q.whyItMatters}
        </p>
      )}
      {!compact && q.followUps?.length > 0 && (
        <>
          <p className="fu" style={{ marginTop: 8 }}>
            <strong>Follow-ups</strong>
          </p>
          <ul>
            {q.followUps.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </>
      )}
      {showNote && (
        <div className="note-block">
          <div className="note-header">
            <label htmlFor={`note-${noteKey}`}>Your notes</label>
            <div className="rating-seg" role="group" aria-label="Answer rating">
              {(
                [
                  ['strong', 'Strong'],
                  ['mixed', 'Mixed'],
                  ['weak', 'Weak'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={note?.rating === value ? `active ${value}` : value}
                  onClick={() =>
                    onNoteChange(noteKey, {
                      rating: note?.rating === value ? '' : value,
                    })
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <textarea
            id={`note-${noteKey}`}
            className="note-input"
            rows={compact ? 3 : 2}
            placeholder="Capture what they said, signals, follow-ups to dig into…"
            value={note?.text ?? ''}
            onChange={(e) => onNoteChange(noteKey, { text: e.target.value })}
          />
        </div>
      )}
    </article>
  )
}

export function InterviewTools() {
  const [jobTitle, setJobTitle] = useState('Software Engineer')
  const [level, setLevel] = useState<string>('Senior')
  const [focus, setFocus] = useState('System design, mentoring, stakeholder communication')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<InterviewAiResult | null>(null)
  const [tab, setTab] = useState<'bank' | 'guide' | 'notes'>('bank')
  const [candidateName, setCandidateName] = useState('')
  const [notes, setNotes] = useState<Record<string, QuestionNote>>({})
  const [overallNotes, setOverallNotes] = useState('')
  const [copyMsg, setCopyMsg] = useState<string | null>(null)

  const noteableQuestions = useMemo(() => {
    if (!result) return []
    return result.questionBank.map((q, i) => ({
      key: questionKey('bank', i),
      category: q.category,
      question: q.question,
      item: q,
    }))
  }, [result])

  const notesFilled = useMemo(
    () =>
      Object.values(notes).filter((n) => n.text.trim() || n.rating).length +
      (overallNotes.trim() ? 1 : 0),
    [notes, overallNotes],
  )

  function updateNote(key: string, patch: Partial<QuestionNote>) {
    setNotes((prev) => ({
      ...prev,
      [key]: {
        text: prev[key]?.text ?? '',
        rating: prev[key]?.rating ?? '',
        ...patch,
      },
    }))
  }

  function clearNotes() {
    setNotes({})
    setOverallNotes('')
    setCandidateName('')
    setCopyMsg(null)
  }

  async function copyNotes() {
    if (!result) return
    const text = buildNotesExport({
      candidateName,
      jobTitle,
      level,
      questions: noteableQuestions,
      notes,
      overallNotes,
    })
    await navigator.clipboard.writeText(text)
    setCopyMsg('Notes copied to clipboard')
    setTimeout(() => setCopyMsg(null), 2000)
  }

  function downloadNotes() {
    if (!result) return
    const text = buildNotesExport({
      candidateName,
      jobTitle,
      level,
      questions: noteableQuestions,
      notes,
      overallNotes,
    })
    const slug = (candidateName || 'candidate').replace(/\s+/g, '-').toLowerCase()
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `interview-notes-${slug}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function onGenerate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const kit = await generateInterviewKit({
        jobTitle: jobTitle.trim(),
        level,
        focus: focus.trim() || undefined,
      })
      setResult(kit)
      setNotes({})
      setOverallNotes('')
      setTab('bank')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="interview-layout">
      <aside className="panel">
        <h2>Interview kit</h2>
        <p className="sub">Role-specific question banks and a structured guide for hiring teams</p>
        <form className="form-stack" onSubmit={(e) => void onGenerate(e)}>
          <div className="field">
            <label htmlFor="jobTitle">Job title</label>
            <input
              id="jobTitle"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Product Manager"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="level">Level</label>
            <select id="level" value={level} onChange={(e) => setLevel(e.target.value)}>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="focus">Focus areas (optional)</label>
            <textarea
              id="focus"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="Skills, competencies, or interview goals"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading || !jobTitle.trim()}>
            {loading ? 'Generating…' : 'Generate interview kit'}
          </button>
        </form>
      </aside>

      <div className="results-stack">
        {error && <div className="alert">{error}</div>}

        {!result && !loading && (
          <section className="panel empty-state">
            <h3>Ready when you are</h3>
            <p>
              Enter a job title and level to produce a question bank plus a 45–60 minute interview
              guide with scorecard signals.
            </p>
          </section>
        )}

        {loading && (
          <section className="panel empty-state">
            <h3>Building your kit…</h3>
            <p>Calibrating questions and guide to {level} {jobTitle}.</p>
          </section>
        )}

        {result && !loading && (
          <>
            <div className="seg" style={{ alignSelf: 'start' }}>
              <button
                type="button"
                className={tab === 'bank' ? 'active' : ''}
                onClick={() => setTab('bank')}
              >
                Question bank ({result.questionBank.length})
              </button>
              <button
                type="button"
                className={tab === 'guide' ? 'active' : ''}
                onClick={() => setTab('guide')}
              >
                Interview guide
              </button>
              <button
                type="button"
                className={tab === 'notes' ? 'active' : ''}
                onClick={() => setTab('notes')}
              >
                Live notes{notesFilled ? ` (${notesFilled})` : ''}
              </button>
            </div>

            {tab === 'bank' && (
              <section className="panel">
                <h2>Question bank</h2>
                <p className="sub">
                  Tailored for {level} {jobTitle} — jot notes under each question as you go, or use{' '}
                  <button type="button" className="linkish" onClick={() => setTab('notes')}>
                    Live notes
                  </button>{' '}
                  for a focused interview mode
                </p>
                <div className="q-list">
                  {result.questionBank.map((q, i) => {
                    const key = questionKey('bank', i)
                    return (
                      <QuestionCard
                        key={key}
                        q={q}
                        index={i}
                        noteKey={key}
                        note={notes[key]}
                        onNoteChange={updateNote}
                      />
                    )
                  })}
                </div>
              </section>
            )}

            {tab === 'notes' && (
              <section className="panel">
                <div className="notes-toolbar">
                  <div>
                    <h2>Live interview notes</h2>
                    <p className="sub">
                      Ask from the bank, rate the answer, and capture signals in real time
                    </p>
                  </div>
                  <div className="toolbar-right">
                    <button type="button" className="btn" onClick={() => void copyNotes()}>
                      Copy notes
                    </button>
                    <button type="button" className="btn" onClick={downloadNotes}>
                      Download .txt
                    </button>
                    <button type="button" className="btn" onClick={clearNotes}>
                      Clear
                    </button>
                  </div>
                </div>
                {copyMsg && <div className="alert">{copyMsg}</div>}
                <div className="field" style={{ marginBottom: 14, maxWidth: 360 }}>
                  <label htmlFor="candidateName">Candidate name</label>
                  <input
                    id="candidateName"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="Who are you interviewing?"
                  />
                </div>
                <div className="q-list">
                  {noteableQuestions.map((q, i) => (
                    <QuestionCard
                      key={q.key}
                      q={q.item}
                      index={i}
                      noteKey={q.key}
                      note={notes[q.key]}
                      onNoteChange={updateNote}
                      compact
                    />
                  ))}
                </div>
                <div className="field" style={{ marginTop: 16 }}>
                  <label htmlFor="overallNotes">Overall assessment</label>
                  <textarea
                    id="overallNotes"
                    rows={4}
                    value={overallNotes}
                    onChange={(e) => setOverallNotes(e.target.value)}
                    placeholder="Hire / no-hire lean, strengths, risks, next-step recommendation…"
                  />
                </div>
              </section>
            )}

            {tab === 'guide' && (
              <>
                <section className="panel">
                  <h2>Interview guide</h2>
                  <p className="sub">{result.guide.roleSummary}</p>
                  <h3 style={{ fontFamily: 'var(--display)', margin: '12px 0 8px' }}>
                    Competencies to assess
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {result.guide.competencies.map((c) => (
                      <span className="badge" key={c}>
                        {c}
                      </span>
                    ))}
                  </div>
                </section>

                <section className="panel">
                  <h3 style={{ fontFamily: 'var(--display)', marginTop: 0 }}>Suggested timeline</h3>
                  <div className="timeline">
                    {result.guide.timeline.map((t) => (
                      <div className="timeline-row" key={t.segment}>
                        <strong>{t.segment}</strong>
                        <span className="muted">{t.minutes} min</span>
                        <div>
                          <div
                            className="bar"
                            style={{ width: `${Math.min(100, (t.minutes / 60) * 100)}%` }}
                          />
                          <div className="muted" style={{ marginTop: 4, fontSize: '0.85rem' }}>
                            {t.focus}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="panel">
                  <h3 style={{ fontFamily: 'var(--display)', marginTop: 0 }}>Core questions</h3>
                  <p className="sub">Notes sync with the question bank / Live notes tab</p>
                  <div className="q-list">
                    {result.guide.questions.map((q, i) => {
                      // Prefer matching bank index when the guide question appears in the bank
                      const bankIdx = result.questionBank.findIndex(
                        (bq) => bq.question === q.question,
                      )
                      const key =
                        bankIdx >= 0 ? questionKey('bank', bankIdx) : questionKey('guide', i)
                      return (
                        <QuestionCard
                          key={key}
                          q={q}
                          index={i}
                          noteKey={key}
                          note={notes[key]}
                          onNoteChange={updateNote}
                          compact
                        />
                      )
                    })}
                  </div>
                </section>

                <section className="panel">
                  <h3 style={{ fontFamily: 'var(--display)', marginTop: 0 }}>Scorecard signals</h3>
                  <div className="score-grid">
                    {result.guide.scorecard.map((s) => (
                      <div className="score-card" key={s.trait}>
                        <strong>{s.trait}</strong>
                        <span className="muted" style={{ fontSize: '0.88rem', lineHeight: 1.4 }}>
                          {s.signals}
                        </span>
                      </div>
                    ))}
                  </div>
                  <h3 style={{ fontFamily: 'var(--display)', margin: '18px 0 8px' }}>Red flags</h3>
                  <ul style={{ margin: 0, color: 'var(--ink-muted)' }}>
                    {result.guide.redFlags.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                  <h3 style={{ fontFamily: 'var(--display)', margin: '18px 0 8px' }}>Closing</h3>
                  <p style={{ margin: 0, fontWeight: 600 }}>{result.guide.closingPrompt}</p>
                  <div className="field" style={{ marginTop: 14 }}>
                    <label htmlFor="overallNotesGuide">Overall assessment</label>
                    <textarea
                      id="overallNotesGuide"
                      rows={3}
                      value={overallNotes}
                      onChange={(e) => setOverallNotes(e.target.value)}
                      placeholder="Hire lean, risks, next steps…"
                    />
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
