# Demo Vibe-Coding Project Spec

## Project Summary

We are building a collaborative vibe-coding dashboard where non-technical founders can describe app behavior in natural language and see it materialize in real time. The MVP must prioritize a smooth onboarding flow, feature proposal approvals, and an execution timeline.

## Architecture & Stack

- Frontend: Vite + React + Tailwind + shadcn/ui
- Backend: Supabase functions for persistence and authentication
- Realtime updates: Supabase channels
- Auth: Magic-link email auth with rate limiting
- Hosting: Vercel for frontend, Supabase for backend

## Key Routes

/login  
/dashboard  
/projects/:id  
/projects/:id/spec  
/projects/:id/proposals  
/projects/:id/activity-log

## Core Base Web Requirements

The base app must include layout scaffolding, authentication guard, global navigation, per-project sidebar, and a realtime status panel surface. It also needs a shared document viewer/editor that stays in sync with the Supabase document store.

## Layered Features

- Project creation wizard with document upload
- Feature proposal table with approval workflow
- NLP command console per project
- Task queue view that shows pending, running, blocked, done
- Activity log with filters for proposals, tasks, and approvals
- Role-based access control (viewer, editor, approver)
- Email + in-app notifications for proposal decisions
- Workspace settings for default tech stack, repo links, and deployment targets

## Future Ideas

- AI-assisted task decomposition hints
- Visual diff viewer for applied patches
- Plugin system for third-party integrations (Slack, Linear, GitHub)

