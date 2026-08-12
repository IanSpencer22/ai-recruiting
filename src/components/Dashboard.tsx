import { useMemo, useState } from 'react'
import type { RecruitingRecord } from '../types'
import {
  computeFunnel,
  offerAcceptanceBy,
  sourceEffectiveness,
  summaryKpis,
  timeToFillBy,
} from '../utils/analytics'
import { parseRecruitingCsv } from '../utils/parseCsv'
import { recordsToCsv } from '../data/generateData'
import {
  FunnelDropoffChart,
  OfferAcceptanceChart,
  SourceEffectivenessChart,
  TimeToFillChart,
} from './Charts'

interface Props {
  records: RecruitingRecord[]
  onRecordsChange: (records: RecruitingRecord[]) => void
  onResetSample: () => void
}

export function Dashboard({ records, onRecordsChange, onResetSample }: Props) {
  const [ttfGroup, setTtfGroup] = useState<'department' | 'jobTitle'>('department')
  const [offerGroup, setOfferGroup] = useState<'department' | 'source'>('department')
  const [uploadMsg, setUploadMsg] = useState<string | null>(null)

  const kpis = useMemo(() => summaryKpis(records), [records])
  const ttf = useMemo(() => timeToFillBy(records, ttfGroup), [records, ttfGroup])
  const offers = useMemo(
    () => offerAcceptanceBy(records, offerGroup),
    [records, offerGroup],
  )
  const sources = useMemo(() => sourceEffectiveness(records), [records])
  const funnel = useMemo(() => computeFunnel(records), [records])

  async function handleUpload(file: File | undefined) {
    if (!file) return
    const { records: parsed, errors } = await parseRecruitingCsv(file)
    if (!parsed.length) {
      setUploadMsg(errors[0] ?? 'No valid rows found in CSV.')
      return
    }
    onRecordsChange(parsed)
    setUploadMsg(
      `Loaded ${parsed.length} records${errors.length ? ` (${errors.length} row warnings)` : ''}.`,
    )
  }

  function downloadSample() {
    const csv = recordsToCsv(records.slice(0, 50))
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'recruiting-sample.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="toolbar">
        <div className="toolbar-left">
          <span className="muted" style={{ fontSize: '0.9rem' }}>
            Dataset: <strong style={{ color: 'var(--ink)' }}>{records.length}</strong> candidates
          </span>
        </div>
        <div className="toolbar-right">
          <label className="btn file-btn">
            Upload CSV
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => void handleUpload(e.target.files?.[0])}
            />
          </label>
          <button type="button" className="btn" onClick={downloadSample}>
            Download sample CSV
          </button>
          <button type="button" className="btn" onClick={onResetSample}>
            Reset synthetic data
          </button>
        </div>
      </div>

      {uploadMsg && <div className="alert">{uploadMsg}</div>}

      <div className="kpi-grid">
        <div className="kpi">
          <div className="label">Avg time to fill</div>
          <div className="value">{kpis.avgTimeToFill}d</div>
          <div className="hint">Requisition open → hire</div>
        </div>
        <div className="kpi">
          <div className="label">Offer accept rate</div>
          <div className="value">{kpis.offerAcceptRate}%</div>
          <div className="hint">{kpis.openOffers} offers pending</div>
        </div>
        <div className="kpi">
          <div className="label">Hires</div>
          <div className="value">{kpis.hires}</div>
          <div className="hint">of {kpis.totalCandidates} in funnel</div>
        </div>
        <div className="kpi">
          <div className="label">Apply → hire</div>
          <div className="value">{kpis.overallConversion}%</div>
          <div className="hint">End-to-end conversion</div>
        </div>
        <div className="kpi">
          <div className="label">Top source</div>
          <div className="value" style={{ fontSize: '1.35rem' }}>
            {sources[0]?.source ?? '—'}
          </div>
          <div className="hint">{sources[0]?.hireRate ?? 0}% hire rate</div>
        </div>
      </div>

      <div className="grid-2">
        <section className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h2>Time to fill</h2>
              <p className="sub">Average and median days by {ttfGroup === 'department' ? 'department' : 'role'}</p>
            </div>
            <div className="seg">
              <button
                type="button"
                className={ttfGroup === 'department' ? 'active' : ''}
                onClick={() => setTtfGroup('department')}
              >
                Department
              </button>
              <button
                type="button"
                className={ttfGroup === 'jobTitle' ? 'active' : ''}
                onClick={() => setTtfGroup('jobTitle')}
              >
                Role
              </button>
            </div>
          </div>
          <TimeToFillChart data={ttf} />
        </section>

        <section className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h2>Offer acceptance</h2>
              <p className="sub">Accepted ÷ decided offers by {offerGroup}</p>
            </div>
            <div className="seg">
              <button
                type="button"
                className={offerGroup === 'department' ? 'active' : ''}
                onClick={() => setOfferGroup('department')}
              >
                Department
              </button>
              <button
                type="button"
                className={offerGroup === 'source' ? 'active' : ''}
                onClick={() => setOfferGroup('source')}
              >
                Source
              </button>
            </div>
          </div>
          <OfferAcceptanceChart data={offers} />
        </section>
      </div>

      <div className="grid-2">
        <section className="panel">
          <h2>Source effectiveness</h2>
          <p className="sub">Volume vs hire rate across LinkedIn, Indeed, referral, and more</p>
          <SourceEffectivenessChart data={sources} />
          <div className="table-wrap" style={{ marginTop: 8 }}>
            <table className="data">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Applicants</th>
                  <th>Hires</th>
                  <th>Hire rate</th>
                  <th>Avg TTF</th>
                  <th>Offer accept</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.source}>
                    <td>
                      <span className="badge">{s.source}</span>
                    </td>
                    <td>{s.applicants}</td>
                    <td>{s.hires}</td>
                    <td>{s.hireRate}%</td>
                    <td>{s.avgTimeToFill != null ? `${s.avgTimeToFill}d` : '—'}</td>
                    <td>{s.offerAcceptRate != null ? `${s.offerAcceptRate}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <h2>Funnel drop-off</h2>
          <p className="sub">Candidates reaching each stage and attrition between steps</p>
          <FunnelDropoffChart data={funnel} />
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Stage</th>
                  <th>Count</th>
                  <th>Conv. from prior</th>
                  <th>Drop-off</th>
                </tr>
              </thead>
              <tbody>
                {funnel.map((f) => (
                  <tr key={f.stage}>
                    <td>{f.stage}</td>
                    <td>{f.count}</td>
                    <td>{f.conversionFromPrevious != null ? `${f.conversionFromPrevious}%` : '—'}</td>
                    <td>{f.dropOffRate != null ? `${f.dropOffRate}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  )
}
