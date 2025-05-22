# Implementation Plan: Integrate Google A2A Protocol

This document tracks the steps to expose AnythingLLM through Google's [Agent2Agent (A2A) protocol](https://github.com/google/A2A).  The initial version of the implementation is already in place and new items build on top of it.

## Phase 1 - Minimal Support (completed)
- **Agent card** served at `/.well-known/agent.json` describing the A2A endpoint and advertising streaming and webhook capabilities.
- **JSON‑RPC endpoint** at `/a2a/api` validating requests and supporting:
  - `message/send` – creates a task and returns the full object.
  - `message/stream` – single-event SSE response.
  - `tasks/get` and `tasks/cancel` for basic in-memory task management.
  - `tasks/pushNotificationConfig/set` and `/get` to configure a global webhook that receives the created task payload.
- Tasks are stored in an in-memory `Map` and push notifications fire when a task is created.

## Phase 2 - Near‑term Improvements
These features are planned next to make the A2A implementation spec‑complete:
- Per‑task webhook configuration including token echo in the `X-A2A-Notification-Token` header.
- Keep the SSE `message/stream` connection open and emit periodic status updates; add a `tasks/resubscribe` method.
- Lightweight bearer authentication middleware and corresponding `securitySchemes` entry in the agent card.
- Populate `status.message` when creating a task so clients immediately receive a valid response structure.
- Optionally purge old tasks from the in-memory store after a timeout.

## Future Enhancements
- Persist tasks in a database or external store instead of memory.
- Extend the agent card with additional skills and metadata as new features are added.
- Expand automated tests and lint checks once CI installs dependencies.

## Deployment Notes
- Set `PUBLIC_BASE_URL` to the externally reachable server URL so the agent card advertises the correct endpoint.
- Enable TLS in production as required by the A2A specification.
