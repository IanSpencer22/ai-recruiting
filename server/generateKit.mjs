import OpenAI from 'openai'

const SYSTEM = `You are an expert talent acquisition partner and interview designer.
Return ONLY valid JSON matching the requested schema. No markdown fences.
Be specific to the role and level — avoid generic fluff.
Questions should be behavioral and role-relevant, not trivia.`

function buildUserPrompt(jobTitle, level, focus) {
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

export async function generateKit({ jobTitle, level, focus }) {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    const err = new Error('OPENAI_API_KEY is not set')
    err.code = 'NO_KEY'
    throw err
  }

  const client = new OpenAI({ apiKey })
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

  const parsed = JSON.parse(raw)
  if (!parsed.questionBank?.length || !parsed.guide) {
    throw new Error('Unexpected AI response shape')
  }
  return parsed
}
