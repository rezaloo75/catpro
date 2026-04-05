# Creation Mode — How It Works

Creation mode is a prototype state that demonstrates "bottom-up" and "top-down" API lifecycle flows against an empty org. Toggle it via the **Prototype Mode** switcher at the bottom of the left nav.

---

## What changes in Creation mode

- The catalog starts empty (no pre-seeded interfaces)
- Left nav is scoped to the relevant surfaces: **API Gateway**, **AI Gateway**, **Dev Portal**, **Context Mesh**
- Creation CTAs appear across the product

---

## Flow 1 — Bottom-up: Gateway → Catalog

An SRE creates a service on a gateway control plane. The catalog entry is created automatically, with no catalog knowledge required.

1. Navigate to **API Gateway**
2. Click **+ New Service** (top right)
3. Select the target control plane, enter a service name, upstream URL, and optional routes
4. Click **Create Service**

**What happens behind the scenes:** a `Generic API` catalog entry is created automatically, pre-linked to the gateway CP with the service and route objects mapped.

The catalog user can then:
1. Go to **Catalog**, find the new `Generic API` entry
2. Open it and click **Change Type** (top right of the detail header)
3. Promote it to `REST API` — or revert back to `Generic API`

---

## Flow 2 — Top-down: Catalog → Gateway (REST API wizard)

A developer or API owner designs a new API starting from the catalog.

1. In **Catalog**, click **+ New** (top right) and select **REST API**
2. The wizard walks through:
   - **Step 1** — API identity (name, description, spec). Use *Pre-fill for me* to auto-populate with a sample OpenAPI spec (Open Brewery DB). The owner defaults to *Donkey Kong* and business capability is deduced from the spec.
   - **Step 2** — Gateway linkage (yes/no). If yes, select the control plane.
   - **Step 3** — Dev Portal publication (yes/no). If yes, select the portal.
   - **Step 4** — Observability, Metering, Context Mesh toggles.
3. Click **Create** — the interface appears in the catalog with all linked surfaces populated.

---

## Flow 3 — Portal-first: Dev Portal → Catalog

A product owner publishes an API starting from the Dev Portal.

1. Navigate to **Dev Portal**
2. Click **+ Publish** (top right)
3. The REST API wizard opens in portal-first mode: gateway is pre-set to *no*, portal is pre-set to *yes*
4. Complete the wizard — the API is created in the catalog and immediately published to the selected portal

---

## Surfaces visible in Creation mode

| Surface | Role in Creation flows |
|---|---|
| Catalog | Central record; starting point for top-down flows; destination for bottom-up flows |
| API Gateway | SRE creates services → auto-creates Generic API catalog entries |
| AI Gateway | Visible for AI-type interface flows (future) |
| Dev Portal | Portal-first publishing; view APIs published through the wizard |
| Context Mesh | View interfaces registered via the wizard |

---

## Key constraints (prototype scope)

- Type promotion is limited to `Generic API ↔ REST API`
- Only API Gateway services auto-create catalog entries; Event Gateway is hidden in Creation mode
- Metering & Billing, Observability, and Identity are hidden in Creation mode
- All created data is in-memory and resets on page reload
