# TalentPulse — Recruiting Analytics & AI Interview Tools

Demo app mapped to **Recruiting Funnel Analytics and AI Screening Tools**: a React dashboard for talent acquisition metrics plus AI-generated interview kits.

## What it shows

| Metric | Where |
|--------|--------|
| Time to fill by department or role | Analytics → Time to fill |
| Offer acceptance rates | Analytics → Offer acceptance |
| Source effectiveness (LinkedIn, Indeed, Referral, etc.) | Analytics → Source effectiveness |
| Funnel drop-off by stage | Analytics → Funnel drop-off |
| Role-specific question banks | AI Interview Tools |
| Tailored interview guides (timeline, scorecard, red flags) | AI Interview Tools |

## Tech stack

- **React + TypeScript + Vite**
- **Recharts** for visualization
- **PapaParse** for CSV upload
- **OpenAI API** (`gpt-4o-mini`) for question banks / guides (optional; offline fallback included)
- Synthetic recruiting dataset (deterministic seed) + CSV import/export

## Quick start

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### Optional: live OpenAI generation

The key stays on the **server**. Do not use a `VITE_` prefix — Vite would bake it into public JS and OpenAI will disable it as leaked.

1. Open `.env` (gitignored)
2. Set `OPENAI_API_KEY=sk-...`
3. Restart `npm run dev`

On Railway, set `OPENAI_API_KEY` as a **runtime** variable (not a build arg). Use a **new** key if a previous one was already revoked.

Without a key, the app still generates a solid demo kit from a built-in template.

## CSV format

Upload a CSV with headers:

```text
id,candidateName,jobTitle,department,seniority,source,stage,requisitionOpenDate,appliedDate,lastStageDate,timeToFillDays,offerExtended,offerAccepted,recruiter
```

- `stage`: Applied | Screened | Phone Interview | Onsite | Offer | Hired | Rejected
- `offerAccepted`: true | false | empty (pending)
- `timeToFillDays`: number or empty if not hired

Use **Download sample CSV** on the dashboard for a ready-made file.

## Interview talking points

How this maps to the Domo / TA visibility brief:

1. **Cross-funnel visibility** — KPIs and charts answer “where do we lose candidates?” and “which sources actually hire?”
2. **Consistency at scale** — AI interview kits give hiring managers a shared structure (competencies, timeline, scorecard) so interviews are faster and more comparable
3. **Data in, insight out** — CSV upload stands in for ATS / Domo extracts; same metrics layer would sit on a warehouse or Domo dataset in production
4. **Demo without keys** — Offline AI fallback means you can walk the product end-to-end in any interview room

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite client + local API server |
| `npm run build` | Production frontend build |
| `npm start` | Serve API + built SPA (used in Docker/Railway) |
| `npm run preview` | Preview production frontend only |
