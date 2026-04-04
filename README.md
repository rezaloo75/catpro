# Catalog — Kong Konnect Concept Prototype

A high-fidelity interactive prototype demonstrating a future vision for the **Catalog** app in Kong Konnect. Catalog is a minimal, interface-centric system of record for a banking enterprise, connecting interfaces to gateway runtimes, developer portals, observability, metering, and AI composition (Context Mesh).

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build

```bash
npm run build
npm run preview   # preview the production build
```

## Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- React Router 7
- Lucide React (icons)
- All data is local mock — no backend required

## Data Model

Every catalog object is an **Interface**. Interfaces have one of five types:

| Type | Spec | Description |
|------|------|-------------|
| **REST API** | OpenAPI | Standard REST APIs |
| **Event API** | AsyncAPI | Kafka/event-stream interfaces |
| **LLM API** | OpenAPI | REST APIs fronting LLM models |
| **MCP** | MCP | Model Context Protocol servers composed from other interfaces |
| **Generic API** | Unknown | SOAP, UDP, mainframe, or unclassified interfaces |

### Key relationships

- **Gateway Link**: An interface may be linked to an API Gateway, Event Gateway, or AI Gateway instance with specific objects (services, routes, topics, AI routes, etc.)
- **Associated Apps**: An interface may be associated with Observability, Developer Portal, Metering & Billing, and/or Context Mesh
- **Dependencies**: Interfaces can have upstream/downstream relationships. MCP interfaces specifically *compose from* other interfaces, pulling endpoints, topics, and tools into a unified AI-consumable surface

### Seed Dataset

50 interfaces representing Meridian Bank (fictional):

- 18 REST APIs (Account Balance, Payment Initiation, Card Management, etc.)
- 8 Event APIs (Payment Settled, Card Authorization, AML Alert, etc.)
- 6 LLM APIs (Document Summarization, KYC Review, Fraud Narrative, etc.)
- 8 MCP interfaces (RM Copilot, AML Investigator, Mortgage Underwriting, etc.)
- 10 Generic APIs (SWIFT Gateway, COBOL Batch Settlement, Mainframe, etc.)

Domains span Retail Banking, Payments, Cards, Fraud, AML/Compliance, Treasury, Lending, Open Banking, and more.

## Prototype Structure

### Views

1. **Catalog Landing** (`/catalog`) — Search, faceted filters, saved views, summary tiles, table/card toggle
2. **Interface Detail** (`/interfaces/:id`) — Header + six tabs:
   - **Overview** — Description, summary fields, spec preview, consumers, tags
   - **Connectivity** — Gateway linkage with objects and navigation to gateway views
   - **Associated Apps** — Cards for Observability, Portal, Metering, Context Mesh with association state
   - **Composition** — Dependency graph showing MCP composition from source interfaces
   - **Spec** — Spec preview with type-specific rendering; inferred metadata for Generic APIs
   - **Governance** — Scorecard, checklist, staleness indicator, security posture
3. **Mock Destination Pages** — Believable linked landing pages for:
   - API / Event / AI Gateway
   - Observability
   - Developer Portal
   - Metering & Billing
   - Context Mesh

### Left Navigation

Mirrors the Konnect platform: Catalog, API Gateway, Event Gateway, AI Gateway, Observability, Developer Portal, Metering & Billing, Context Mesh, Settings.

## Key Product Concepts Demonstrated

- **Interface-first model**: Everything in Catalog is an Interface — simple, flat, and obvious
- **Gateway linkage**: 1:1 relationship between an interface and a specific gateway runtime
- **App associations**: Non-connectivity relationships to observability, portal, billing, and AI composition
- **MCP composition**: MCP interfaces compose tools from REST, Event, LLM, and external sources
- **Generic APIs**: Even partially-known interfaces (SWIFT, mainframe, COBOL) are first-class citizens
- **Governance scorecard**: Quick health check across documentation, runtime, portal, observability, compliance
- **Context Mesh**: AI composition layer where interfaces become tools for LLM agents

## File Structure

```
src/
  types/index.ts        — TypeScript type definitions
  data/interfaces.ts    — 50 seed interfaces with full metadata
  hooks/                — Filter/search logic
  components/           — Reusable UI (pills, badges, filter bar, table, cards, layout)
  pages/                — All page-level views
  App.tsx               — Router setup
  main.tsx              — Entry point
```
