# Quiz Review UX - Implementation Plan

## Goal
Transform the quiz review into a 2-step learning flow:
- Step 1: Quiz Result Summary Screen (score card + strengths/weaknesses)
- Step 2: Full Review Screen (collapsible per-question cards)

## Files to Change

### 1. `types/index.ts` (+1 line)
Add `topic` to `QuestionReview`:
```typescript
export interface QuestionReview {
  ...
  topic: string
}
```

### 2. `app/api/review/route.ts` (2 changes)
- **Prompt** (line 28): Add `topic` field to the per-question JSON template
- **LANGUAGE RULE** (line 13): Include `topic` 
- **Normalization** (line 232): Add `topic: r.topic ?? ''`

### 3. NEW: `components/QuizResultScreen.tsx`
Component that shows:
- Score display: large X/Y + percentage + status message
- Strengths column (topics with all correct answers)
- Weaknesses column (topics with any wrong)
- "View Full Review" button → calls `onViewFullReview`
- "New Quiz" link → calls `onReset`

Props:
```typescript
interface QuizResultScreenProps {
  score: { correct: number; total: number; percentage: number }
  reviews: QuestionReview[]
  onViewFullReview: () => void
  onReset: () => void
}
```

Logic for strengths/weaknesses:
```typescript
const topics = useMemo(() => {
  const map = new Map<string, { correct: number; wrong: number }>()
  reviews.forEach(r => {
    if (!r.topic) return
    const entry = map.get(r.topic) ?? { correct: 0, wrong: 0 }
    if (r.isCorrect) entry.correct++
    else entry.wrong++
    map.set(r.topic, entry)
  })
  return map
}, [reviews])
```

### 4. `components/QuizReview.tsx` (+onBack prop)
- Add `onBack?: () => void` to `QuizReviewProps`
- When `onBack` is provided, show a "Back to Summary" button at the top of the component (above celebration banner), styled as a text link with left chevron icon

### 5. `components/QuizResults.tsx` (wire 2-step flow)
- Add state: `const [reviewStep, setReviewStep] = useState<'result' | 'review'>('result')`
- After `/api/review` returns successfully → render `<QuizResultScreen>` instead of `<QuizReview>`
- When user clicks "View Full Review" → `setReviewStep('review')`, render `<QuizReview>` with `onBack` prop
- When user clicks "Back to Summary" → `setReviewStep('result')`, render `<QuizResultScreen>` again
- Import `QuizResultScreen` from new file

## Visual Layout

### Step 1 - Quiz Result Screen
```
┌─ Quiz Complete ────────────────────────────────┐
│                                                  │
│          7 / 10                                  │
│           70%                                    │
│                                                  │
│      Good - Keep practicing!                     │
│                                                  │
│  ┌─ Strengths ────┐  ┌─ Weaknesses ─────────┐   │
│  │ ✅ Verb Conj.   │  │ ❌ Prepositions (2)  │   │
│  │ ✅ Vocabulary   │  │ ❌ Grammar Rules (1) │   │
│  └────────────────┘  └──────────────────────┘   │
│                                                  │
│  [ View Full Review ]         [ New Quiz ]       │
└──────────────────────────────────────────────────┘
```

### Step 2 - Full Review Screen
(Current QuizReview layout with added "← Back to Summary" button at top)

## What stays unchanged
- `/api/explain` route, quiz generation, scoring, answer tracking
- Celebration banner, confetti, collapsible cards, all review content
- Upload, download, share buttons
