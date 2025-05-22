# Implementation Plan: Integrate Google A2A Protocol

This document outlines the steps required to provide basic support for the [Google Agent2Agent (A2A) protocol](https://github.com/google/A2A) in AnythingLLM. The goal is to expose a minimal A2A compatible endpoint and agent card so that external agents can discover and interact with the platform.

## 1. Serve an Agent Card
- Create a JSON document compliant with the A2A `AgentCard` specification.
- Host the card at `/.well-known/agent.json`.
- Include basic metadata describing AnythingLLM and the base service URL (`/a2a/api`).
- Initially advertise only simple chat capability with no streaming or push notification support.

## 2. JSON‑RPC Endpoint
- Add an Express route at `/a2a/api` to handle JSON‑RPC requests.
- Validate the incoming request structure (`jsonrpc`, `method`, `params`).
- For now, implement a stub handler for `message/send` that returns a placeholder response.
- Respond with JSON‑RPC errors for unsupported methods or invalid payloads.

## 3. Future Enhancements
- Implement task management (`tasks/get`, `tasks/cancel`, etc.) with persistent state.
- Add SSE support for `message/stream` and `tasks/resubscribe` when streaming is enabled.
- Support push notifications via `tasks/pushNotificationConfig/*`.
- Expose additional skills in the agent card as new capabilities are added.

## 4. Deployment Notes
- `PUBLIC_BASE_URL` environment variable should reflect the externally reachable URL of the server so that the agent card contains the correct service endpoint.
- Ensure TLS is enabled in production deployments as required by the A2A specification.

This initial integration allows experimentation with A2A while leaving room for a more complete implementation in the future.
