import type {
  FunnelStep,
  OfferMetrics,
  RecruitingRecord,
  RecruitingStage,
  SourceMetrics,
  TimeToFillByGroup,
} from '../types'
import { STAGES } from '../data/generateData'

const FUNNEL_ORDER: RecruitingStage[] = [
  'Applied',
  'Screened',
  'Phone Interview',
  'Onsite',
  'Offer',
  'Hired',
]

/** Count how many candidates reached at least this stage (Hired counts for all prior) */
function reachedStage(stage: RecruitingStage, record: RecruitingRecord): boolean {
  if (record.stage === 'Rejected') {
    // Approximate: rejected candidates still "reached" earlier stages based on timeline heuristics.
    // For demo clarity we treat Rejected as having reached Applied only unless they had an offer.
    if (stage === 'Applied') return true
    if (record.offerExtended && (stage === 'Offer' || FUNNEL_ORDER.indexOf(stage) <= FUNNEL_ORDER.indexOf('Offer'))) {
      // They got to offer then declined / rejected
      return FUNNEL_ORDER.indexOf(stage) <= FUNNEL_ORDER.indexOf('Offer')
    }
    // Use a soft model: most rejects happen after screen/phone — encoded via lastStageDate span
    return false
  }

  const idx = FUNNEL_ORDER.indexOf(record.stage)
  const target = FUNNEL_ORDER.indexOf(stage)
  return idx >= target && target >= 0
}

/**
 * Rebuild funnel using progressive attrition from synthetic stage outcomes.
 * We count: Applied = all; then each successive stage from actual terminal stage.
 */
export function computeFunnel(records: RecruitingRecord[]): FunnelStep[] {
  const totals: Record<string, number> = Object.fromEntries(
    FUNNEL_ORDER.map((s) => [s, 0]),
  )

  for (const r of records) {
    totals.Applied += 1

    if (r.stage === 'Rejected') {
      // Infer how far they got from offer flag + random-ish but deterministic fields
      const hash = r.id.charCodeAt(r.id.length - 1) % 4
      const maxIdx = r.offerExtended ? FUNNEL_ORDER.indexOf('Offer') : 1 + hash
      for (let i = 1; i <= maxIdx && i < FUNNEL_ORDER.length; i++) {
        totals[FUNNEL_ORDER[i]] += 1
      }
      continue
    }

    const end = FUNNEL_ORDER.indexOf(r.stage)
    for (let i = 1; i <= end; i++) {
      totals[FUNNEL_ORDER[i]] += 1
    }
  }

  return FUNNEL_ORDER.map((stage, i) => {
    const count = totals[stage]
    const prev = i === 0 ? null : totals[FUNNEL_ORDER[i - 1]]
    const conversionFromPrevious =
      prev && prev > 0 ? Math.round((count / prev) * 1000) / 10 : null
    const dropOffRate =
      prev && prev > 0 ? Math.round(((prev - count) / prev) * 1000) / 10 : null

    return { stage, count, dropOffRate, conversionFromPrevious }
  })
}

function median(nums: number[]): number {
  if (!nums.length) return 0
  const sorted = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? sorted[mid]
    : Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10
}

export function timeToFillBy(
  records: RecruitingRecord[],
  key: 'department' | 'jobTitle',
): TimeToFillByGroup[] {
  const groups = new Map<string, number[]>()

  for (const r of records) {
    if (r.timeToFillDays == null) continue
    const g = r[key]
    if (!groups.has(g)) groups.set(g, [])
    groups.get(g)!.push(r.timeToFillDays)
  }

  return [...groups.entries()]
    .map(([group, days]) => ({
      group,
      avgDays: Math.round((days.reduce((a, b) => a + b, 0) / days.length) * 10) / 10,
      medianDays: median(days),
      hires: days.length,
    }))
    .sort((a, b) => b.avgDays - a.avgDays)
}

export function sourceEffectiveness(records: RecruitingRecord[]): SourceMetrics[] {
  const bySource = new Map<string, RecruitingRecord[]>()

  for (const r of records) {
    if (!bySource.has(r.source)) bySource.set(r.source, [])
    bySource.get(r.source)!.push(r)
  }

  return [...bySource.entries()]
    .map(([source, rows]) => {
      const hires = rows.filter((r) => r.stage === 'Hired')
      const offers = rows.filter((r) => r.offerExtended)
      const accepted = offers.filter((r) => r.offerAccepted === true)
      const decided = offers.filter((r) => r.offerAccepted !== null)
      const ttf = hires
        .map((r) => r.timeToFillDays)
        .filter((d): d is number => d != null)

      return {
        source: source as SourceMetrics['source'],
        applicants: rows.length,
        hires: hires.length,
        hireRate: Math.round((hires.length / rows.length) * 1000) / 10,
        avgTimeToFill: ttf.length
          ? Math.round((ttf.reduce((a, b) => a + b, 0) / ttf.length) * 10) / 10
          : null,
        offerAcceptRate: decided.length
          ? Math.round((accepted.length / decided.length) * 1000) / 10
          : null,
      }
    })
    .sort((a, b) => b.hireRate - a.hireRate)
}

export function offerAcceptanceBy(
  records: RecruitingRecord[],
  key: 'department' | 'source',
): OfferMetrics[] {
  const groups = new Map<string, RecruitingRecord[]>()

  for (const r of records) {
    if (!r.offerExtended) continue
    const g = String(r[key])
    if (!groups.has(g)) groups.set(g, [])
    groups.get(g)!.push(r)
  }

  return [...groups.entries()]
    .map(([group, rows]) => {
      const accepted = rows.filter((r) => r.offerAccepted === true).length
      const declined = rows.filter((r) => r.offerAccepted === false).length
      const decided = accepted + declined
      return {
        group,
        extended: rows.length,
        accepted,
        declined,
        acceptanceRate: decided
          ? Math.round((accepted / decided) * 1000) / 10
          : 0,
      }
    })
    .sort((a, b) => b.acceptanceRate - a.acceptanceRate)
}

export function summaryKpis(records: RecruitingRecord[]) {
  const hires = records.filter((r) => r.stage === 'Hired')
  const ttf = hires
    .map((r) => r.timeToFillDays)
    .filter((d): d is number => d != null)
  const offers = records.filter((r) => r.offerExtended)
  const decided = offers.filter((r) => r.offerAccepted !== null)
  const accepted = decided.filter((r) => r.offerAccepted === true)
  const funnel = computeFunnel(records)
  const applied = funnel[0]?.count ?? 0
  const hireCount = funnel.find((f) => f.stage === 'Hired')?.count ?? 0

  return {
    totalCandidates: records.length,
    hires: hires.length,
    avgTimeToFill: ttf.length
      ? Math.round((ttf.reduce((a, b) => a + b, 0) / ttf.length) * 10) / 10
      : 0,
    offerAcceptRate: decided.length
      ? Math.round((accepted.length / decided.length) * 1000) / 10
      : 0,
    overallConversion:
      applied > 0 ? Math.round((hireCount / applied) * 1000) / 10 : 0,
    openOffers: offers.filter((r) => r.offerAccepted === null).length,
  }
}

export { FUNNEL_ORDER, STAGES, reachedStage }
