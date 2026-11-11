\# Project Rules — React 19 \& Zero Div-Soup



> \*\*Purpose:\*\* Define strict development constraints for AI coding agents working on this project. All generated, modified, and refactored code must follow these rules.



\---



\## 1. Core Principles



All development must prioritize:



1\. \*\*Simplicity:\*\* Prefer the simplest implementation that satisfies the requirements.

2\. \*\*Maintainability:\*\* Write readable, reusable, and predictable code.

3\. \*\*Semantic HTML:\*\* Use appropriate HTML elements instead of generic containers.

4\. \*\*Component Reusability:\*\* Avoid duplicated logic and unnecessary components.

5\. \*\*Performance:\*\* Avoid unnecessary renders, dependencies, and expensive computations.

6\. \*\*Consistency:\*\* Follow the existing project architecture and conventions.



\*\*Golden Rule:\*\* Do not introduce complexity without a clear technical reason.



\---



\## 2. React 19 Requirements



\### 2.1 Component Architecture



\- Use functional components exclusively.

\- Follow React 19 conventions.

\- Use PascalCase for component names.

\- Keep components focused on a single responsibility.

\- Extract reusable UI elements when they have meaningful reuse.

\- Avoid creating components for trivial one-line elements without a clear benefit.

\- Keep business logic separate from presentation when appropriate.



\### 2.2 React Hooks



\- Follow the Rules of Hooks.

\- Never call Hooks conditionally or inside loops.

\- Prefer `useState` for local component state.

\- Use `useReducer` when state transitions become complex.

\- Use `useContext` for shared state when appropriate.

\- Use `useMemo` and `useCallback` only when there is a measurable or meaningful performance benefit.

\- Do not use Effects to calculate values that can be derived during rendering.



\### 2.3 React 19 Features



Use React 19 features when they provide a practical advantage:



\- `useActionState` for action-related state.

\- `useOptimistic` for optimistic UI updates.

\- `use()` for supported Promise and Context reading patterns.

\- Ref as a regular prop where appropriate.

\- Actions for asynchronous form submissions.



Do not adopt new APIs merely because they are available.



\### 2.4 Rendering Rules



\- Use stable and unique keys when rendering lists.

\- Never use array indexes as keys when list items can change order or be removed.

\- Avoid unnecessary state duplication.

\- Avoid direct DOM manipulation unless necessary.

\- Never mutate React state directly.

\- Use controlled or uncontrolled inputs consistently.



\---



\## 3. Zero Div-Soup Policy



\*\*STRICT RULE: Avoid unnecessary `<div>` elements.\*\*



Do not use `<div>` as the default solution for every layout problem.



\### 3.1 Semantic HTML First



Choose elements based on their actual meaning:



| Purpose | Preferred Element |

|---|---|

| Main page content | `<main>` |

| Page header | `<header>` |

| Navigation | `<nav>` |

| Footer | `<footer>` |

| Independent content | `<article>` |

| Thematic grouping | `<section>` |

| Generic grouping | `<div>` |

| Inline grouping | `<span>` |

| Lists | `<ul>`, `<ol>`, `<li>` |

| Interactive action | `<button>` |

| Navigation link | `<a>` |

| Form grouping | `<fieldset>` |

| Form label | `<label>` |



\### 3.2 Container Restrictions



\- Do not nest multiple `<div>` elements without a clear purpose.

\- Do not introduce wrapper elements solely to apply CSS.

\- Prefer applying styles directly to an existing semantic element.

\- Use CSS Grid and Flexbox instead of adding extra layout wrappers.

\- Use Fragment (`<>...</>`) when a grouping element is unnecessary.

\- Use semantic elements only when their meaning matches the content.



\### 3.3 Acceptable Exceptions



`<div>` is permitted when:



\- No suitable semantic HTML element exists.

\- A generic layout container is genuinely necessary.

\- A third-party library requires a specific container.

\- A dedicated CSS positioning or layout boundary is needed.



\*\*Important:\*\* Zero Div-Soup does not mean eliminating every `<div>`. It means eliminating meaningless and unnecessary markup.



\---



\## 4. HTML Accessibility



All UI components must follow accessibility best practices.



\- Use semantic HTML elements.

\- Provide accessible names for interactive controls.

\- Add `aria-label` when a visible label is unavailable.

\- Use `aria-expanded` for expandable controls when appropriate.

\- Use `aria-controls` to associate controls with controlled elements.

\- Provide alternative text for meaningful images.

\- Ensure keyboard navigation works.

\- Maintain visible focus indicators.

\- Do not use ARIA attributes when native HTML already provides the required accessibility behavior.



Never use a clickable `<div>` as a replacement for a native `<button>` or `<a>`.



\---



\## 5. CSS and Styling Rules



\### 5.1 General Styling



\- Follow the existing styling architecture.

\- Avoid mixing multiple styling approaches without justification.

\- Prefer reusable design tokens.

\- Avoid excessive specificity.

\- Avoid unnecessary `!important`.

\- Do not use inline styles for large styling definitions.

\- Keep CSS organized and scoped appropriately.



\### 5.2 Responsive Design



All interfaces must support:



\- Desktop

\- Tablet

\- Mobile



Requirements:



\- Use responsive layouts.

\- Avoid fixed widths that cause horizontal overflow.

\- Prefer flexible sizing.

\- Ensure navigation and interactive elements work on touchscreens.

\- Test layouts at different viewport sizes.



\### 5.3 Design Consistency



Maintain consistency in:



\- Typography

\- Spacing

\- Colors

\- Border radius

\- Shadows

\- Buttons

\- Form elements

\- Interactive states



Do not introduce new visual styles without considering the existing design system.



\---



\## 6. Project Architecture



Follow the existing folder structure whenever possible.



Suggested structure:



```text

src/

├── assets/

│   ├── images/

│   └── icons/

├── components/

│   ├── common/

│   └── layout/

├── pages/

├── hooks/

├── services/

├── utils/

├── styles/

├── App.jsx

└── main.jsx

```



For TypeScript projects, use `.tsx` and `.ts` appropriately.



Rules:



\- Keep components, services, utilities, and hooks logically separated.

\- Avoid putting the entire application inside one component.

\- Avoid unnecessary folder nesting.

\- Do not create empty folders or placeholder files without purpose.

\- Do not reorganize the entire project unless explicitly requested.



\*\*Existing architecture takes priority over the suggested structure.\*\*



\---



\## 7. Code Quality and Naming Conventions



| Item | Convention |

|---|---|

| React Components | PascalCase |

| Variables | camelCase |

| Functions | camelCase |

| Custom Hooks | use + camelCase |

| Constants | UPPER\_SNAKE\_CASE when appropriate |

| CSS Classes | kebab-case |

| Files containing components | PascalCase when consistent with project conventions |



Additional rules:



\- Use descriptive variable and function names.

\- Avoid deeply nested conditional logic.

\- Avoid duplicated code.

\- Remove unused imports and variables.

\- Avoid unnecessary comments.

\- Comments should explain WHY, not simply WHAT.

\- Avoid overly long functions.

\- Handle errors explicitly.



\---



\## 8. State Management and Data Handling



\- Keep state as close as possible to where it is used.

\- Avoid global state for local UI concerns.

\- Do not duplicate server data unnecessarily.

\- Separate API communication from UI components when appropriate.

\- Handle loading, success, empty, and error states.

\- Validate user input.

\- Never expose API keys, passwords, or sensitive credentials in frontend code.



Do not introduce Redux, Zustand, or another state management library unless the project genuinely needs it.



\---



\## 9. Performance Optimization



AI agents must avoid:



\- Unnecessary component re-renders.

\- Excessive DOM elements.

\- Unoptimized images.

\- Unnecessary dependencies.

\- Expensive calculations during every render.

\- Duplicate API requests.

\- Memory leaks caused by improperly managed subscriptions or event listeners.



Use lazy loading and code splitting when they provide meaningful benefits.



Do not prematurely optimize simple components.



\---



\## 10. AI Coding Agent Constraints



These rules are mandatory for all AI agents.



\### 10.1 Before Making Changes



AI must:



1\. Inspect the existing project structure.

2\. Identify the framework, dependencies, and build system.

3\. Read relevant existing components.

4\. Understand the existing styling conventions.

5\. Identify potential conflicts before modifying code.



Never assume the project uses Vite, Next.js, TypeScript, Tailwind CSS, or another technology without checking.



\### 10.2 While Making Changes



AI must:



\- Modify only files relevant to the requested task.

\- Preserve existing functionality.

\- Follow React 19 conventions.

\- Follow the Zero Div-Soup policy.

\- Reuse existing components where appropriate.

\- Avoid unnecessary dependencies.

\- Avoid rewriting unrelated code.

\- Explain significant architectural changes.

\- Never silently remove existing functionality.



\### 10.3 Prohibited Actions



AI must NOT:



\- Replace the entire project structure without permission.

\- Install dependencies without a valid reason.

\- Introduce unnecessary abstraction layers.

\- Generate excessive wrapper components.

\- Use non-semantic HTML unnecessarily.

\- Disable linting or TypeScript checks to hide errors.

\- Hardcode sensitive information.

\- Claim code is tested when it has not been tested.

\- Invent files, functions, APIs, or dependencies that do not exist.



\### 10.4 After Making Changes



AI must:



1\. Check for syntax errors.

2\. Check imports and dependencies.

3\. Verify component behavior where possible.

4\. Run available linting and build commands when appropriate.

5\. Report modified files.

6\. Explain any remaining issues.



\---



\## 11. Mandatory AI Self-Review Checklist



Before considering any task complete, evaluate:



\- \[ ] Does the implementation follow React 19 conventions?

\- \[ ] Is the HTML semantic?

\- \[ ] Are there unnecessary `<div>` wrappers?

\- \[ ] Can existing components be reused?

\- \[ ] Is the component structure understandable?

\- \[ ] Is state management appropriate?

\- \[ ] Are accessibility requirements satisfied?

\- \[ ] Does the UI support responsive layouts?

\- \[ ] Are there unnecessary dependencies?

\- \[ ] Have existing features been preserved?

\- \[ ] Have available tests or build checks been performed?



If any requirement is not satisfied, fix it or explicitly explain why.



\---



\## 12. Final Development Philosophy



Every implementation must follow these priorities:



1\. Correctness over cleverness.

2\. Readability over excessive abstraction.

3\. Semantic HTML over generic containers.

4\. Reusability over duplication.

5\. Maintainability over short-term convenience.

6\. Simplicity over unnecessary complexity.



\*\*Final Instruction to AI:\*\*



> Act as a senior React 19 engineer. Before writing code, understand the existing project. Make minimal, deliberate changes. Prefer semantic HTML and maintainable component architecture. Strictly avoid Div-Soup. Never sacrifice existing functionality for unnecessary refactoring. If a requirement is ambiguous, ask before making assumptions.

