export interface QuestionBankItem {
  category: string
  question: string
  whyItMatters: string
  followUps: string[]
}

export interface InterviewGuide {
  roleSummary: string
  competencies: string[]
  timeline: { segment: string; minutes: number; focus: string }[]
  questions: QuestionBankItem[]
  scorecard: { trait: string; signals: string }[]
  redFlags: string[]
  closingPrompt: string
}

export interface InterviewAiResult {
  questionBank: QuestionBankItem[]
  guide: InterviewGuide
}

/** Demo fallback when the server has no OpenAI key — still interview-demoable offline */
export function buildFallbackKit(jobTitle: string, level: string): InterviewAiResult {
  const label = `${level} ${jobTitle}`
  const questionBank: QuestionBankItem[] = [
    {
      category: 'Role Craft',
      question: `Walk me through a recent project where you owned outcomes as a ${jobTitle}. What was the goal, your approach, and the measurable result?`,
      whyItMatters: 'Reveals ownership, scope, and ability to quantify impact at this level.',
      followUps: [
        'What would you do differently?',
        'How did stakeholders influence the outcome?',
      ],
    },
    {
      category: 'Problem Solving',
      question: `Describe a time you had incomplete requirements for a ${jobTitle}-critical deliverable. How did you decide what to build or prioritize?`,
      whyItMatters: 'Tests ambiguity tolerance and judgment under constraints.',
      followUps: ['What trade-offs did you make?', 'Who did you involve and why?'],
    },
    {
      category: 'Collaboration',
      question: 'Tell me about a disagreement with a peer or partner. How did you handle it, and what changed afterward?',
      whyItMatters: 'Surfaces conflict style and ability to preserve working relationships.',
      followUps: ['What feedback did you receive?', 'Would the other person describe it the same way?'],
    },
    {
      category: 'Technical / Domain',
      question: `What domain skill separates a strong ${level}-level ${jobTitle} from an average one on your team?`,
      whyItMatters: 'Checks depth of craft and calibration to the level you are hiring.',
      followUps: ['How do you coach others on that skill?', 'Give a concrete example from your work.'],
    },
    {
      category: 'Delivery',
      question: 'Share an example where a timeline slipped. What early signals did you miss, and how did you recover?',
      whyItMatters: 'Shows execution discipline and communication under pressure.',
      followUps: ['How did you reset expectations?', 'What process change did you put in place?'],
    },
    {
      category: 'Behavioral',
      question: 'Describe feedback that was hard to hear. What did you change as a result?',
      whyItMatters: 'Growth mindset and coachability are strong predictors of ramp success.',
      followUps: ['How long did the change take?', 'How do you solicit feedback now?'],
    },
    {
      category: 'Leadership',
      question:
        level === 'Junior'
          ? 'Tell me about a time you took initiative without being asked.'
          : `How have you raised the bar for others around you as a ${level} ${jobTitle}?`,
      whyItMatters: 'Assesses influence relative to seniority.',
      followUps: ['What resisted the change?', 'How did you measure improvement?'],
    },
    {
      category: 'Customer / User Focus',
      question: 'Give an example where user or customer insight changed your plan.',
      whyItMatters: 'Connects craft decisions to real outcomes for the business.',
      followUps: ['How did you gather the insight?', 'What metric moved afterward?'],
    },
    {
      category: 'Prioritization',
      question: 'You have three urgent requests and capacity for one. How do you decide?',
      whyItMatters: 'Exposes frameworks for sequencing work and saying no.',
      followUps: ['Who do you involve in the decision?', 'How do you communicate the trade-off?'],
    },
    {
      category: 'Culture Add',
      question: 'What kind of team environment helps you do your best work — and what drains you?',
      whyItMatters: 'Helps assess mutual fit without illegal or biased questions.',
      followUps: ['How have you contributed to that environment before?'],
    },
  ]

  return {
    questionBank,
    guide: {
      roleSummary: `For a ${label}, look for clear ownership of outcomes, calibrated technical/domain depth for the level, and consistent communication with partners. Strong candidates connect their craft to business or user impact and can narrate trade-offs without defensiveness.`,
      competencies: [
        'Ownership & accountability',
        'Domain / technical depth',
        'Structured problem solving',
        'Cross-functional collaboration',
        'Communication clarity',
        'Learning agility',
        level === 'Junior' ? 'Coachability' : 'Mentorship & influence',
      ],
      timeline: [
        { segment: 'Rapport & role context', minutes: 5, focus: 'Set agenda; confirm candidate understanding of the role' },
        { segment: 'Deep-dive #1 — craft', minutes: 15, focus: 'Recent owned project; probe metrics and decisions' },
        { segment: 'Deep-dive #2 — collaboration', minutes: 12, focus: 'Conflict, stakeholder management, feedback' },
        { segment: 'Scenario / prioritization', minutes: 10, focus: 'Live judgment with incomplete information' },
        { segment: 'Candidate questions & close', minutes: 8, focus: 'Sell the role; leave clear next steps' },
      ],
      questions: questionBank.slice(0, 7),
      scorecard: [
        {
          trait: 'Impact narrative',
          signals: 'Strong: specific metrics and personal contribution. Weak: team credit only, vague outcomes.',
        },
        {
          trait: 'Judgment',
          signals: 'Strong: explicit trade-offs and constraints. Weak: binary thinking or blame.',
        },
        {
          trait: 'Collaboration',
          signals: 'Strong: names partners and shared goals. Weak: “they were wrong” stories.',
        },
        {
          trait: 'Level calibration',
          signals: `Strong: scope matches ${level} expectations. Weak: too tactical or too abstract for the level.`,
        },
      ],
      redFlags: [
        'Cannot describe personal contribution on “team” wins',
        'Blames others without reflecting on their own role',
        'No evidence of learning from failure',
        'Misaligned expectations on seniority or compensation early without curiosity about the work',
      ],
      closingPrompt: `What would success look like for you in the first 90 days as a ${jobTitle}, and what support would you need from us?`,
    },
  }
}

export async function generateInterviewKit(params: {
  jobTitle: string
  level: string
  focus?: string
}): Promise<InterviewAiResult> {
  const { jobTitle, level, focus } = params

  const response = await fetch('/api/interview-kit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobTitle, level, focus }),
  })

  if (response.status === 503) {
    await new Promise((r) => setTimeout(r, 700))
    return buildFallbackKit(jobTitle, level)
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(payload?.error ?? 'Generation failed')
  }

  const parsed = (await response.json()) as InterviewAiResult
  if (!parsed.questionBank?.length || !parsed.guide) {
    throw new Error('Unexpected AI response shape')
  }
  return parsed
}
