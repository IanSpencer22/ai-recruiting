export type RecruitingStage =
  | 'Applied'
  | 'Screened'
  | 'Phone Interview'
  | 'Onsite'
  | 'Offer'
  | 'Hired'
  | 'Rejected'

export type Source =
  | 'LinkedIn'
  | 'Indeed'
  | 'Referral'
  | 'Career Site'
  | 'Agency'
  | 'University'

export type Department =
  | 'Engineering'
  | 'Product'
  | 'Sales'
  | 'Marketing'
  | 'People Ops'
  | 'Finance'

export type Seniority = 'Junior' | 'Mid' | 'Senior' | 'Staff' | 'Director'

export interface RecruitingRecord {
  id: string
  candidateName: string
  jobTitle: string
  department: Department
  seniority: Seniority
  source: Source
  stage: RecruitingStage
  requisitionOpenDate: string
  appliedDate: string
  lastStageDate: string
  /** Days from req open to hire; null if not hired */
  timeToFillDays: number | null
  offerExtended: boolean
  offerAccepted: boolean | null
  recruiter: string
}

export interface FunnelStep {
  stage: RecruitingStage
  count: number
  dropOffRate: number | null
  conversionFromPrevious: number | null
}

export interface TimeToFillByGroup {
  group: string
  avgDays: number
  medianDays: number
  hires: number
}

export interface SourceMetrics {
  source: Source
  applicants: number
  hires: number
  hireRate: number
  avgTimeToFill: number | null
  offerAcceptRate: number | null
}

export interface OfferMetrics {
  group: string
  extended: number
  accepted: number
  declined: number
  acceptanceRate: number
}

export type AppView = 'dashboard' | 'interview'
