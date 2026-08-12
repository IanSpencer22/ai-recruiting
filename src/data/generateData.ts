import type {
  Department,
  RecruitingRecord,
  RecruitingStage,
  Seniority,
  Source,
} from '../types'

const DEPARTMENTS: Department[] = [
  'Engineering',
  'Product',
  'Sales',
  'Marketing',
  'People Ops',
  'Finance',
]

const SOURCES: Source[] = [
  'LinkedIn',
  'Indeed',
  'Referral',
  'Career Site',
  'Agency',
  'University',
]

const STAGES: RecruitingStage[] = [
  'Applied',
  'Screened',
  'Phone Interview',
  'Onsite',
  'Offer',
  'Hired',
  'Rejected',
]

const ROLES: Record<Department, { title: string; seniority: Seniority }[]> = {
  Engineering: [
    { title: 'Software Engineer', seniority: 'Mid' },
    { title: 'Senior Software Engineer', seniority: 'Senior' },
    { title: 'Staff Engineer', seniority: 'Staff' },
    { title: 'Frontend Engineer', seniority: 'Mid' },
    { title: 'Backend Engineer', seniority: 'Senior' },
    { title: 'DevOps Engineer', seniority: 'Mid' },
  ],
  Product: [
    { title: 'Product Manager', seniority: 'Mid' },
    { title: 'Senior Product Manager', seniority: 'Senior' },
    { title: 'Product Designer', seniority: 'Mid' },
    { title: 'UX Researcher', seniority: 'Junior' },
  ],
  Sales: [
    { title: 'Account Executive', seniority: 'Mid' },
    { title: 'Senior Account Executive', seniority: 'Senior' },
    { title: 'Sales Development Rep', seniority: 'Junior' },
    { title: 'Enterprise AE', seniority: 'Senior' },
  ],
  Marketing: [
    { title: 'Growth Marketer', seniority: 'Mid' },
    { title: 'Content Marketing Manager', seniority: 'Mid' },
    { title: 'Demand Gen Lead', seniority: 'Senior' },
  ],
  'People Ops': [
    { title: 'Recruiter', seniority: 'Mid' },
    { title: 'Senior Recruiter', seniority: 'Senior' },
    { title: 'HR Business Partner', seniority: 'Senior' },
  ],
  Finance: [
    { title: 'Financial Analyst', seniority: 'Junior' },
    { title: 'Senior Financial Analyst', seniority: 'Senior' },
    { title: 'Controller', seniority: 'Director' },
  ],
}

const FIRST = [
  'Ava', 'Noah', 'Mia', 'Liam', 'Zoe', 'Ethan', 'Iris', 'Owen', 'Luna', 'Kai',
  'Nora', 'Leo', 'Ella', 'Jude', 'Aria', 'Miles', 'Chloe', 'Theo', 'Ruby', 'Finn',
  'Sienna', 'Asher', 'Ivy', 'Row', 'Maya', 'Felix', 'Hazel', 'Row', 'Vera', 'Nico',
]

const LAST = [
  'Chen', 'Patel', 'Nguyen', 'Garcia', 'Kim', 'Johnson', 'Williams', 'Brown',
  'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson',
  'White', 'Harris', 'Martin', 'Thompson', 'Rivera', 'Lopez', 'Lee', 'Walker',
]

const RECRUITERS = [
  'Jordan Blake',
  'Sam Okonkwo',
  'Priya Shah',
  'Chris Alvarez',
  'Morgan Lee',
]

/** Deterministic PRNG for reproducible demo data */
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}

function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

function addDays(d: Date, n: number) {
  const next = new Date(d)
  next.setDate(next.getDate() + n)
  return next
}

function iso(d: Date) {
  return d.toISOString().slice(0, 10)
}

/**
 * Source quality biases for realistic funnel analytics:
 * Referrals convert well; Agency is slower/expensive; University is junior-heavy.
 */
const SOURCE_WEIGHTS: Record<Source, number> = {
  LinkedIn: 0.28,
  Indeed: 0.22,
  Referral: 0.16,
  'Career Site': 0.14,
  Agency: 0.12,
  University: 0.08,
}

function weightedSource(rng: () => number): Source {
  const r = rng()
  let acc = 0
  for (const s of SOURCES) {
    acc += SOURCE_WEIGHTS[s]
    if (r <= acc) return s
  }
  return 'LinkedIn'
}

/** Probability of advancing past each stage (before rejection branch) */
function advanceChance(source: Source, seniority: Seniority): number {
  let base = 0.55
  if (source === 'Referral') base += 0.18
  if (source === 'Agency') base += 0.08
  if (source === 'University') base -= 0.08
  if (source === 'Indeed') base -= 0.05
  if (seniority === 'Senior' || seniority === 'Staff') base -= 0.05
  if (seniority === 'Director') base -= 0.1
  return Math.min(0.9, Math.max(0.25, base))
}

function offerAcceptChance(source: Source): number {
  if (source === 'Referral') return 0.88
  if (source === 'Career Site') return 0.82
  if (source === 'LinkedIn') return 0.74
  if (source === 'Agency') return 0.68
  if (source === 'University') return 0.8
  return 0.7
}

export function generateRecruitingData(count = 320, seed = 42): RecruitingRecord[] {
  const rng = mulberry32(seed)
  const records: RecruitingRecord[] = []
  const yearStart = new Date('2025-01-05')

  for (let i = 0; i < count; i++) {
    const department = pick(rng, DEPARTMENTS)
    const role = pick(rng, ROLES[department])
    const source = weightedSource(rng)
    const recruiter = pick(rng, RECRUITERS)

    const openOffset = Math.floor(rng() * 400)
    const requisitionOpenDate = addDays(yearStart, openOffset)
    const appliedDate = addDays(requisitionOpenDate, Math.floor(rng() * 21))

    let stage: RecruitingStage = 'Applied'
    let lastStageDate = appliedDate
    const chance = advanceChance(source, role.seniority)

    const funnel: RecruitingStage[] = [
      'Screened',
      'Phone Interview',
      'Onsite',
      'Offer',
      'Hired',
    ]

    for (const next of funnel) {
      if (rng() < chance) {
        stage = next
        lastStageDate = addDays(
          lastStageDate,
          3 + Math.floor(rng() * (next === 'Onsite' ? 18 : 12)),
        )
      } else {
        stage = 'Rejected'
        lastStageDate = addDays(lastStageDate, 2 + Math.floor(rng() * 10))
        break
      }
    }

    let offerExtended = stage === 'Offer' || stage === 'Hired'
    let offerAccepted: boolean | null = null
    let timeToFillDays: number | null = null

    if (stage === 'Offer') {
      // Pending or declined offer still in Offer stage
      if (rng() < 0.45) {
        offerAccepted = false
      } else {
        offerAccepted = null // pending
      }
    }

    if (stage === 'Hired') {
      offerExtended = true
      if (rng() > offerAcceptChance(source)) {
        // rare path: somehow marked hired without accept — force accept
        offerAccepted = true
      } else {
        offerAccepted = true
      }
      timeToFillDays = daysBetween(requisitionOpenDate, lastStageDate)
    }

    // Some rejected after offer
    if (stage === 'Rejected' && rng() < 0.12 && rng() < chance) {
      offerExtended = true
      offerAccepted = false
    }

    records.push({
      id: `REQ-${String(1000 + i)}`,
      candidateName: `${pick(rng, FIRST)} ${pick(rng, LAST)}`,
      jobTitle: role.title,
      department,
      seniority: role.seniority,
      source,
      stage,
      requisitionOpenDate: iso(requisitionOpenDate),
      appliedDate: iso(appliedDate),
      lastStageDate: iso(lastStageDate),
      timeToFillDays,
      offerExtended,
      offerAccepted,
      recruiter,
    })
  }

  return records
}

export function recordsToCsv(records: RecruitingRecord[]): string {
  const headers = [
    'id',
    'candidateName',
    'jobTitle',
    'department',
    'seniority',
    'source',
    'stage',
    'requisitionOpenDate',
    'appliedDate',
    'lastStageDate',
    'timeToFillDays',
    'offerExtended',
    'offerAccepted',
    'recruiter',
  ]

  const escape = (v: string | number | boolean | null) => {
    if (v === null || v === undefined) return ''
    const s = String(v)
    return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s
  }

  const rows = records.map((r) =>
    headers
      .map((h) => escape(r[h as keyof RecruitingRecord] as string | number | boolean | null))
      .join(','),
  )

  return [headers.join(','), ...rows].join('\n')
}

export { STAGES, SOURCES, DEPARTMENTS }
