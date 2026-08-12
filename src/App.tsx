import { useMemo, useState } from 'react'
import type { AppView, RecruitingRecord } from './types'
import { generateRecruitingData } from './data/generateData'
import { Dashboard } from './components/Dashboard'
import { InterviewTools } from './components/InterviewTools'

function BrandMark() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect width="32" height="32" rx="8" fill="#0F766E" />
      <path
        d="M8 22V10l8 6 8-6v12"
        stroke="#F0FDFA"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function App() {
  const sample = useMemo(() => generateRecruitingData(320, 42), [])
  const [records, setRecords] = useState<RecruitingRecord[]>(sample)
  const [view, setView] = useState<AppView>('dashboard')

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <BrandMark />
            <h1>TalentPulse</h1>
          </div>
          <p>
            Recruiting funnel analytics and AI interview kits — time-to-fill, offer acceptance,
            source effectiveness, and consistent hiring guides.
          </p>
        </div>
        <nav className="nav-tabs" aria-label="Primary">
          <button
            type="button"
            className={view === 'dashboard' ? 'active' : ''}
            onClick={() => setView('dashboard')}
          >
            Analytics
          </button>
          <button
            type="button"
            className={view === 'interview' ? 'active' : ''}
            onClick={() => setView('interview')}
          >
            AI Interview Tools
          </button>
        </nav>
      </header>

      {view === 'dashboard' ? (
        <Dashboard
          records={records}
          onRecordsChange={setRecords}
          onResetSample={() => setRecords(sample)}
        />
      ) : (
        <InterviewTools />
      )}
    </div>
  )
}
