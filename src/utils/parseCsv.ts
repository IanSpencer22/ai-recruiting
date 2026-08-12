import Papa from 'papaparse'
import type { RecruitingRecord, RecruitingStage, Source, Department, Seniority } from '../types'

const STAGES = new Set([
  'Applied',
  'Screened',
  'Phone Interview',
  'Onsite',
  'Offer',
  'Hired',
  'Rejected',
])

function parseBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v
  const s = String(v ?? '').trim().toLowerCase()
  return s === 'true' || s === '1' || s === 'yes'
}

function parseBoolOrNull(v: unknown): boolean | null {
  const s = String(v ?? '').trim().toLowerCase()
  if (!s) return null
  if (s === 'true' || s === '1' || s === 'yes') return true
  if (s === 'false' || s === '0' || s === 'no') return false
  return null
}

function parseNumOrNull(v: unknown): number | null {
  const s = String(v ?? '').trim()
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

export interface CsvParseResult {
  records: RecruitingRecord[]
  errors: string[]
}

export function parseRecruitingCsv(file: File): Promise<CsvParseResult> {
  return new Promise((resolve) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = []
        const records: RecruitingRecord[] = []

        results.data.forEach((row, idx) => {
          const line = idx + 2
          const stage = (row.stage ?? '').trim()
          if (!STAGES.has(stage)) {
            errors.push(`Row ${line}: invalid stage "${row.stage}"`)
            return
          }

          if (!row.id || !row.jobTitle || !row.department || !row.source) {
            errors.push(`Row ${line}: missing required fields`)
            return
          }

          records.push({
            id: row.id.trim(),
            candidateName: (row.candidateName ?? 'Unknown').trim(),
            jobTitle: row.jobTitle.trim(),
            department: row.department.trim() as Department,
            seniority: ((row.seniority ?? 'Mid').trim() || 'Mid') as Seniority,
            source: row.source.trim() as Source,
            stage: stage as RecruitingStage,
            requisitionOpenDate: (row.requisitionOpenDate ?? '').trim(),
            appliedDate: (row.appliedDate ?? '').trim(),
            lastStageDate: (row.lastStageDate ?? '').trim(),
            timeToFillDays: parseNumOrNull(row.timeToFillDays),
            offerExtended: parseBool(row.offerExtended),
            offerAccepted: parseBoolOrNull(row.offerAccepted),
            recruiter: (row.recruiter ?? '').trim(),
          })
        })

        if (results.errors.length) {
          for (const e of results.errors.slice(0, 5)) {
            errors.push(`CSV: ${e.message}`)
          }
        }

        resolve({ records, errors })
      },
      error: (err) => {
        resolve({ records: [], errors: [err.message] })
      },
    })
  })
}
