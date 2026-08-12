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

const SYSTEM = `You are an expert talent acquisition partner and interview designer.
Return ONLY valid JSON matching the requested schema. No markdown fences.
Be specific to the role and level — avoid generic fluff.
Questions should be behavioral and role-relevant, not trivia.`

function buildUserPrompt(jobTitle: string, level: string, focus?: string) {
  return `Create an interview kit for:
- Job title: ${jobTitle}
- Level: ${level}
${focus ? `- Extra focus areas: ${focus}` : ''}

JSON schema:
{
  "questionBank": [
    {
      "category": "string (e.g. Technical, Behavioral, Leadership, Collaboration)",
      "question": "string",
      "whyItMatters": "string",
      "followUps": ["string", "string"]
    }
  ],
  "guide": {
    "roleSummary": "2-3 sentences on what good looks like for this hire",
    "competencies": ["5-7 must-assess competencies"],
    "timeline": [
      { "segment": "string", "minutes": number, "focus": "string" }
    ],
    "questions": [ /* 6-8 of the strongest questions, same shape as questionBank items */ ],
    "scorecard": [
      { "trait": "string", "signals": "what strong vs weak answers sound like" }
    ],
    "redFlags": ["string"],
    "closingPrompt": "one closing question for the candidate"
  }
}

Provide 10-12 items in questionBank covering technical/domain, behavioral, and collaboration.
Timeline should total ~45-60 minutes for a structured interview.`
}

/** Demo fallback when no API key is configured — still interview-demoable offline */
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
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY?.trim()

  if (!apiKey) {
    // Simulate latency so UI states feel real in demos
    await new Promise((r) => setTimeout(r, 700))
    return buildFallbackKit(jobTitle, level)
  }

  const { default: OpenAI } = await import('openai')
  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.4,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: buildUserPrompt(jobTitle, level, focus) },
    ],
  })

  const raw = completion.choices[0]?.message?.content
  if (!raw) throw new Error('Empty response from OpenAI')

  const parsed = JSON.parse(raw) as InterviewAiResult
  if (!parsed.questionBank?.length || !parsed.guide) {
    throw new Error('Unexpected AI response shape')
  }
  return parsed
}
