# AGENTS.md

## Project Overview

Super T is a supermarket management platform built with:

- Next.js
- React
- TypeScript
- Tailwind CSS
- Radix UI

The application currently uses browser localStorage persistence through a repository abstraction layer.

---

# Architecture

The application follows this flow:

UI Components
↓
Services
↓
Repositories
↓
Persistence Layer

Business logic should not exist directly inside UI components.

Direct localStorage access outside repositories is forbidden.

---

# Core Rules

## Preserve Existing UX

- Do not redesign the UI unless requested
- Preserve navigation behavior
- Preserve current workflows

## Keep Architecture Consistent

- Reuse repository pattern
- Keep services isolated
- Keep components modular
- Avoid tight coupling

## State Management

- Use existing Context API patterns
- Avoid introducing Redux
- Avoid duplicated state

## Persistence Rules

- Do not directly manipulate localStorage outside repositories
- Preserve compatibility with existing stored data
- Keep persistence abstracted for future database migration

---

# Coding Standards

## TypeScript

- Prefer strict typing
- Avoid `any`
- Avoid unsafe casting

## Components

- Prefer small reusable components
- Avoid files larger than 300-400 LOC
- Extract repeated UI logic

## Validation

- Use Zod schemas
- Validate forms properly
- Avoid silent failures

---

# Performance Rules

- Avoid unnecessary re-renders
- Memoize expensive calculations when needed
- Avoid duplicated fetch/storage logic

---

# Forbidden Changes

Do NOT:

- Rewrite the entire architecture
- Replace persistence layer without request
- Add large dependencies unnecessarily
- Remove validations
- Hardcode secrets
- Disable linting or type checking

---

# Required Validation

Before completing tasks, run:

```bash
npm run lint
npm run build
npm run typecheck
npm run test
```

If a script does not exist, create it properly.

---

# Repository Goals

Priority order:

1. Stability
2. Maintainability
3. Modularity
4. Type safety
5. Scalability

Do not prioritize premature optimization.

---

# Suggested Refactor Priorities

Focus areas:

- Large components
- Duplicated business logic
- Missing validations
- Type safety improvements
- Test coverage
- Accessibility improvements

---

# Recommended Workflow

For large tasks:

1. Analyze first
2. Produce a plan
3. Apply scoped changes
4. Validate
5. Document modifications

Avoid massive uncontrolled refactors.

---

# Documentation Rules

When making significant changes:

- Update README if needed
- Document architectural changes
- Keep code self-descriptive
- Add comments only when necessary

---

# Future Migration Considerations

The architecture should remain compatible with future:

- SQLite support
- PostgreSQL support
- Cloud synchronization
- Multi-user environments
- API backend extraction

Avoid assumptions that lock the project permanently into localStorage.