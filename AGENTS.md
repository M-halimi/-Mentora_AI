<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:teacher-copilot-agent -->
# Teacher Copilot Project Expert

A project expert agent is available at `.opencode/agents/project-expert.md`.

Use it to understand the app architecture, debug issues (PDF extraction, Groq API, build failures, mobile), or check deployment steps.
<!-- END:teacher-copilot-agent -->

<!-- BEGIN:name-prompt -->
# Name Prompt Modal

`components/NamePromptModal.tsx` is used to collect the user's name before they start a quiz. The name is stored in `sessionStorage` under the key `'quizUserName'`.

Import and use helpers:
```ts
import { getNameFromSession, setNameInSession } from '@/components/NamePromptModal'
```

- Always use `getNameFromSession()` before creating a new name prompt to avoid asking twice.
- Always call `setNameInSession(name)` after collecting the name.
- The modal auto-dismisses if a name already exists in session storage.
<!-- END:name-prompt -->
