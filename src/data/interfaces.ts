import type { CatalogInterface, PortalPublication } from '../types';

// Named portals available at Meridian Bank
const PORTALS = {
  external: { portalName: 'Meridian External Developer Portal', portalId: 'portal-ext-001', audience: 'External' as const, visibility: 'Public' as const, status: 'Published' as const },
  internal: { portalName: 'Meridian Internal API Portal', portalId: 'portal-int-001', audience: 'Internal' as const, visibility: 'Private' as const, status: 'Published' as const },
  partner: { portalName: 'Meridian Partner Portal', portalId: 'portal-partner-001', audience: 'Partner' as const, visibility: 'Private' as const, status: 'Published' as const },
};

// Named MCP registries
const REGISTRIES = {
  enterprise: { registryName: 'Enterprise Agent Registry', registryId: 'registry-001', agents: ['Relationship Manager Copilot', 'Contact Center Agent', 'Compliance Assistant'] },
  compliance: { registryName: 'Compliance & Risk Registry', registryId: 'registry-002', agents: ['AML Investigator', 'Compliance Assistant', 'KYC Review Agent'] },
  lending: { registryName: 'Lending Operations Registry', registryId: 'registry-003', agents: ['Mortgage Underwriting Agent', 'Credit Decision Agent'] },
};

type PortalConfig = PortalPublication[];
type RegistryConfig = { toolsExposed: number; agents: string[] }[];

const noAssoc = (obs = false, portalPubs?: PortalConfig, meter = false, meshRegistries?: RegistryConfig) => ({
  observability: obs
    ? { linked: true, summary: 'Dashboards & SLOs configured', linkedObjectsCount: 3, details: { sloTarget: '99.9%', errorBudgetRemaining: '72%' } }
    : { linked: false },
  portal: portalPubs && portalPubs.length > 0
    ? { linked: true, summary: `Published to ${portalPubs.length} portal${portalPubs.length > 1 ? 's' : ''}`, linkedObjectsCount: portalPubs.length, publications: portalPubs }
    : { linked: false },
  meteringBilling: meter
    ? { linked: true, summary: 'Active billing product', linkedObjectsCount: 2, details: { plans: 3, monthlyRevenue: '$12,400' } }
    : { linked: false },
  contextMesh: meshRegistries && meshRegistries.length > 0
    ? { linked: true, summary: 'Available as source interface', linkedObjectsCount: meshRegistries.length }
    : { linked: false },
});

// Shorthand for common portal combos
const extPortal: PortalConfig = [PORTALS.external];
const intPortal: PortalConfig = [PORTALS.internal];
const extIntPortal: PortalConfig = [PORTALS.external, PORTALS.internal];
const partnerPortal: PortalConfig = [PORTALS.external, PORTALS.partner];

// MCP association helper — MCPs get published to registries, not the generic noAssoc
const mcpAssoc = (obs: boolean, portalPubs: PortalConfig | undefined, registries: (keyof typeof REGISTRIES)[], toolsExposed: number) => ({
  observability: obs
    ? { linked: true, summary: 'Tool usage analytics & latency monitoring', linkedObjectsCount: 2 }
    : { linked: false },
  portal: portalPubs && portalPubs.length > 0
    ? { linked: true, summary: `Documented in ${portalPubs.length} portal${portalPubs.length > 1 ? 's' : ''}`, linkedObjectsCount: portalPubs.length, publications: portalPubs }
    : { linked: false },
  meteringBilling: { linked: false },
  contextMesh: {
    linked: true,
    summary: `Published to ${registries.length} MCP registr${registries.length > 1 ? 'ies' : 'y'}`,
    linkedObjectsCount: toolsExposed,
    details: { toolsExposed, sourceInterfaces: 0 },
    registries: registries.map(r => ({ ...REGISTRIES[r], toolsExposed })),
  },
});

export const interfaces: CatalogInterface[] = [
  // ============ REST APIs (18) ============
  {
    id: 'rest-001',
    name: 'Account Balance API',
    type: 'REST API',
    origin: 'portal',
    description: 'Provides real-time balance inquiries for checking, savings, and money market accounts. Supports batch queries for portfolio-level views.',
    domain: 'Retail Banking',
    businessCapability: 'Account Management',
    ownerTeam: 'Deposits Platform',
    lifecycleStatus: 'Active',
    environments: ['Production', 'Staging', 'Development'],
    region: 'US-East, EU-West',
    complianceTags: ['PCI', 'SOX'],
    criticality: 'Mission Critical',
    dataClassification: 'Confidential',
    authPattern: 'OAuth 2.0 + mTLS',
    version: 'v3.2.1',
    specType: 'OpenAPI',
    specSnippet: `openapi: 3.0.3
info:
  title: Account Balance API
  version: 3.2.1
paths:
  /accounts/{accountId}/balance:
    get:
      summary: Get account balance
      parameters:
        - name: accountId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Current balance
          content:
            application/json:
              schema:
                type: object
                properties:
                  available: { type: number }
                  current: { type: number }
                  currency: { type: string }`,
    gatewayLink: {
      gatewayProductType: 'api',
      controlPlaneName: 'retail-banking-cp',
      gatewayInstanceName: 'us-east-prod-gw-01',
      environment: 'Production',
      objects: [
        { type: 'Service', name: 'account-balance-svc', id: 'svc-001' },
        { type: 'Route', name: '/api/v3/accounts/*/balance', id: 'rt-001' },
        { type: 'Plugin', name: 'rate-limiting', id: 'plg-001' },
        { type: 'Plugin', name: 'oauth2', id: 'plg-002' },
      ],
      navigableTargetId: 'gw-api-001',
    },
    associatedApps: noAssoc(true, extIntPortal, true),
    dependencies: [
      { interfaceId: 'rest-010', interfaceName: 'Core Banking Ledger API', type: 'REST API', relationship: 'upstream' },
    ],
    consumers: ['Mobile Banking App', 'Online Banking Portal', 'Relationship Manager Copilot MCP'],
    tags: ['core', 'high-traffic', 'open-banking'],
    updatedAt: '2026-03-28',
    createdAt: '2022-06-15',
  },
  {
    id: 'rest-002',
    name: 'Payment Initiation API',
    type: 'REST API',
    origin: 'portal',
    description: 'Handles domestic and international payment initiation including ACH, wire transfers, and instant payments. PSD2 compliant.',
    domain: 'Payments',
    businessCapability: 'Payment Processing',
    ownerTeam: 'Payments Platform',
    lifecycleStatus: 'Active',
    environments: ['Production', 'Staging'],
    region: 'US-East, EU-West, APAC',
    complianceTags: ['PCI', 'PSD2', 'SOX'],
    criticality: 'Mission Critical',
    dataClassification: 'Confidential',
    authPattern: 'OAuth 2.0 + PKCE',
    version: 'v2.8.0',
    specType: 'OpenAPI',
    specSnippet: `openapi: 3.0.3
info:
  title: Payment Initiation API
  version: 2.8.0
paths:
  /payments:
    post:
      summary: Initiate a payment
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                amount: { type: number }
                currency: { type: string }
                debtorAccount: { type: string }
                creditorAccount: { type: string }`,
    gatewayLink: {
      gatewayProductType: 'api',
      controlPlaneName: 'payments-cp',
      gatewayInstanceName: 'payments-prod-gw',
      environment: 'Production',
      objects: [
        { type: 'Service', name: 'payment-initiation-svc', id: 'svc-002' },
        { type: 'Route', name: '/api/v2/payments', id: 'rt-002' },
        { type: 'Plugin', name: 'rate-limiting', id: 'plg-003' },
        { type: 'Plugin', name: 'request-transformer', id: 'plg-004' },
      ],
      navigableTargetId: 'gw-api-002',
    },
    associatedApps: noAssoc(true, extPortal, true),
    dependencies: [
      { interfaceId: 'event-001', interfaceName: 'Payment Settled Events', type: 'Event API', relationship: 'downstream' },
    ],
    consumers: ['Mobile Banking App', 'Online Banking Portal', 'Open Banking Partners'],
    tags: ['payments', 'psd2', 'open-banking', 'high-traffic'],
    updatedAt: '2026-03-25',
    createdAt: '2021-09-01',
  },
  {
    id: 'rest-003',
    name: 'Card Management API',
    type: 'REST API',
    origin: 'api-gateway',
    description: 'Full lifecycle card management including issuance, activation, PIN management, spending limits, and card controls.',
    domain: 'Cards',
    businessCapability: 'Card Operations',
    ownerTeam: 'Cards Platform',
    lifecycleStatus: 'Active',
    environments: ['Production', 'Staging', 'Development'],
    region: 'US-East, EU-West',
    complianceTags: ['PCI', 'PCI-DSS'],
    criticality: 'Business Critical',
    dataClassification: 'Restricted',
    authPattern: 'OAuth 2.0 + mTLS',
    version: 'v4.1.0',
    specType: 'OpenAPI',
    specSnippet: `openapi: 3.0.3
info:
  title: Card Management API
  version: 4.1.0
paths:
  /cards/{cardId}:
    get:
      summary: Get card details
  /cards/{cardId}/controls:
    put:
      summary: Update card controls`,
    gatewayLink: {
      gatewayProductType: 'api',
      controlPlaneName: 'cards-cp',
      gatewayInstanceName: 'cards-prod-gw',
      environment: 'Production',
      objects: [
        { type: 'Service', name: 'card-management-svc', id: 'svc-003' },
        { type: 'Route', name: '/api/v4/cards/*', id: 'rt-003' },
      ],
      navigableTargetId: 'gw-api-003',
    },
    associatedApps: noAssoc(true, extPortal, false),
    dependencies: [],
    consumers: ['Mobile Banking App', 'Card Disputes Resolution MCP', 'Contact Center'],
    tags: ['cards', 'pci', 'sensitive'],
    updatedAt: '2026-03-20',
    createdAt: '2023-01-10',
  },
  {
    id: 'rest-004',
    name: 'Customer Profile API',
    type: 'REST API',
    origin: 'portal',
    description: 'Golden source for customer identity, KYC data, contact preferences, and relationship metadata across all business lines.',
    domain: 'Customer Profile / Identity',
    businessCapability: 'Customer Data Management',
    ownerTeam: 'Core Banking Modernization',
    lifecycleStatus: 'Active',
    environments: ['Production', 'Staging', 'Development'],
    region: 'US-East, EU-West',
    complianceTags: ['PII', 'GDPR', 'KYC'],
    criticality: 'Mission Critical',
    dataClassification: 'Restricted',
    authPattern: 'OAuth 2.0',
    version: 'v5.0.2',
    specType: 'OpenAPI',
    specSnippet: `openapi: 3.0.3
info:
  title: Customer Profile API
  version: 5.0.2
paths:
  /customers/{customerId}:
    get:
      summary: Get customer profile
  /customers/{customerId}/kyc:
    get:
      summary: Get KYC status`,
    gatewayLink: {
      gatewayProductType: 'api',
      controlPlaneName: 'customer-cp',
      gatewayInstanceName: 'customer-prod-gw',
      environment: 'Production',
      objects: [
        { type: 'Service', name: 'customer-profile-svc', id: 'svc-004' },
        { type: 'Route', name: '/api/v5/customers/*', id: 'rt-004' },
        { type: 'Plugin', name: 'pii-masking', id: 'plg-005' },
      ],
      navigableTargetId: 'gw-api-004',
    },
    associatedApps: noAssoc(true, intPortal, false),
    dependencies: [
      { interfaceId: 'event-003', interfaceName: 'Customer Profile Changed Events', type: 'Event API', relationship: 'downstream' },
    ],
    consumers: ['All Business Lines', 'KYC Review Assistant LLM API', 'AML Investigator MCP'],
    tags: ['customer', 'identity', 'pii', 'golden-source'],
    updatedAt: '2026-03-30',
    createdAt: '2020-03-22',
  },
  {
    id: 'rest-005',
    name: 'Fraud Detection API',
    type: 'REST API',
    origin: 'api-gateway',
    description: 'Real-time fraud scoring and transaction risk assessment. Returns risk score, recommended action, and explainability factors.',
    domain: 'Fraud',
    businessCapability: 'Fraud Prevention',
    ownerTeam: 'Fraud Engineering',
    lifecycleStatus: 'Active',
    environments: ['Production', 'Staging'],
    region: 'US-East, EU-West, APAC',
    complianceTags: ['SOX', 'Internal'],
    criticality: 'Mission Critical',
    dataClassification: 'Confidential',
    authPattern: 'mTLS + API Key',
    version: 'v2.3.0',
    specType: 'OpenAPI',
    specSnippet: `openapi: 3.0.3
info:
  title: Fraud Detection API
  version: 2.3.0
paths:
  /fraud/score:
    post:
      summary: Score transaction for fraud risk
      responses:
        '200':
          description: Risk assessment
          content:
            application/json:
              schema:
                type: object
                properties:
                  riskScore: { type: number }
                  action: { type: string, enum: [allow, review, block] }`,
    gatewayLink: {
      gatewayProductType: 'api',
      controlPlaneName: 'fraud-cp',
      gatewayInstanceName: 'fraud-prod-gw',
      environment: 'Production',
      objects: [
        { type: 'Service', name: 'fraud-detection-svc', id: 'svc-005' },
        { type: 'Route', name: '/api/v2/fraud/*', id: 'rt-005' },
      ],
      navigableTargetId: 'gw-api-005',
    },
    associatedApps: noAssoc(true, undefined, false),
    dependencies: [],
    consumers: ['Payment Initiation API', 'Card Authorization Service', 'AML Investigator MCP'],
    tags: ['fraud', 'real-time', 'ml-backed'],
    updatedAt: '2026-03-27',
    createdAt: '2023-05-14',
  },
  {
    id: 'rest-006',
    name: 'Loan Origination API',
    type: 'REST API',
    origin: 'portal',
    description: 'Manages the full loan application lifecycle from submission through decisioning and disbursement for personal and auto loans.',
    domain: 'Lending / Mortgage',
    businessCapability: 'Lending Operations',
    ownerTeam: 'Lending Platform',
    lifecycleStatus: 'Active',
    environments: ['Production', 'Staging'],
    region: 'US-East',
    complianceTags: ['SOX', 'Fair Lending'],
    criticality: 'Business Critical',
    dataClassification: 'Confidential',
    authPattern: 'OAuth 2.0',
    version: 'v3.0.0',
    specType: 'OpenAPI',
    specSnippet: `openapi: 3.0.3
info:
  title: Loan Origination API
  version: 3.0.0
paths:
  /loans/applications:
    post:
      summary: Submit loan application
  /loans/applications/{appId}/decision:
    get:
      summary: Get underwriting decision`,
    gatewayLink: {
      gatewayProductType: 'api',
      controlPlaneName: 'lending-cp',
      gatewayInstanceName: 'lending-prod-gw',
      environment: 'Production',
      objects: [
        { type: 'Service', name: 'loan-origination-svc', id: 'svc-006' },
        { type: 'Route', name: '/api/v3/loans/*', id: 'rt-006' },
      ],
      navigableTargetId: 'gw-api-006',
    },
    associatedApps: noAssoc(true, extPortal, false),
    dependencies: [
      { interfaceId: 'rest-004', interfaceName: 'Customer Profile API', type: 'REST API', relationship: 'upstream' },
      { interfaceId: 'event-006', interfaceName: 'Loan Application Status Events', type: 'Event API', relationship: 'downstream' },
    ],
    consumers: ['Online Banking Portal', 'Branch Systems', 'Mortgage Underwriting MCP'],
    tags: ['lending', 'origination'],
    updatedAt: '2026-03-18',
    createdAt: '2024-01-20',
  },
  {
    id: 'rest-007',
    name: 'Open Banking Consent API',
    type: 'REST API',
    origin: 'portal',
    description: 'Manages third-party consent grants for account access under Open Banking regulations. Supports creation, revocation, and audit.',
    domain: 'Open Banking',
    businessCapability: 'Open Banking Compliance',
    ownerTeam: 'Open Banking Team',
    lifecycleStatus: 'Active',
    environments: ['Production', 'Staging'],
    region: 'EU-West, UK',
    complianceTags: ['PSD2', 'Open Banking', 'GDPR'],
    criticality: 'Mission Critical',
    dataClassification: 'Confidential',
    authPattern: 'OAuth 2.0 + FAPI',
    version: 'v2.1.0',
    specType: 'OpenAPI',
    specSnippet: `openapi: 3.0.3
info:
  title: Open Banking Consent API
  version: 2.1.0
paths:
  /consents:
    post:
      summary: Create consent
  /consents/{consentId}:
    get:
      summary: Get consent status
    delete:
      summary: Revoke consent`,
    gatewayLink: {
      gatewayProductType: 'api',
      controlPlaneName: 'openbanking-cp',
      gatewayInstanceName: 'ob-prod-gw-eu',
      environment: 'Production',
      objects: [
        { type: 'Service', name: 'consent-svc', id: 'svc-007' },
        { type: 'Route', name: '/open-banking/v2/consents/*', id: 'rt-007' },
        { type: 'Plugin', name: 'fapi-compliance', id: 'plg-006' },
      ],
      navigableTargetId: 'gw-api-007',
    },
    associatedApps: noAssoc(true, partnerPortal, false),
    dependencies: [],
    consumers: ['Third-Party Providers', 'Open Banking Aggregators'],
    tags: ['open-banking', 'consent', 'psd2', 'external'],
    updatedAt: '2026-03-22',
    createdAt: '2022-11-05',
  },
  {
    id: 'rest-008',
    name: 'Statement Generation API',
    type: 'REST API',
    origin: 'api-gateway',
    description: 'Generates account statements in PDF and structured data formats. Supports on-demand and scheduled generation.',
    domain: 'Statements / Documents',
    businessCapability: 'Document Management',
    ownerTeam: 'Deposits Platform',
    lifecycleStatus: 'Active',
    environments: ['Production'],
    region: 'US-East',
    complianceTags: ['SOX'],
    criticality: 'Standard',
    dataClassification: 'Confidential',
    authPattern: 'OAuth 2.0',
    version: 'v1.5.0',
    specType: 'OpenAPI',
    specSnippet: `openapi: 3.0.3
info:
  title: Statement Generation API
  version: 1.5.0
paths:
  /statements/{accountId}:
    get:
      summary: Get statements list
  /statements/{accountId}/generate:
    post:
      summary: Generate statement on demand`,
    gatewayLink: {
      gatewayProductType: 'api',
      controlPlaneName: 'retail-banking-cp',
      gatewayInstanceName: 'us-east-prod-gw-01',
      environment: 'Production',
      objects: [
        { type: 'Service', name: 'statement-gen-svc', id: 'svc-008' },
        { type: 'Route', name: '/api/v1/statements/*', id: 'rt-008' },
      ],
      navigableTargetId: 'gw-api-008',
    },
    associatedApps: noAssoc(true, undefined, false),
    dependencies: [
      { interfaceId: 'rest-001', interfaceName: 'Account Balance API', type: 'REST API', relationship: 'upstream' },
    ],
    consumers: ['Online Banking Portal', 'Mobile Banking App'],
    tags: ['statements', 'documents'],
    updatedAt: '2026-02-15',
    createdAt: '2023-06-10',
  },
  {
    id: 'rest-009',
    name: 'Notification Preferences API',
    type: 'REST API',
    origin: 'api-gateway',
    description: 'Manages customer notification preferences across channels including push, SMS, email, and in-app messaging.',
    domain: 'Notifications',
    businessCapability: 'Customer Communications',
    ownerTeam: 'Developer Platform',
    lifecycleStatus: 'Active',
    environments: ['Production', 'Staging', 'Development'],
    region: 'US-East, EU-West',
    complianceTags: ['GDPR', 'CAN-SPAM'],
    criticality: 'Standard',
    dataClassification: 'Internal',
    authPattern: 'OAuth 2.0',
    version: 'v2.0.0',
    specType: 'OpenAPI',
    specSnippet: `openapi: 3.0.3
info:
  title: Notification Preferences API
  version: 2.0.0
paths:
  /customers/{customerId}/preferences:
    get:
      summary: Get notification preferences
    put:
      summary: Update notification preferences`,
    gatewayLink: {
      gatewayProductType: 'api',
      controlPlaneName: 'shared-services-cp',
      gatewayInstanceName: 'shared-prod-gw',
      environment: 'Production',
      objects: [
        { type: 'Service', name: 'notification-pref-svc', id: 'svc-009' },
        { type: 'Route', name: '/api/v2/notifications/preferences/*', id: 'rt-009' },
      ],
      navigableTargetId: 'gw-api-009',
    },
    associatedApps: noAssoc(false, undefined, false),
    dependencies: [],
    consumers: ['Mobile Banking App', 'Online Banking Portal'],
    tags: ['notifications', 'preferences'],
    updatedAt: '2026-01-30',
    createdAt: '2024-03-12',
  },
  {
    id: 'rest-010',
    name: 'Core Banking Ledger API',
    type: 'REST API',
    origin: 'api-gateway',
    description: 'The authoritative ledger API for all core banking transactions. Double-entry bookkeeping, journal entries, and account reconciliation.',
    domain: 'Core Banking',
    businessCapability: 'Ledger Management',
    ownerTeam: 'Core Banking Modernization',
    lifecycleStatus: 'Active',
    environments: ['Production', 'Staging'],
    region: 'US-East',
    complianceTags: ['SOX', 'Internal'],
    criticality: 'Mission Critical',
    dataClassification: 'Restricted',
    authPattern: 'mTLS',
    version: 'v6.1.0',
    specType: 'OpenAPI',
    specSnippet: `openapi: 3.0.3
info:
  title: Core Banking Ledger API
  version: 6.1.0
paths:
  /ledger/entries:
    post:
      summary: Post journal entry
  /ledger/accounts/{accountId}/balance:
    get:
      summary: Get ledger balance`,
    gatewayLink: {
      gatewayProductType: 'api',
      controlPlaneName: 'core-banking-cp',
      gatewayInstanceName: 'core-prod-gw',
      environment: 'Production',
      objects: [
        { type: 'Service', name: 'core-ledger-svc', id: 'svc-010' },
        { type: 'Route', name: '/internal/v6/ledger/*', id: 'rt-010' },
      ],
      navigableTargetId: 'gw-api-010',
    },
    associatedApps: noAssoc(true, undefined, false),
    dependencies: [],
    consumers: ['Account Balance API', 'Payment Initiation API', 'Loan Origination API'],
    tags: ['core-banking', 'ledger', 'internal-only', 'critical-path'],
    updatedAt: '2026-03-30',
    createdAt: '2019-08-01',
  },
  {
    id: 'rest-011',
    name: 'FX Rates API',
    type: 'REST API',
    origin: 'api-gateway',
    description: 'Provides real-time and historical foreign exchange rates. Supports spot rates, forward rates, and cross-currency calculations.',
    domain: 'Foreign Exchange',
    businessCapability: 'FX Operations',
    ownerTeam: 'Treasury Platform',
    lifecycleStatus: 'Active',
    environments: ['Production', 'Staging'],
    region: 'US-East, EU-West, APAC',
    complianceTags: ['Internal'],
    criticality: 'Business Critical',
    dataClassification: 'Internal',
    authPattern: 'API Key + mTLS',
    version: 'v3.0.1',
    specType: 'OpenAPI',
    specSnippet: `openapi: 3.0.3
info:
  title: FX Rates API
  version: 3.0.1
paths:
  /fx/rates:
    get:
      summary: Get current FX rates
      parameters:
        - name: baseCurrency
          in: query
        - name: targetCurrency
          in: query`,
    gatewayLink: {
      gatewayProductType: 'api',
      controlPlaneName: 'treasury-cp',
      gatewayInstanceName: 'treasury-prod-gw',
      environment: 'Production',
      objects: [
        { type: 'Service', name: 'fx-rates-svc', id: 'svc-011' },
        { type: 'Route', name: '/api/v3/fx/rates', id: 'rt-011' },
      ],
      navigableTargetId: 'gw-api-011',
    },
    associatedApps: noAssoc(true, undefined, true),
    dependencies: [
      { interfaceId: 'event-005', interfaceName: 'FX Rate Updated Events', type: 'Event API', relationship: 'downstream' },
    ],
    consumers: ['Payment Initiation API', 'Treasury Dashboard', 'Treasury Liquidity Assistant MCP'],
    tags: ['fx', 'rates', 'treasury', 'market-data'],
    updatedAt: '2026-03-29',
    createdAt: '2022-02-18',
  },
  {
    id: 'rest-012',
    name: 'AML Screening API',
    type: 'REST API',
    origin: 'portal',
    description: 'Performs anti-money laundering screening against sanctions lists, PEP databases, and adverse media. Supports batch and real-time modes.',
    domain: 'AML / Compliance',
    businessCapability: 'AML Operations',
    ownerTeam: 'Risk Data Services',
    lifecycleStatus: 'Active',
    environments: ['Production', 'Staging'],
    region: 'US-East, EU-West',
    complianceTags: ['AML', 'BSA', 'OFAC', 'Internal'],
    criticality: 'Mission Critical',
    dataClassification: 'Restricted',
    authPattern: 'mTLS + API Key',
    version: 'v2.5.0',
    specType: 'OpenAPI',
    specSnippet: `openapi: 3.0.3
info:
  title: AML Screening API
  version: 2.5.0
paths:
  /aml/screen:
    post:
      summary: Screen entity against watchlists
  /aml/cases/{caseId}:
    get:
      summary: Get screening case details`,
    gatewayLink: {
      gatewayProductType: 'api',
      controlPlaneName: 'compliance-cp',
      gatewayInstanceName: 'compliance-prod-gw',
      environment: 'Production',
      objects: [
        { type: 'Service', name: 'aml-screening-svc', id: 'svc-012' },
        { type: 'Route', name: '/api/v2/aml/*', id: 'rt-012' },
      ],
      navigableTargetId: 'gw-api-012',
    },
    associatedApps: noAssoc(true, undefined, false),
    dependencies: [],
    consumers: ['Customer Onboarding', 'Payment Initiation API', 'AML Investigator MCP'],
    tags: ['aml', 'compliance', 'sanctions', 'screening'],
    updatedAt: '2026-03-26',
    createdAt: '2021-11-30',
  },
  {
    id: 'rest-013',
    name: 'Trade Finance Document API',
    type: 'REST API',
    origin: 'api-gateway',
    description: 'Manages letters of credit, bank guarantees, and trade finance documentation workflows.',
    domain: 'Trade Finance',
    businessCapability: 'Trade Finance Operations',
    ownerTeam: 'Treasury Platform',
    lifecycleStatus: 'Active',
    environments: ['Production'],
    region: 'EU-West, APAC',
    complianceTags: ['Internal', 'UCP600'],
    criticality: 'Business Critical',
    dataClassification: 'Confidential',
    authPattern: 'OAuth 2.0 + mTLS',
    version: 'v1.3.0',
    specType: 'OpenAPI',
    specSnippet: `openapi: 3.0.3
info:
  title: Trade Finance Document API
  version: 1.3.0
paths:
  /trade-finance/lc:
    post:
      summary: Create letter of credit
  /trade-finance/guarantees:
    get:
      summary: List bank guarantees`,
    gatewayLink: {
      gatewayProductType: 'api',
      controlPlaneName: 'treasury-cp',
      gatewayInstanceName: 'treasury-prod-gw',
      environment: 'Production',
      objects: [
        { type: 'Service', name: 'trade-finance-svc', id: 'svc-013' },
        { type: 'Route', name: '/api/v1/trade-finance/*', id: 'rt-013' },
      ],
      navigableTargetId: 'gw-api-013',
    },
    associatedApps: noAssoc(true, undefined, false),
    dependencies: [],
    consumers: ['Corporate Banking Portal', 'Trade Finance Ops Team'],
    tags: ['trade-finance', 'lc', 'guarantees'],
    updatedAt: '2026-02-20',
    createdAt: '2024-06-01',
  },
  {
    id: 'rest-014',
    name: 'Wealth Portfolio API',
    type: 'REST API',
    origin: 'api-gateway',
    description: 'Portfolio management API for wealth and investment accounts. Holdings, performance, asset allocation, and rebalancing.',
    domain: 'Wealth',
    businessCapability: 'Investment Management',
    ownerTeam: 'Wealth Platform',
    lifecycleStatus: 'Active',
    environments: ['Production', 'Staging'],
    region: 'US-East',
    complianceTags: ['SEC', 'Internal'],
    criticality: 'Business Critical',
    dataClassification: 'Confidential',
    authPattern: 'OAuth 2.0',
    version: 'v2.2.0',
    specType: 'OpenAPI',
    specSnippet: `openapi: 3.0.3
info:
  title: Wealth Portfolio API
  version: 2.2.0
paths:
  /portfolios/{portfolioId}:
    get:
      summary: Get portfolio summary
  /portfolios/{portfolioId}/holdings:
    get:
      summary: Get holdings breakdown`,
    gatewayLink: {
      gatewayProductType: 'api',
      controlPlaneName: 'wealth-cp',
      gatewayInstanceName: 'wealth-prod-gw',
      environment: 'Production',
      objects: [
        { type: 'Service', name: 'wealth-portfolio-svc', id: 'svc-014' },
        { type: 'Route', name: '/api/v2/portfolios/*', id: 'rt-014' },
      ],
      navigableTargetId: 'gw-api-014',
    },
    associatedApps: noAssoc(true, undefined, true),
    dependencies: [],
    consumers: ['Wealth Management Portal', 'Relationship Manager Copilot MCP', 'Financial Advisors'],
    tags: ['wealth', 'portfolio', 'investments'],
    updatedAt: '2026-03-15',
    createdAt: '2023-09-20',
  },
  {
    id: 'rest-015',
    name: 'Branch Locator API',
    type: 'REST API',
    origin: 'portal',
    description: 'Provides branch and ATM location data, hours of operation, available services, and real-time wait times.',
    domain: 'Branch / ATM',
    businessCapability: 'Channel Management',
    ownerTeam: 'Developer Platform',
    lifecycleStatus: 'Active',
    environments: ['Production'],
    region: 'US-East',
    complianceTags: [],
    criticality: 'Standard',
    dataClassification: 'Public',
    authPattern: 'API Key',
    version: 'v1.2.0',
    specType: 'OpenAPI',
    specSnippet: `openapi: 3.0.3
info:
  title: Branch Locator API
  version: 1.2.0
paths:
  /branches:
    get:
      summary: Search branches by location
  /atms:
    get:
      summary: Search ATMs by location`,
    gatewayLink: {
      gatewayProductType: 'api',
      controlPlaneName: 'shared-services-cp',
      gatewayInstanceName: 'shared-prod-gw',
      environment: 'Production',
      objects: [
        { type: 'Service', name: 'branch-locator-svc', id: 'svc-015' },
        { type: 'Route', name: '/api/v1/branches', id: 'rt-015' },
      ],
      navigableTargetId: 'gw-api-015',
    },
    associatedApps: noAssoc(false, extPortal, false),
    dependencies: [],
    consumers: ['Mobile Banking App', 'Public Website', 'Relationship Manager Copilot MCP'],
    tags: ['branches', 'atm', 'public'],
    updatedAt: '2026-01-10',
    createdAt: '2023-12-01',
  },
  {
    id: 'rest-016',
    name: 'Collections Workflow API',
    type: 'REST API',
    origin: 'portal',
    description: 'Manages collections cases, workout strategies, and payment arrangements for delinquent accounts.',
    domain: 'Collections',
    businessCapability: 'Collections Management',
    ownerTeam: 'Lending Platform',
    lifecycleStatus: 'Experimental',
    environments: ['Staging', 'Development'],
    region: 'US-East',
    complianceTags: ['FDCPA', 'Internal'],
    criticality: 'Standard',
    dataClassification: 'Confidential',
    authPattern: 'OAuth 2.0',
    version: 'v0.9.0',
    specType: 'OpenAPI',
    specSnippet: `openapi: 3.0.3
info:
  title: Collections Workflow API
  version: 0.9.0
paths:
  /collections/cases:
    get:
      summary: List collections cases
  /collections/cases/{caseId}/arrangements:
    post:
      summary: Create payment arrangement`,
    associatedApps: noAssoc(false, undefined, false),
    dependencies: [
      { interfaceId: 'rest-006', interfaceName: 'Loan Origination API', type: 'REST API', relationship: 'upstream' },
    ],
    consumers: ['Collections Agents', 'Collections Dashboard'],
    tags: ['collections', 'beta', 'lending'],
    updatedAt: '2026-03-10',
    createdAt: '2025-11-01',
  },
  {
    id: 'rest-017',
    name: 'CRM Case Management API',
    type: 'REST API',
    origin: 'api-gateway',
    description: 'Unified case management for customer service interactions, complaints, and service requests across all channels.',
    domain: 'CRM / Case Management',
    businessCapability: 'Customer Service',
    ownerTeam: 'Developer Platform',
    lifecycleStatus: 'Active',
    environments: ['Production', 'Staging'],
    region: 'US-East, EU-West',
    complianceTags: ['Internal'],
    criticality: 'Business Critical',
    dataClassification: 'Confidential',
    authPattern: 'OAuth 2.0',
    version: 'v3.1.0',
    specType: 'OpenAPI',
    specSnippet: `openapi: 3.0.3
info:
  title: CRM Case Management API
  version: 3.1.0
paths:
  /cases:
    post:
      summary: Create service case
  /cases/{caseId}:
    get:
      summary: Get case details`,
    gatewayLink: {
      gatewayProductType: 'api',
      controlPlaneName: 'shared-services-cp',
      gatewayInstanceName: 'shared-prod-gw',
      environment: 'Production',
      objects: [
        { type: 'Service', name: 'crm-case-svc', id: 'svc-017' },
        { type: 'Route', name: '/api/v3/cases/*', id: 'rt-017' },
      ],
      navigableTargetId: 'gw-api-017',
    },
    associatedApps: noAssoc(true, undefined, false),
    dependencies: [
      { interfaceId: 'rest-004', interfaceName: 'Customer Profile API', type: 'REST API', relationship: 'upstream' },
    ],
    consumers: ['Contact Center', 'Branch Staff Portal', 'Card Disputes Resolution MCP'],
    tags: ['crm', 'cases', 'customer-service'],
    updatedAt: '2026-03-20',
    createdAt: '2023-04-15',
  },
  {
    id: 'rest-018',
    name: 'Risk Exposure API',
    type: 'REST API',
    origin: 'api-gateway',
    description: 'Provides aggregated risk exposure data including credit risk, market risk, and operational risk metrics for regulatory reporting.',
    domain: 'Risk',
    businessCapability: 'Risk Management',
    ownerTeam: 'Risk Data Services',
    lifecycleStatus: 'Active',
    environments: ['Production'],
    region: 'US-East',
    complianceTags: ['Basel III', 'SOX', 'Internal'],
    criticality: 'Business Critical',
    dataClassification: 'Restricted',
    authPattern: 'mTLS',
    version: 'v1.8.0',
    specType: 'OpenAPI',
    specSnippet: `openapi: 3.0.3
info:
  title: Risk Exposure API
  version: 1.8.0
paths:
  /risk/exposure/credit:
    get:
      summary: Get credit risk exposure
  /risk/exposure/market:
    get:
      summary: Get market risk exposure`,
    gatewayLink: {
      gatewayProductType: 'api',
      controlPlaneName: 'risk-cp',
      gatewayInstanceName: 'risk-prod-gw',
      environment: 'Production',
      objects: [
        { type: 'Service', name: 'risk-exposure-svc', id: 'svc-018' },
        { type: 'Route', name: '/internal/v1/risk/*', id: 'rt-018' },
      ],
      navigableTargetId: 'gw-api-018',
    },
    associatedApps: noAssoc(true, undefined, false),
    dependencies: [],
    consumers: ['Regulatory Reporting Engine', 'Executive Dashboard', 'Treasury Liquidity Assistant MCP'],
    tags: ['risk', 'regulatory', 'internal-only', 'restricted'],
    updatedAt: '2026-03-28',
    createdAt: '2022-07-22',
  },

  // ============ Event APIs (8) ============
  {
    id: 'event-001',
    name: 'Payment Settled Events',
    type: 'Event API',
    origin: 'event-gateway',
    description: 'Publishes events when payments are settled across all payment rails (ACH, wire, instant). Includes settlement details, timing, and reconciliation references.',
    domain: 'Payments',
    businessCapability: 'Payment Processing',
    ownerTeam: 'Payments Platform',
    lifecycleStatus: 'Active',
    environments: ['Production', 'Staging'],
    region: 'US-East, EU-West',
    complianceTags: ['SOX', 'PCI'],
    criticality: 'Mission Critical',
    dataClassification: 'Confidential',
    authPattern: 'mTLS + SASL',
    version: 'v2.0.0',
    specType: 'AsyncAPI',
    specSnippet: `asyncapi: 2.6.0
info:
  title: Payment Settled Events
  version: 2.0.0
channels:
  payments.settled:
    subscribe:
      message:
        payload:
          type: object
          properties:
            paymentId: { type: string }
            amount: { type: number }
            currency: { type: string }
            settledAt: { type: string, format: date-time }
            rail: { type: string, enum: [ach, wire, instant] }`,
    gatewayLink: {
      gatewayProductType: 'event',
      controlPlaneName: 'payments-event-cp',
      gatewayInstanceName: 'kafka-payments-cluster',
      environment: 'Production',
      objects: [
        { type: 'Topic', name: 'payments.settled', id: 'topic-001' },
        { type: 'Consumer Group', name: 'settlement-reconciliation-cg', id: 'cg-001' },
        { type: 'Consumer Group', name: 'notification-service-cg', id: 'cg-002' },
      ],
      navigableTargetId: 'gw-event-001',
    },
    associatedApps: noAssoc(true, undefined, false),
    dependencies: [
      { interfaceId: 'rest-002', interfaceName: 'Payment Initiation API', type: 'REST API', relationship: 'upstream' },
    ],
    consumers: ['Settlement Reconciliation', 'Notification Service', 'Fraud Detection API', 'AML Investigator MCP'],
    tags: ['payments', 'settlement', 'kafka', 'high-throughput'],
    updatedAt: '2026-03-28',
    createdAt: '2022-04-10',
  },
  {
    id: 'event-002',
    name: 'Card Authorization Events',
    type: 'Event API',
    origin: 'event-gateway',
    description: 'Real-time stream of card authorization decisions. Published for every card transaction attempt with full authorization context.',
    domain: 'Cards',
    businessCapability: 'Card Operations',
    ownerTeam: 'Cards Platform',
    lifecycleStatus: 'Active',
    environments: ['Production', 'Staging'],
    region: 'US-East, EU-West, APAC',
    complianceTags: ['PCI', 'PCI-DSS'],
    criticality: 'Mission Critical',
    dataClassification: 'Restricted',
    authPattern: 'mTLS + SASL',
    version: 'v3.1.0',
    specType: 'AsyncAPI',
    specSnippet: `asyncapi: 2.6.0
info:
  title: Card Authorization Events
  version: 3.1.0
channels:
  cards.authorizations:
    subscribe:
      message:
        payload:
          type: object
          properties:
            authorizationId: { type: string }
            cardId: { type: string }
            merchantName: { type: string }
            amount: { type: number }
            decision: { type: string, enum: [approved, declined] }`,
    gatewayLink: {
      gatewayProductType: 'event',
      controlPlaneName: 'cards-event-cp',
      gatewayInstanceName: 'kafka-cards-cluster',
      environment: 'Production',
      objects: [
        { type: 'Topic', name: 'cards.authorizations', id: 'topic-002' },
        { type: 'Consumer Group', name: 'fraud-scoring-cg', id: 'cg-003' },
        { type: 'Consumer Group', name: 'card-alerts-cg', id: 'cg-004' },
      ],
      navigableTargetId: 'gw-event-002',
    },
    associatedApps: noAssoc(true, undefined, false),
    dependencies: [],
    consumers: ['Fraud Detection API', 'Card Alerts Service', 'Card Disputes Resolution MCP'],
    tags: ['cards', 'authorization', 'kafka', 'real-time', 'high-throughput'],
    updatedAt: '2026-03-29',
    createdAt: '2021-08-15',
  },
  {
    id: 'event-003',
    name: 'Customer Profile Changed Events',
    type: 'Event API',
    origin: 'event-gateway',
    description: 'Change data capture events for the customer profile domain. Emitted on any update to customer identity, contact, or preference data.',
    domain: 'Customer Profile / Identity',
    businessCapability: 'Customer Data Management',
    ownerTeam: 'Core Banking Modernization',
    lifecycleStatus: 'Active',
    environments: ['Production', 'Staging'],
    region: 'US-East, EU-West',
    complianceTags: ['PII', 'GDPR'],
    criticality: 'Business Critical',
    dataClassification: 'Restricted',
    authPattern: 'mTLS + SASL',
    version: 'v2.0.0',
    specType: 'AsyncAPI',
    specSnippet: `asyncapi: 2.6.0
info:
  title: Customer Profile Changed Events
  version: 2.0.0
channels:
  customers.profile.changed:
    subscribe:
      message:
        payload:
          type: object
          properties:
            customerId: { type: string }
            changeType: { type: string, enum: [identity, contact, preference, kyc] }
            changedFields: { type: array, items: { type: string } }
            timestamp: { type: string, format: date-time }`,
    gatewayLink: {
      gatewayProductType: 'event',
      controlPlaneName: 'customer-event-cp',
      gatewayInstanceName: 'kafka-customer-cluster',
      environment: 'Production',
      objects: [
        { type: 'Topic', name: 'customers.profile.changed', id: 'topic-003' },
        { type: 'Consumer Group', name: 'kyc-refresh-cg', id: 'cg-005' },
      ],
      navigableTargetId: 'gw-event-003',
    },
    associatedApps: noAssoc(true, undefined, false),
    dependencies: [
      { interfaceId: 'rest-004', interfaceName: 'Customer Profile API', type: 'REST API', relationship: 'upstream' },
    ],
    consumers: ['KYC Refresh Service', 'CRM Sync', 'Notification Service', 'AML Investigator MCP'],
    tags: ['customer', 'cdc', 'kafka'],
    updatedAt: '2026-03-25',
    createdAt: '2022-09-01',
  },
  {
    id: 'event-004',
    name: 'AML Alert Raised Events',
    type: 'Event API',
    origin: 'event-gateway',
    description: 'Published when the AML system raises an alert for suspicious activity. Triggers investigation workflows and regulatory notification queues.',
    domain: 'AML / Compliance',
    businessCapability: 'AML Operations',
    ownerTeam: 'Risk Data Services',
    lifecycleStatus: 'Active',
    environments: ['Production'],
    region: 'US-East, EU-West',
    complianceTags: ['AML', 'BSA', 'Internal'],
    criticality: 'Mission Critical',
    dataClassification: 'Restricted',
    authPattern: 'mTLS + SASL',
    version: 'v1.5.0',
    specType: 'AsyncAPI',
    specSnippet: `asyncapi: 2.6.0
info:
  title: AML Alert Raised Events
  version: 1.5.0
channels:
  aml.alerts.raised:
    subscribe:
      message:
        payload:
          type: object
          properties:
            alertId: { type: string }
            entityId: { type: string }
            riskLevel: { type: string, enum: [low, medium, high, critical] }
            alertType: { type: string }`,
    gatewayLink: {
      gatewayProductType: 'event',
      controlPlaneName: 'compliance-event-cp',
      gatewayInstanceName: 'kafka-compliance-cluster',
      environment: 'Production',
      objects: [
        { type: 'Topic', name: 'aml.alerts.raised', id: 'topic-004' },
        { type: 'Consumer Group', name: 'investigation-workflow-cg', id: 'cg-006' },
      ],
      navigableTargetId: 'gw-event-004',
    },
    associatedApps: noAssoc(true, undefined, false),
    dependencies: [
      { interfaceId: 'rest-012', interfaceName: 'AML Screening API', type: 'REST API', relationship: 'upstream' },
    ],
    consumers: ['Investigation Workflow Engine', 'Regulatory Reporting', 'AML Investigator MCP'],
    tags: ['aml', 'alerts', 'compliance', 'kafka'],
    updatedAt: '2026-03-28',
    createdAt: '2022-12-01',
  },
  {
    id: 'event-005',
    name: 'FX Rate Updated Events',
    type: 'Event API',
    origin: 'event-gateway',
    description: 'Streaming FX rate updates from the treasury rate engine. Publishes on every rate tick for major and exotic currency pairs.',
    domain: 'Foreign Exchange',
    businessCapability: 'FX Operations',
    ownerTeam: 'Treasury Platform',
    lifecycleStatus: 'Active',
    environments: ['Production'],
    region: 'US-East, EU-West, APAC',
    complianceTags: ['Internal'],
    criticality: 'Business Critical',
    dataClassification: 'Internal',
    authPattern: 'mTLS + SASL',
    version: 'v1.2.0',
    specType: 'AsyncAPI',
    specSnippet: `asyncapi: 2.6.0
info:
  title: FX Rate Updated Events
  version: 1.2.0
channels:
  fx.rates.updated:
    subscribe:
      message:
        payload:
          type: object
          properties:
            pair: { type: string }
            bid: { type: number }
            ask: { type: number }
            mid: { type: number }
            timestamp: { type: string, format: date-time }`,
    gatewayLink: {
      gatewayProductType: 'event',
      controlPlaneName: 'treasury-event-cp',
      gatewayInstanceName: 'kafka-treasury-cluster',
      environment: 'Production',
      objects: [
        { type: 'Topic', name: 'fx.rates.updated', id: 'topic-005' },
        { type: 'Consumer Group', name: 'fx-cache-cg', id: 'cg-007' },
      ],
      navigableTargetId: 'gw-event-005',
    },
    associatedApps: noAssoc(true, undefined, false),
    dependencies: [],
    consumers: ['FX Rates API', 'Trading Platforms', 'Treasury Liquidity Assistant MCP'],
    tags: ['fx', 'rates', 'streaming', 'kafka', 'high-frequency'],
    updatedAt: '2026-03-29',
    createdAt: '2023-01-15',
  },
  {
    id: 'event-006',
    name: 'Loan Application Status Events',
    type: 'Event API',
    origin: 'event-gateway',
    description: 'Lifecycle events for loan applications including submission, underwriting decisions, document requests, and disbursement.',
    domain: 'Lending / Mortgage',
    businessCapability: 'Lending Operations',
    ownerTeam: 'Lending Platform',
    lifecycleStatus: 'Active',
    environments: ['Production', 'Staging'],
    region: 'US-East',
    complianceTags: ['SOX', 'Fair Lending'],
    criticality: 'Business Critical',
    dataClassification: 'Confidential',
    authPattern: 'mTLS + SASL',
    version: 'v1.0.0',
    specType: 'AsyncAPI',
    specSnippet: `asyncapi: 2.6.0
info:
  title: Loan Application Status Events
  version: 1.0.0
channels:
  loans.applications.status:
    subscribe:
      message:
        payload:
          type: object
          properties:
            applicationId: { type: string }
            status: { type: string, enum: [submitted, under_review, approved, declined, disbursed] }
            loanType: { type: string }`,
    gatewayLink: {
      gatewayProductType: 'event',
      controlPlaneName: 'lending-event-cp',
      gatewayInstanceName: 'kafka-lending-cluster',
      environment: 'Production',
      objects: [
        { type: 'Topic', name: 'loans.applications.status', id: 'topic-006' },
      ],
      navigableTargetId: 'gw-event-006',
    },
    associatedApps: noAssoc(true, undefined, false),
    dependencies: [
      { interfaceId: 'rest-006', interfaceName: 'Loan Origination API', type: 'REST API', relationship: 'upstream' },
    ],
    consumers: ['Notification Service', 'Loan Servicing Platform', 'Mortgage Underwriting MCP'],
    tags: ['lending', 'loan-status', 'kafka'],
    updatedAt: '2026-03-18',
    createdAt: '2024-02-01',
  },
  {
    id: 'event-007',
    name: 'Transaction Posted Events',
    type: 'Event API',
    origin: 'event-gateway',
    description: 'Emitted after transactions are posted to the general ledger. Covers all transaction types including deposits, withdrawals, transfers, and fees.',
    domain: 'Core Banking',
    businessCapability: 'Ledger Management',
    ownerTeam: 'Core Banking Modernization',
    lifecycleStatus: 'Active',
    environments: ['Production'],
    region: 'US-East',
    complianceTags: ['SOX', 'Internal'],
    criticality: 'Mission Critical',
    dataClassification: 'Confidential',
    authPattern: 'mTLS + SASL',
    version: 'v4.0.0',
    specType: 'AsyncAPI',
    specSnippet: `asyncapi: 2.6.0
info:
  title: Transaction Posted Events
  version: 4.0.0
channels:
  transactions.posted:
    subscribe:
      message:
        payload:
          type: object
          properties:
            transactionId: { type: string }
            accountId: { type: string }
            amount: { type: number }
            type: { type: string }
            postedAt: { type: string, format: date-time }`,
    gatewayLink: {
      gatewayProductType: 'event',
      controlPlaneName: 'core-event-cp',
      gatewayInstanceName: 'kafka-core-cluster',
      environment: 'Production',
      objects: [
        { type: 'Topic', name: 'transactions.posted', id: 'topic-007' },
        { type: 'Consumer Group', name: 'balance-update-cg', id: 'cg-008' },
        { type: 'Consumer Group', name: 'statement-cg', id: 'cg-009' },
      ],
      navigableTargetId: 'gw-event-007',
    },
    associatedApps: noAssoc(true, undefined, false),
    dependencies: [
      { interfaceId: 'rest-010', interfaceName: 'Core Banking Ledger API', type: 'REST API', relationship: 'upstream' },
    ],
    consumers: ['Account Balance API', 'Statement Generation API', 'Fraud Detection API'],
    tags: ['transactions', 'ledger', 'kafka', 'core-banking', 'high-throughput'],
    updatedAt: '2026-03-30',
    createdAt: '2020-06-01',
  },
  {
    id: 'event-008',
    name: 'Compliance Case Updated Events',
    type: 'Event API',
    origin: 'event-gateway',
    description: 'Emitted when compliance investigation cases change state. Includes SAR filings, case assignments, and resolution events.',
    domain: 'AML / Compliance',
    businessCapability: 'AML Operations',
    ownerTeam: 'Risk Data Services',
    lifecycleStatus: 'Active',
    environments: ['Production'],
    region: 'US-East',
    complianceTags: ['AML', 'BSA', 'Internal'],
    criticality: 'Business Critical',
    dataClassification: 'Restricted',
    authPattern: 'mTLS + SASL',
    version: 'v1.1.0',
    specType: 'AsyncAPI',
    specSnippet: `asyncapi: 2.6.0
info:
  title: Compliance Case Updated Events
  version: 1.1.0
channels:
  compliance.cases.updated:
    subscribe:
      message:
        payload:
          type: object
          properties:
            caseId: { type: string }
            status: { type: string }
            assignee: { type: string }`,
    gatewayLink: {
      gatewayProductType: 'event',
      controlPlaneName: 'compliance-event-cp',
      gatewayInstanceName: 'kafka-compliance-cluster',
      environment: 'Production',
      objects: [
        { type: 'Topic', name: 'compliance.cases.updated', id: 'topic-008' },
      ],
      navigableTargetId: 'gw-event-008',
    },
    associatedApps: noAssoc(true, undefined, false),
    dependencies: [],
    consumers: ['Compliance Dashboard', 'AML Investigator MCP'],
    tags: ['compliance', 'cases', 'kafka'],
    updatedAt: '2026-03-22',
    createdAt: '2023-08-15',
  },

  // ============ LLM APIs (6) ============
  {
    id: 'llm-001',
    name: 'Internal Document Summarization LLM API',
    type: 'LLM API',
    origin: 'ai-gateway',
    llmProvider: 'openai',
    description: 'Summarizes internal documents including policy memos, regulatory filings, board reports, and audit findings. Powered by fine-tuned GPT-4 with enterprise guardrails.',
    domain: 'Internal Platform / Shared Services',
    businessCapability: 'AI Enablement',
    ownerTeam: 'AI Enablement',
    lifecycleStatus: 'Active',
    environments: ['Production', 'Staging'],
    region: 'US-East',
    complianceTags: ['Internal', 'AI Governance'],
    criticality: 'Standard',
    dataClassification: 'Confidential',
    authPattern: 'OAuth 2.0 + API Key',
    version: 'v1.2.0',
    specType: 'OpenAPI',
    specSnippet: `openapi: 3.0.3
info:
  title: Document Summarization LLM API
  version: 1.2.0
paths:
  /summarize:
    post:
      summary: Summarize a document
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                document: { type: string }
                maxLength: { type: integer }
                format: { type: string, enum: [bullet_points, narrative, executive_brief] }
      responses:
        '200':
          description: Summary result
          content:
            application/json:
              schema:
                type: object
                properties:
                  summary: { type: string }
                  confidence: { type: number }
                  model: { type: string }`,
    gatewayLink: {
      gatewayProductType: 'ai',
      controlPlaneName: 'ai-gateway-cp',
      gatewayInstanceName: 'ai-prod-gw',
      environment: 'Production',
      objects: [
        { type: 'AI Route', name: 'doc-summarization-route', id: 'ai-rt-001' },
        { type: 'AI Service', name: 'doc-summarization-svc', id: 'ai-svc-001' },
        { type: 'Model Connection', name: 'gpt-4-enterprise', id: 'ai-model-001' },
        { type: 'AI Plugin', name: 'prompt-guard', id: 'ai-plg-001' },
      ],
      navigableTargetId: 'gw-ai-001',
    },
    associatedApps: noAssoc(true, undefined, false),
    dependencies: [],
    consumers: ['Internal Applications', 'Mortgage Underwriting MCP', 'AML Investigator MCP'],
    tags: ['llm', 'summarization', 'ai', 'gpt-4'],
    updatedAt: '2026-03-27',
    createdAt: '2025-01-15',
  },
  {
    id: 'llm-002',
    name: 'KYC Review Assistant LLM API',
    type: 'LLM API',
    origin: 'ai-gateway',
    llmProvider: 'anthropic',
    description: 'AI-assisted KYC review that analyzes customer documents, identity verification results, and risk indicators. Provides structured risk assessment and recommended actions.',
    domain: 'AML / Compliance',
    businessCapability: 'KYC Operations',
    ownerTeam: 'AI Enablement',
    lifecycleStatus: 'Active',
    environments: ['Production', 'Staging'],
    region: 'US-East',
    complianceTags: ['KYC', 'AML', 'AI Governance', 'PII'],
    criticality: 'Business Critical',
    dataClassification: 'Restricted',
    authPattern: 'OAuth 2.0 + mTLS',
    version: 'v1.0.0',
    specType: 'OpenAPI',
    specSnippet: `openapi: 3.0.3
info:
  title: KYC Review Assistant LLM API
  version: 1.0.0
paths:
  /kyc/review:
    post:
      summary: AI-assisted KYC review
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                customerId: { type: string }
                documents: { type: array }
                verificationResults: { type: object }`,
    gatewayLink: {
      gatewayProductType: 'ai',
      controlPlaneName: 'ai-gateway-cp',
      gatewayInstanceName: 'ai-prod-gw',
      environment: 'Production',
      objects: [
        { type: 'AI Route', name: 'kyc-review-route', id: 'ai-rt-002' },
        { type: 'AI Service', name: 'kyc-review-svc', id: 'ai-svc-002' },
        { type: 'Model Connection', name: 'claude-3-opus-kyc', id: 'ai-model-002' },
        { type: 'AI Plugin', name: 'pii-filter', id: 'ai-plg-002' },
      ],
      navigableTargetId: 'gw-ai-002',
    },
    associatedApps: noAssoc(true, undefined, false),
    dependencies: [
      { interfaceId: 'rest-004', interfaceName: 'Customer Profile API', type: 'REST API', relationship: 'upstream' },
    ],
    consumers: ['KYC Operations Team', 'AML Investigator MCP'],
    tags: ['llm', 'kyc', 'ai', 'compliance', 'claude'],
    updatedAt: '2026-03-25',
    createdAt: '2025-06-01',
  },
  {
    id: 'llm-003',
    name: 'Fraud Narrative Generator LLM API',
    type: 'LLM API',
    origin: 'ai-gateway',
    llmProvider: 'openai',
    description: 'Generates human-readable fraud investigation narratives from structured alert data. Used by fraud analysts to accelerate case documentation.',
    domain: 'Fraud',
    businessCapability: 'Fraud Investigation',
    ownerTeam: 'Fraud Engineering',
    lifecycleStatus: 'Active',
    environments: ['Production'],
    region: 'US-East',
    complianceTags: ['Internal', 'AI Governance'],
    criticality: 'Standard',
    dataClassification: 'Confidential',
    authPattern: 'OAuth 2.0',
    version: 'v1.1.0',
    specType: 'OpenAPI',
    specSnippet: `openapi: 3.0.3
info:
  title: Fraud Narrative Generator LLM API
  version: 1.1.0
paths:
  /fraud/narratives:
    post:
      summary: Generate fraud investigation narrative`,
    gatewayLink: {
      gatewayProductType: 'ai',
      controlPlaneName: 'ai-gateway-cp',
      gatewayInstanceName: 'ai-prod-gw',
      environment: 'Production',
      objects: [
        { type: 'AI Route', name: 'fraud-narrative-route', id: 'ai-rt-003' },
        { type: 'AI Service', name: 'fraud-narrative-svc', id: 'ai-svc-003' },
        { type: 'Model Connection', name: 'gpt-4-enterprise', id: 'ai-model-001' },
      ],
      navigableTargetId: 'gw-ai-003',
    },
    associatedApps: noAssoc(true, undefined, false),
    dependencies: [
      { interfaceId: 'rest-005', interfaceName: 'Fraud Detection API', type: 'REST API', relationship: 'upstream' },
    ],
    consumers: ['Fraud Analysts', 'Card Disputes Resolution MCP'],
    tags: ['llm', 'fraud', 'ai', 'narrative-generation'],
    updatedAt: '2026-03-20',
    createdAt: '2025-04-10',
  },
  {
    id: 'llm-004',
    name: 'Treasury Research Copilot LLM API',
    type: 'LLM API',
    origin: 'ai-gateway',
    llmProvider: 'mistral',
    description: 'AI assistant for treasury research queries including market analysis, rate forecasting context, and liquidity optimization recommendations.',
    domain: 'Treasury',
    businessCapability: 'Treasury Analytics',
    ownerTeam: 'Treasury Platform',
    lifecycleStatus: 'Experimental',
    environments: ['Staging', 'Development'],
    region: 'US-East',
    complianceTags: ['Internal', 'AI Governance'],
    criticality: 'Standard',
    dataClassification: 'Confidential',
    authPattern: 'OAuth 2.0',
    version: 'v0.5.0',
    specType: 'OpenAPI',
    specSnippet: `openapi: 3.0.3
info:
  title: Treasury Research Copilot LLM API
  version: 0.5.0
paths:
  /treasury/research:
    post:
      summary: Query treasury research assistant`,
    associatedApps: noAssoc(false, undefined, false),
    dependencies: [],
    consumers: ['Treasury Analysts', 'Treasury Liquidity Assistant MCP'],
    tags: ['llm', 'treasury', 'ai', 'experimental', 'research'],
    updatedAt: '2026-03-15',
    createdAt: '2025-10-01',
  },
  {
    id: 'llm-005',
    name: 'Banker Knowledge Assistant LLM API',
    type: 'LLM API',
    origin: 'ai-gateway',
    llmProvider: 'anthropic',
    description: 'Enterprise knowledge base assistant trained on internal banking policies, procedures, product specifications, and regulatory guidelines. RAG-powered.',
    domain: 'Internal Platform / Shared Services',
    businessCapability: 'Knowledge Management',
    ownerTeam: 'AI Enablement',
    lifecycleStatus: 'Active',
    environments: ['Production', 'Staging'],
    region: 'US-East',
    complianceTags: ['Internal', 'AI Governance'],
    criticality: 'Standard',
    dataClassification: 'Internal',
    authPattern: 'OAuth 2.0',
    version: 'v2.0.0',
    specType: 'OpenAPI',
    specSnippet: `openapi: 3.0.3
info:
  title: Banker Knowledge Assistant LLM API
  version: 2.0.0
paths:
  /knowledge/query:
    post:
      summary: Query the knowledge assistant
  /knowledge/sources:
    get:
      summary: List available knowledge sources`,
    gatewayLink: {
      gatewayProductType: 'ai',
      controlPlaneName: 'ai-gateway-cp',
      gatewayInstanceName: 'ai-prod-gw',
      environment: 'Production',
      objects: [
        { type: 'AI Route', name: 'banker-knowledge-route', id: 'ai-rt-005' },
        { type: 'AI Service', name: 'banker-knowledge-svc', id: 'ai-svc-005' },
        { type: 'Model Connection', name: 'claude-3-sonnet-rag', id: 'ai-model-004' },
      ],
      navigableTargetId: 'gw-ai-005',
    },
    associatedApps: noAssoc(true, undefined, false),
    dependencies: [],
    consumers: ['All Staff', 'Relationship Manager Copilot MCP', 'Contact Center Agents'],
    tags: ['llm', 'knowledge-base', 'ai', 'rag', 'enterprise'],
    updatedAt: '2026-03-28',
    createdAt: '2025-03-01',
  },
  {
    id: 'llm-006',
    name: 'Credit Decision Explainer LLM API',
    type: 'LLM API',
    origin: 'portal',
    llmProvider: 'google',
    description: 'Generates plain-language explanations of credit decisions for both customer-facing disclosures and internal audit documentation.',
    domain: 'Lending / Mortgage',
    businessCapability: 'Lending Operations',
    ownerTeam: 'AI Enablement',
    lifecycleStatus: 'Active',
    environments: ['Production'],
    region: 'US-East',
    complianceTags: ['Fair Lending', 'ECOA', 'AI Governance'],
    criticality: 'Business Critical',
    dataClassification: 'Confidential',
    authPattern: 'OAuth 2.0 + mTLS',
    version: 'v1.0.0',
    specType: 'OpenAPI',
    specSnippet: `openapi: 3.0.3
info:
  title: Credit Decision Explainer LLM API
  version: 1.0.0
paths:
  /credit/explain:
    post:
      summary: Generate credit decision explanation`,
    gatewayLink: {
      gatewayProductType: 'ai',
      controlPlaneName: 'ai-gateway-cp',
      gatewayInstanceName: 'ai-prod-gw',
      environment: 'Production',
      objects: [
        { type: 'AI Route', name: 'credit-explainer-route', id: 'ai-rt-006' },
        { type: 'AI Service', name: 'credit-explainer-svc', id: 'ai-svc-006' },
        { type: 'Model Connection', name: 'gpt-4-enterprise', id: 'ai-model-001' },
      ],
      navigableTargetId: 'gw-ai-006',
    },
    associatedApps: noAssoc(true, undefined, false),
    dependencies: [
      { interfaceId: 'rest-006', interfaceName: 'Loan Origination API', type: 'REST API', relationship: 'upstream' },
    ],
    consumers: ['Loan Officers', 'Customer Communications', 'Mortgage Underwriting MCP'],
    tags: ['llm', 'credit', 'explainability', 'ai', 'fair-lending'],
    updatedAt: '2026-03-22',
    createdAt: '2025-07-15',
  },

  // ============ MCP Interfaces (8) ============
  {
    id: 'mcp-001',
    name: 'Relationship Manager Copilot MCP',
    type: 'MCP',
    origin: 'context-mesh',
    description: 'AI copilot for relationship managers that composes customer data, portfolio views, product recommendations, and branch information into a unified conversational interface. Enables RMs to prepare for client meetings and answer real-time queries.',
    domain: 'Wealth',
    businessCapability: 'Relationship Management',
    ownerTeam: 'AI Enablement',
    lifecycleStatus: 'Active',
    environments: ['Production', 'Staging'],
    region: 'US-East',
    complianceTags: ['PII', 'AI Governance', 'Internal'],
    criticality: 'Business Critical',
    dataClassification: 'Confidential',
    authPattern: 'OAuth 2.0 + Workspace Token',
    version: 'v1.3.0',
    specType: 'MCP',
    specSnippet: `{
  "name": "relationship-manager-copilot",
  "version": "1.3.0",
  "tools": [
    {
      "name": "get_client_summary",
      "description": "Retrieve comprehensive client summary including accounts, products, and recent activity",
      "inputSchema": { "type": "object", "properties": { "customerId": { "type": "string" } } }
    },
    {
      "name": "get_portfolio_overview",
      "description": "Get portfolio holdings, performance, and asset allocation",
      "inputSchema": { "type": "object", "properties": { "portfolioId": { "type": "string" } } }
    },
    {
      "name": "find_nearest_branch",
      "description": "Find nearest branch with specialist availability",
      "inputSchema": { "type": "object", "properties": { "location": { "type": "string" } } }
    },
    {
      "name": "get_product_recommendations",
      "description": "AI-powered product recommendations based on client profile",
      "inputSchema": { "type": "object", "properties": { "customerId": { "type": "string" } } }
    },
    {
      "name": "query_knowledge_base",
      "description": "Query internal knowledge base for policies, rates, and product details",
      "inputSchema": { "type": "object", "properties": { "query": { "type": "string" } } }
    }
  ]
}`,
    gatewayLink: {
      gatewayProductType: 'ai',
      controlPlaneName: 'ai-gateway-cp',
      gatewayInstanceName: 'ai-prod-gw',
      environment: 'Production',
      objects: [
        { type: 'AI Route', name: 'rm-copilot-mcp-route', id: 'ai-rt-mcp-001' },
        { type: 'AI Service', name: 'rm-copilot-mcp-svc', id: 'ai-svc-mcp-001' },
      ],
      navigableTargetId: 'gw-ai-mcp-001',
    },
    associatedApps: mcpAssoc(true, undefined, ['enterprise'], 5),
    dependencies: [
      { interfaceId: 'rest-004', interfaceName: 'Customer Profile API', type: 'REST API', relationship: 'composes-from', detail: 'get_client_summary tool' },
      { interfaceId: 'rest-014', interfaceName: 'Wealth Portfolio API', type: 'REST API', relationship: 'composes-from', detail: 'get_portfolio_overview tool' },
      { interfaceId: 'rest-015', interfaceName: 'Branch Locator API', type: 'REST API', relationship: 'composes-from', detail: 'find_nearest_branch tool' },
      { interfaceId: 'llm-005', interfaceName: 'Banker Knowledge Assistant LLM API', type: 'LLM API', relationship: 'composes-from', detail: 'query_knowledge_base tool' },
      { interfaceId: 'rest-001', interfaceName: 'Account Balance API', type: 'REST API', relationship: 'composes-from', detail: 'get_client_summary tool' },
    ],
    consumers: ['Relationship Managers', 'Private Bankers', 'Financial Advisors'],
    tags: ['mcp', 'copilot', 'ai', 'wealth', 'rm-tools'],
    updatedAt: '2026-03-29',
    createdAt: '2025-08-01',
  },
  {
    id: 'mcp-002',
    name: 'AML Investigator MCP',
    type: 'MCP',
    origin: 'context-mesh',
    description: 'AI-powered investigation assistant for AML analysts. Composes screening results, transaction patterns, alert data, customer profiles, and narrative generation into a unified investigation workbench.',
    domain: 'AML / Compliance',
    businessCapability: 'AML Investigation',
    ownerTeam: 'AI Enablement',
    lifecycleStatus: 'Active',
    environments: ['Production', 'Staging'],
    region: 'US-East',
    complianceTags: ['AML', 'BSA', 'AI Governance', 'PII'],
    criticality: 'Mission Critical',
    dataClassification: 'Restricted',
    authPattern: 'OAuth 2.0 + mTLS + Workspace Token',
    version: 'v1.1.0',
    specType: 'MCP',
    specSnippet: `{
  "name": "aml-investigator",
  "version": "1.1.0",
  "tools": [
    {
      "name": "screen_entity",
      "description": "Screen entity against sanctions and PEP lists",
      "inputSchema": { "type": "object", "properties": { "entityId": { "type": "string" } } }
    },
    {
      "name": "get_transaction_patterns",
      "description": "Analyze transaction patterns for suspicious activity",
      "inputSchema": { "type": "object", "properties": { "entityId": { "type": "string" }, "period": { "type": "string" } } }
    },
    {
      "name": "get_alert_details",
      "description": "Retrieve AML alert details and history",
      "inputSchema": { "type": "object", "properties": { "alertId": { "type": "string" } } }
    },
    {
      "name": "generate_investigation_narrative",
      "description": "Generate investigation narrative from case data",
      "inputSchema": { "type": "object", "properties": { "caseId": { "type": "string" } } }
    },
    {
      "name": "get_customer_risk_profile",
      "description": "Get comprehensive customer risk profile",
      "inputSchema": { "type": "object", "properties": { "customerId": { "type": "string" } } }
    },
    {
      "name": "review_kyc_status",
      "description": "AI-assisted KYC status review",
      "inputSchema": { "type": "object", "properties": { "customerId": { "type": "string" } } }
    }
  ]
}`,
    gatewayLink: {
      gatewayProductType: 'ai',
      controlPlaneName: 'ai-gateway-cp',
      gatewayInstanceName: 'ai-prod-gw',
      environment: 'Production',
      objects: [
        { type: 'AI Route', name: 'aml-investigator-mcp-route', id: 'ai-rt-mcp-002' },
        { type: 'AI Service', name: 'aml-investigator-mcp-svc', id: 'ai-svc-mcp-002' },
      ],
      navigableTargetId: 'gw-ai-mcp-002',
    },
    associatedApps: mcpAssoc(true, undefined, ['compliance'], 6),
    dependencies: [
      { interfaceId: 'rest-012', interfaceName: 'AML Screening API', type: 'REST API', relationship: 'composes-from', detail: 'screen_entity tool' },
      { interfaceId: 'rest-005', interfaceName: 'Fraud Detection API', type: 'REST API', relationship: 'composes-from', detail: 'get_transaction_patterns tool' },
      { interfaceId: 'event-004', interfaceName: 'AML Alert Raised Events', type: 'Event API', relationship: 'composes-from', detail: 'get_alert_details tool' },
      { interfaceId: 'event-001', interfaceName: 'Payment Settled Events', type: 'Event API', relationship: 'composes-from', detail: 'get_transaction_patterns tool' },
      { interfaceId: 'rest-004', interfaceName: 'Customer Profile API', type: 'REST API', relationship: 'composes-from', detail: 'get_customer_risk_profile tool' },
      { interfaceId: 'llm-002', interfaceName: 'KYC Review Assistant LLM API', type: 'LLM API', relationship: 'composes-from', detail: 'review_kyc_status tool' },
      { interfaceId: 'llm-001', interfaceName: 'Internal Document Summarization LLM API', type: 'LLM API', relationship: 'composes-from', detail: 'generate_investigation_narrative tool' },
    ],
    consumers: ['AML Investigators', 'Compliance Officers', 'BSA Team'],
    tags: ['mcp', 'aml', 'investigation', 'ai', 'compliance'],
    updatedAt: '2026-03-28',
    createdAt: '2025-06-15',
  },
  {
    id: 'mcp-003',
    name: 'Mortgage Underwriting MCP',
    type: 'MCP',
    origin: 'context-mesh',
    description: 'Streamlines mortgage underwriting by composing loan data, credit analysis, document review, property valuations, and decision explanations into a single AI-assisted workflow.',
    domain: 'Lending / Mortgage',
    businessCapability: 'Mortgage Operations',
    ownerTeam: 'AI Enablement',
    lifecycleStatus: 'Active',
    environments: ['Production'],
    region: 'US-East',
    complianceTags: ['Fair Lending', 'ECOA', 'AI Governance'],
    criticality: 'Business Critical',
    dataClassification: 'Confidential',
    authPattern: 'OAuth 2.0 + mTLS',
    version: 'v1.0.0',
    specType: 'MCP',
    specSnippet: `{
  "name": "mortgage-underwriting",
  "version": "1.0.0",
  "tools": [
    {
      "name": "get_application_details",
      "description": "Get full mortgage application with applicant data",
      "inputSchema": { "type": "object", "properties": { "applicationId": { "type": "string" } } }
    },
    {
      "name": "analyze_credit_profile",
      "description": "Run credit analysis for underwriting",
      "inputSchema": { "type": "object", "properties": { "applicantId": { "type": "string" } } }
    },
    {
      "name": "review_documents",
      "description": "AI review of submitted mortgage documents",
      "inputSchema": { "type": "object", "properties": { "applicationId": { "type": "string" } } }
    },
    {
      "name": "explain_decision",
      "description": "Generate plain-language decision explanation",
      "inputSchema": { "type": "object", "properties": { "decisionId": { "type": "string" } } }
    }
  ]
}`,
    gatewayLink: {
      gatewayProductType: 'ai',
      controlPlaneName: 'ai-gateway-cp',
      gatewayInstanceName: 'ai-prod-gw',
      environment: 'Production',
      objects: [
        { type: 'AI Route', name: 'mortgage-uw-mcp-route', id: 'ai-rt-mcp-003' },
        { type: 'AI Service', name: 'mortgage-uw-mcp-svc', id: 'ai-svc-mcp-003' },
      ],
      navigableTargetId: 'gw-ai-mcp-003',
    },
    associatedApps: mcpAssoc(true, undefined, ['lending'], 4),
    dependencies: [
      { interfaceId: 'rest-006', interfaceName: 'Loan Origination API', type: 'REST API', relationship: 'composes-from', detail: 'get_application_details tool' },
      { interfaceId: 'llm-001', interfaceName: 'Internal Document Summarization LLM API', type: 'LLM API', relationship: 'composes-from', detail: 'review_documents tool' },
      { interfaceId: 'llm-006', interfaceName: 'Credit Decision Explainer LLM API', type: 'LLM API', relationship: 'composes-from', detail: 'explain_decision tool' },
      { interfaceId: 'event-006', interfaceName: 'Loan Application Status Events', type: 'Event API', relationship: 'composes-from', detail: 'status change triggers' },
    ],
    consumers: ['Mortgage Underwriters', 'Loan Officers'],
    tags: ['mcp', 'mortgage', 'underwriting', 'ai', 'lending'],
    updatedAt: '2026-03-26',
    createdAt: '2025-09-01',
  },
  {
    id: 'mcp-004',
    name: 'Treasury Liquidity Assistant MCP',
    type: 'MCP',
    origin: 'context-mesh',
    description: 'AI assistant for treasury teams to monitor liquidity positions, FX exposure, market conditions, and risk metrics. Composes real-time data from multiple treasury interfaces.',
    domain: 'Treasury',
    businessCapability: 'Liquidity Management',
    ownerTeam: 'Treasury Platform',
    lifecycleStatus: 'Active',
    environments: ['Production', 'Staging'],
    region: 'US-East',
    complianceTags: ['Internal', 'AI Governance'],
    criticality: 'Business Critical',
    dataClassification: 'Confidential',
    authPattern: 'OAuth 2.0 + Workspace Token',
    version: 'v1.2.0',
    specType: 'MCP',
    specSnippet: `{
  "name": "treasury-liquidity-assistant",
  "version": "1.2.0",
  "tools": [
    {
      "name": "get_liquidity_position",
      "description": "Get current liquidity position across accounts",
      "inputSchema": { "type": "object", "properties": { "currency": { "type": "string" } } }
    },
    {
      "name": "get_fx_exposure",
      "description": "Get current FX exposure and hedging status",
      "inputSchema": { "type": "object", "properties": {} }
    },
    {
      "name": "query_market_conditions",
      "description": "Query current market conditions and rate environment",
      "inputSchema": { "type": "object", "properties": { "query": { "type": "string" } } }
    },
    {
      "name": "get_risk_metrics",
      "description": "Retrieve risk exposure metrics for treasury",
      "inputSchema": { "type": "object", "properties": { "metricType": { "type": "string" } } }
    }
  ]
}`,
    gatewayLink: {
      gatewayProductType: 'ai',
      controlPlaneName: 'ai-gateway-cp',
      gatewayInstanceName: 'ai-prod-gw',
      environment: 'Production',
      objects: [
        { type: 'AI Route', name: 'treasury-liquidity-mcp-route', id: 'ai-rt-mcp-004' },
        { type: 'AI Service', name: 'treasury-liquidity-mcp-svc', id: 'ai-svc-mcp-004' },
      ],
      navigableTargetId: 'gw-ai-mcp-004',
    },
    associatedApps: mcpAssoc(true, undefined, ['enterprise'], 4),
    dependencies: [
      { interfaceId: 'rest-011', interfaceName: 'FX Rates API', type: 'REST API', relationship: 'composes-from', detail: 'get_fx_exposure tool' },
      { interfaceId: 'event-005', interfaceName: 'FX Rate Updated Events', type: 'Event API', relationship: 'composes-from', detail: 'real-time rate streaming' },
      { interfaceId: 'rest-018', interfaceName: 'Risk Exposure API', type: 'REST API', relationship: 'composes-from', detail: 'get_risk_metrics tool' },
      { interfaceId: 'llm-004', interfaceName: 'Treasury Research Copilot LLM API', type: 'LLM API', relationship: 'composes-from', detail: 'query_market_conditions tool' },
    ],
    consumers: ['Treasury Managers', 'CFO Office', 'ALM Team'],
    tags: ['mcp', 'treasury', 'liquidity', 'ai', 'real-time'],
    updatedAt: '2026-03-28',
    createdAt: '2025-07-01',
  },
  {
    id: 'mcp-005',
    name: 'Card Disputes Resolution MCP',
    type: 'MCP',
    origin: 'context-mesh',
    description: 'AI-assisted card dispute resolution that composes card transaction data, authorization events, merchant information, fraud signals, and case management into a streamlined resolution workflow.',
    domain: 'Cards',
    businessCapability: 'Dispute Management',
    ownerTeam: 'Cards Platform',
    lifecycleStatus: 'Active',
    environments: ['Production'],
    region: 'US-East, EU-West',
    complianceTags: ['PCI', 'Reg E', 'AI Governance'],
    criticality: 'Business Critical',
    dataClassification: 'Confidential',
    authPattern: 'OAuth 2.0 + mTLS',
    version: 'v1.0.0',
    specType: 'MCP',
    specSnippet: `{
  "name": "card-disputes-resolution",
  "version": "1.0.0",
  "tools": [
    {
      "name": "get_transaction_details",
      "description": "Get full transaction details including merchant data",
      "inputSchema": { "type": "object", "properties": { "transactionId": { "type": "string" } } }
    },
    {
      "name": "get_authorization_history",
      "description": "Get card authorization event history",
      "inputSchema": { "type": "object", "properties": { "cardId": { "type": "string" } } }
    },
    {
      "name": "assess_fraud_signals",
      "description": "Assess fraud signals for the disputed transaction",
      "inputSchema": { "type": "object", "properties": { "transactionId": { "type": "string" } } }
    },
    {
      "name": "create_dispute_case",
      "description": "Create and manage dispute case",
      "inputSchema": { "type": "object", "properties": { "transactionId": { "type": "string" }, "reason": { "type": "string" } } }
    },
    {
      "name": "generate_resolution_recommendation",
      "description": "AI-generated dispute resolution recommendation",
      "inputSchema": { "type": "object", "properties": { "caseId": { "type": "string" } } }
    }
  ]
}`,
    gatewayLink: {
      gatewayProductType: 'ai',
      controlPlaneName: 'ai-gateway-cp',
      gatewayInstanceName: 'ai-prod-gw',
      environment: 'Production',
      objects: [
        { type: 'AI Route', name: 'card-disputes-mcp-route', id: 'ai-rt-mcp-005' },
        { type: 'AI Service', name: 'card-disputes-mcp-svc', id: 'ai-svc-mcp-005' },
      ],
      navigableTargetId: 'gw-ai-mcp-005',
    },
    associatedApps: mcpAssoc(true, undefined, ['enterprise'], 5),
    dependencies: [
      { interfaceId: 'rest-003', interfaceName: 'Card Management API', type: 'REST API', relationship: 'composes-from', detail: 'get_transaction_details tool' },
      { interfaceId: 'event-002', interfaceName: 'Card Authorization Events', type: 'Event API', relationship: 'composes-from', detail: 'get_authorization_history tool' },
      { interfaceId: 'rest-005', interfaceName: 'Fraud Detection API', type: 'REST API', relationship: 'composes-from', detail: 'assess_fraud_signals tool' },
      { interfaceId: 'rest-017', interfaceName: 'CRM Case Management API', type: 'REST API', relationship: 'composes-from', detail: 'create_dispute_case tool' },
      { interfaceId: 'llm-003', interfaceName: 'Fraud Narrative Generator LLM API', type: 'LLM API', relationship: 'composes-from', detail: 'generate_resolution_recommendation tool' },
    ],
    consumers: ['Dispute Analysts', 'Contact Center Agents', 'Cardholders (indirect)'],
    tags: ['mcp', 'cards', 'disputes', 'ai', 'resolution'],
    updatedAt: '2026-03-25',
    createdAt: '2025-08-15',
  },
  {
    id: 'mcp-006',
    name: 'Customer Onboarding Assistant MCP',
    type: 'MCP',
    origin: 'portal',
    description: 'Guides new customer onboarding by composing identity verification, KYC checks, product eligibility, and account opening into a conversational AI flow.',
    domain: 'Customer Profile / Identity',
    businessCapability: 'Customer Onboarding',
    ownerTeam: 'AI Enablement',
    lifecycleStatus: 'Experimental',
    environments: ['Staging', 'Development'],
    region: 'US-East',
    complianceTags: ['KYC', 'AML', 'AI Governance', 'PII'],
    criticality: 'Standard',
    dataClassification: 'Restricted',
    authPattern: 'OAuth 2.0',
    version: 'v0.8.0',
    specType: 'MCP',
    specSnippet: `{
  "name": "customer-onboarding-assistant",
  "version": "0.8.0",
  "tools": [
    {
      "name": "verify_identity",
      "description": "Verify customer identity documents"
    },
    {
      "name": "run_kyc_check",
      "description": "Run KYC and AML screening"
    },
    {
      "name": "check_product_eligibility",
      "description": "Check eligibility for banking products"
    }
  ]
}`,
    associatedApps: mcpAssoc(false, intPortal, ['lending'], 3),
    dependencies: [
      { interfaceId: 'rest-004', interfaceName: 'Customer Profile API', type: 'REST API', relationship: 'composes-from' },
      { interfaceId: 'rest-012', interfaceName: 'AML Screening API', type: 'REST API', relationship: 'composes-from' },
      { interfaceId: 'llm-002', interfaceName: 'KYC Review Assistant LLM API', type: 'LLM API', relationship: 'composes-from' },
      { interfaceName: 'Equifax Identity Verification Service', type: 'External', relationship: 'composes-from', detail: 'External identity verification provider' },
    ],
    consumers: ['Digital Onboarding Flow', 'Branch Staff'],
    tags: ['mcp', 'onboarding', 'ai', 'experimental', 'kyc'],
    updatedAt: '2026-03-20',
    createdAt: '2025-11-01',
  },
  {
    id: 'mcp-007',
    name: 'Contact Center Agent MCP',
    type: 'MCP',
    origin: 'context-mesh',
    description: 'Unified MCP for contact center agents providing real-time customer context, case management, knowledge base access, and call disposition assistance.',
    domain: 'CRM / Case Management',
    businessCapability: 'Customer Service',
    ownerTeam: 'AI Enablement',
    lifecycleStatus: 'Active',
    environments: ['Production', 'Staging'],
    region: 'US-East',
    complianceTags: ['PII', 'AI Governance', 'Internal'],
    criticality: 'Business Critical',
    dataClassification: 'Confidential',
    authPattern: 'OAuth 2.0 + Workspace Token',
    version: 'v1.1.0',
    specType: 'MCP',
    specSnippet: `{
  "name": "contact-center-agent",
  "version": "1.1.0",
  "tools": [
    { "name": "get_customer_context", "description": "Get customer context for active call" },
    { "name": "search_knowledge_base", "description": "Search internal KB for answers" },
    { "name": "create_service_case", "description": "Create a new service case" },
    { "name": "get_account_summary", "description": "Quick account summary" },
    { "name": "suggest_disposition", "description": "AI-suggested call disposition" }
  ]
}`,
    gatewayLink: {
      gatewayProductType: 'ai',
      controlPlaneName: 'ai-gateway-cp',
      gatewayInstanceName: 'ai-prod-gw',
      environment: 'Production',
      objects: [
        { type: 'AI Route', name: 'cc-agent-mcp-route', id: 'ai-rt-mcp-007' },
        { type: 'AI Service', name: 'cc-agent-mcp-svc', id: 'ai-svc-mcp-007' },
      ],
      navigableTargetId: 'gw-ai-mcp-007',
    },
    associatedApps: mcpAssoc(true, undefined, ['compliance', 'enterprise'], 5),
    dependencies: [
      { interfaceId: 'rest-004', interfaceName: 'Customer Profile API', type: 'REST API', relationship: 'composes-from', detail: 'get_customer_context tool' },
      { interfaceId: 'rest-017', interfaceName: 'CRM Case Management API', type: 'REST API', relationship: 'composes-from', detail: 'create_service_case tool' },
      { interfaceId: 'rest-001', interfaceName: 'Account Balance API', type: 'REST API', relationship: 'composes-from', detail: 'get_account_summary tool' },
      { interfaceId: 'llm-005', interfaceName: 'Banker Knowledge Assistant LLM API', type: 'LLM API', relationship: 'composes-from', detail: 'search_knowledge_base tool' },
    ],
    consumers: ['Contact Center Agents', 'Branch Staff'],
    tags: ['mcp', 'contact-center', 'ai', 'customer-service'],
    updatedAt: '2026-03-27',
    createdAt: '2025-05-01',
  },
  {
    id: 'mcp-008',
    name: 'Payments Operations MCP',
    type: 'MCP',
    origin: 'portal',
    description: 'Operations console MCP for the payments team. Composes payment status, settlement data, exception handling, and reconciliation tools for payment operations staff.',
    domain: 'Payments',
    businessCapability: 'Payment Operations',
    ownerTeam: 'Payments Platform',
    lifecycleStatus: 'Proposed',
    environments: ['Development'],
    region: 'US-East',
    complianceTags: ['Internal', 'AI Governance'],
    criticality: 'Standard',
    dataClassification: 'Confidential',
    authPattern: 'OAuth 2.0',
    version: 'v0.1.0',
    specType: 'MCP',
    specSnippet: `{
  "name": "payments-operations",
  "version": "0.1.0",
  "tools": [
    { "name": "get_payment_status", "description": "Track payment status across rails" },
    { "name": "view_settlement_batch", "description": "View settlement batch details" },
    { "name": "handle_exception", "description": "Handle payment exceptions" }
  ]
}`,
    associatedApps: mcpAssoc(false, intPortal, ['enterprise'], 4),
    dependencies: [
      { interfaceId: 'rest-002', interfaceName: 'Payment Initiation API', type: 'REST API', relationship: 'composes-from' },
      { interfaceId: 'event-001', interfaceName: 'Payment Settled Events', type: 'Event API', relationship: 'composes-from' },
      { interfaceName: 'SWIFT Message Gateway', interfaceId: 'generic-001', type: 'Generic API', relationship: 'composes-from', detail: 'Cross-border payment tracking' },
    ],
    consumers: ['Payment Operations Staff'],
    tags: ['mcp', 'payments', 'operations', 'proposed'],
    updatedAt: '2026-03-15',
    createdAt: '2026-02-01',
  },

  // ============ Generic APIs (10) ============
  {
    id: 'generic-001',
    name: 'SWIFT Message Gateway',
    type: 'Generic API',
    origin: 'api-gateway',
    description: 'Proprietary interface to the SWIFT network for international payment messaging. Handles MT and MX message formats. Not a standard REST API — uses ISO 20022 XML over MQ.',
    domain: 'Payments',
    businessCapability: 'Cross-Border Payments',
    ownerTeam: 'Payments Platform',
    lifecycleStatus: 'Active',
    environments: ['Production'],
    region: 'Global',
    complianceTags: ['PCI', 'SWIFT CSP', 'Internal'],
    criticality: 'Mission Critical',
    dataClassification: 'Restricted',
    authPattern: 'PKI + HSM',
    version: 'Unknown',
    specType: 'Unknown',
    specSnippet: `# SWIFT Message Gateway
# No formal API specification available
# Interface type: ISO 20022 XML over IBM MQ
# Message formats: MT103, MT202, pacs.008, pacs.009
# Confidence: High (well-understood but proprietary)`,
    gatewayLink: {
      gatewayProductType: 'api',
      controlPlaneName: 'swift-cp',
      gatewayInstanceName: 'swift-gateway-prod',
      environment: 'Production',
      objects: [
        { type: 'Service', name: 'swift-message-proxy', id: 'svc-gen-001' },
      ],
      navigableTargetId: 'gw-api-gen-001',
    },
    associatedApps: noAssoc(true, undefined, false),
    dependencies: [],
    consumers: ['Payment Initiation API', 'Treasury Platform', 'Payments Operations MCP'],
    tags: ['swift', 'messaging', 'cross-border', 'proprietary', 'iso-20022'],
    updatedAt: '2026-03-10',
    createdAt: '2018-01-15',
  },
  {
    id: 'generic-002',
    name: 'Legacy SOAP Customer Master Service',
    type: 'Generic API',
    origin: 'api-gateway',
    description: 'Legacy SOAP-based customer master service from the original core banking system. Being gradually replaced by Customer Profile API but still serves some legacy channels.',
    domain: 'Customer Profile / Identity',
    businessCapability: 'Customer Data Management',
    ownerTeam: 'Core Banking Modernization',
    lifecycleStatus: 'Deprecated',
    environments: ['Production'],
    region: 'US-East',
    complianceTags: ['PII', 'Internal'],
    criticality: 'Business Critical',
    dataClassification: 'Restricted',
    authPattern: 'WS-Security',
    version: 'v1.0 (2012)',
    specType: 'Unknown',
    specSnippet: `# Legacy SOAP Customer Master Service
# WSDL-based interface (SOAP 1.1)
# Endpoint: /services/CustomerMaster
# Operations: GetCustomer, UpdateCustomer, SearchCustomers
# Note: Being replaced by Customer Profile API (rest-004)
# Confidence: Medium (WSDL exists but not maintained)`,
    gatewayLink: {
      gatewayProductType: 'api',
      controlPlaneName: 'legacy-cp',
      gatewayInstanceName: 'legacy-prod-gw',
      environment: 'Production',
      objects: [
        { type: 'Service', name: 'soap-customer-master', id: 'svc-gen-002' },
        { type: 'Route', name: '/services/CustomerMaster', id: 'rt-gen-002' },
      ],
      navigableTargetId: 'gw-api-gen-002',
    },
    associatedApps: noAssoc(true, undefined, false),
    dependencies: [],
    consumers: ['Legacy Branch Systems', 'Batch Processing Jobs', 'Legacy ATM Integration'],
    tags: ['legacy', 'soap', 'deprecated', 'customer-master', 'migration-target'],
    updatedAt: '2025-12-01',
    createdAt: '2012-06-01',
  },
  {
    id: 'generic-003',
    name: 'Mainframe Account Inquiry Service',
    type: 'Generic API',
    origin: 'api-gateway',
    description: 'CICS-based mainframe service for account inquiries. Accessed via 3270 screen scraping or direct CICS transaction calls. Critical for batch reconciliation.',
    domain: 'Core Banking',
    businessCapability: 'Account Management',
    ownerTeam: 'Core Banking Modernization',
    lifecycleStatus: 'Active',
    environments: ['Production'],
    region: 'US-East',
    complianceTags: ['SOX', 'Internal'],
    criticality: 'Mission Critical',
    dataClassification: 'Confidential',
    authPattern: 'RACF',
    version: 'Unknown',
    specType: 'Unknown',
    specSnippet: `# Mainframe Account Inquiry Service
# Interface: CICS Transaction (TN3270 / CTG)
# Transaction IDs: ACIQ, ACBL, ACST
# Copybook: ACIQ-REQUEST, ACIQ-RESPONSE
# Confidence: Low (documentation is sparse)`,
    associatedApps: noAssoc(true, undefined, false),
    dependencies: [],
    consumers: ['Core Banking Ledger API', 'Batch Reconciliation', 'Account Balance API (fallback)'],
    tags: ['mainframe', 'cics', 'legacy', 'internal-only', 'undocumented'],
    updatedAt: '2025-06-15',
    createdAt: '1998-01-01',
  },
  {
    id: 'generic-004',
    name: 'ATM Network UDP Interface',
    type: 'Generic API',
    origin: 'api-gateway',
    description: 'Low-level UDP-based protocol interface to the ATM network controller. Handles PIN verification, dispense commands, and status heartbeats.',
    domain: 'Branch / ATM',
    businessCapability: 'ATM Operations',
    ownerTeam: 'Developer Platform',
    lifecycleStatus: 'Active',
    environments: ['Production'],
    region: 'US-East',
    complianceTags: ['PCI', 'PCI-DSS', 'Internal'],
    criticality: 'Mission Critical',
    dataClassification: 'Restricted',
    authPattern: 'Network-level (VPN + VLAN)',
    version: 'Unknown',
    specType: 'Unknown',
    specSnippet: `# ATM Network UDP Interface
# Protocol: Custom binary over UDP
# Port: 9443 (encrypted tunnel)
# Message types: PIN_VERIFY, DISPENSE, STATUS_HB, BALANCE_INQ
# Confidence: Low (proprietary vendor protocol)`,
    associatedApps: noAssoc(true, undefined, false),
    dependencies: [],
    consumers: ['ATM Fleet', 'ATM Monitoring Dashboard'],
    tags: ['atm', 'udp', 'proprietary', 'binary-protocol', 'hardware'],
    updatedAt: '2025-09-01',
    createdAt: '2005-03-01',
  },
  {
    id: 'generic-005',
    name: 'COBOL Batch Settlement Service',
    type: 'Generic API',
    origin: 'api-gateway',
    description: 'Nightly batch settlement process running on the mainframe. Processes end-of-day settlement files and produces reconciliation reports. Triggered via JCL job scheduling.',
    domain: 'Core Banking',
    businessCapability: 'Settlement',
    ownerTeam: 'Core Banking Modernization',
    lifecycleStatus: 'Active',
    environments: ['Production'],
    region: 'US-East',
    complianceTags: ['SOX', 'Internal'],
    criticality: 'Mission Critical',
    dataClassification: 'Confidential',
    authPattern: 'RACF + JCL Authorization',
    version: 'Unknown',
    specType: 'Unknown',
    specSnippet: `# COBOL Batch Settlement Service
# Type: Batch JCL job (not an API in the traditional sense)
# Schedule: Nightly at 23:00 ET
# Input: SETTLE.DAILY.INPUT dataset
# Output: SETTLE.DAILY.RECON dataset
# Confidence: Medium (well-known schedule, limited documentation)`,
    associatedApps: noAssoc(true, undefined, false),
    dependencies: [],
    consumers: ['Reconciliation Team', 'General Ledger', 'Regulatory Reporting'],
    tags: ['cobol', 'batch', 'settlement', 'mainframe', 'legacy', 'nightly'],
    updatedAt: '2025-08-01',
    createdAt: '1995-01-01',
  },
  {
    id: 'generic-006',
    name: 'Credit Bureau Integration',
    type: 'Generic API',
    origin: 'api-gateway',
    description: 'Integration with external credit bureaus (Experian, TransUnion, Equifax) for credit pulls. Uses vendor-specific XML protocols over HTTPS.',
    domain: 'Lending / Mortgage',
    businessCapability: 'Credit Assessment',
    ownerTeam: 'Lending Platform',
    lifecycleStatus: 'Active',
    environments: ['Production', 'Staging'],
    region: 'US-East',
    complianceTags: ['FCRA', 'PII', 'Internal'],
    criticality: 'Business Critical',
    dataClassification: 'Restricted',
    authPattern: 'Vendor-specific credentials + mTLS',
    version: 'Multiple',
    specType: 'Unknown',
    specSnippet: `# Credit Bureau Integration
# Multiple vendor-specific protocols:
# - Experian: XML/HTTPS (Net Connect)
# - TransUnion: XML/HTTPS (TrueVision)
# - Equifax: XML/HTTPS (InterConnect)
# Confidence: Medium (vendor docs available, not standard OpenAPI)`,
    gatewayLink: {
      gatewayProductType: 'api',
      controlPlaneName: 'lending-cp',
      gatewayInstanceName: 'lending-prod-gw',
      environment: 'Production',
      objects: [
        { type: 'Service', name: 'credit-bureau-proxy', id: 'svc-gen-006' },
      ],
      navigableTargetId: 'gw-api-gen-006',
    },
    associatedApps: noAssoc(true, undefined, false),
    dependencies: [],
    consumers: ['Loan Origination API', 'Mortgage Underwriting MCP', 'Credit Decisioning Engine'],
    tags: ['credit-bureau', 'external', 'vendor', 'pii'],
    updatedAt: '2026-02-01',
    createdAt: '2019-05-01',
  },
  {
    id: 'generic-007',
    name: 'Card Network Authorization Gateway',
    type: 'Generic API',
    origin: 'api-gateway',
    description: 'Interface to Visa/Mastercard authorization networks. Handles real-time authorization request/response flows using ISO 8583 message format.',
    domain: 'Cards',
    businessCapability: 'Card Authorization',
    ownerTeam: 'Cards Platform',
    lifecycleStatus: 'Active',
    environments: ['Production'],
    region: 'US-East, EU-West, APAC',
    complianceTags: ['PCI-DSS', 'PCI', 'Internal'],
    criticality: 'Mission Critical',
    dataClassification: 'Restricted',
    authPattern: 'Network-level (dedicated circuits)',
    version: 'ISO 8583:2003',
    specType: 'Unknown',
    specSnippet: `# Card Network Authorization Gateway
# Protocol: ISO 8583 over TCP/IP
# Networks: Visa (VisaNet), Mastercard (Banknet)
# Message types: 0100 (auth request), 0110 (auth response)
# Confidence: High (well-understood industry standard)`,
    gatewayLink: {
      gatewayProductType: 'api',
      controlPlaneName: 'cards-cp',
      gatewayInstanceName: 'cards-prod-gw',
      environment: 'Production',
      objects: [
        { type: 'Service', name: 'card-network-proxy', id: 'svc-gen-007' },
      ],
      navigableTargetId: 'gw-api-gen-007',
    },
    associatedApps: noAssoc(true, undefined, false),
    dependencies: [],
    consumers: ['Card Authorization Events', 'Fraud Detection API'],
    tags: ['card-network', 'iso-8583', 'visa', 'mastercard', 'external', 'mission-critical'],
    updatedAt: '2026-01-15',
    createdAt: '2010-01-01',
  },
  {
    id: 'generic-008',
    name: 'Print & Mail Fulfillment Service',
    type: 'Generic API',
    origin: 'api-gateway',
    description: 'Vendor interface for physical document printing and mailing (statements, notices, card mailers). Uses SFTP file drops with fixed-width record formats.',
    domain: 'Statements / Documents',
    businessCapability: 'Document Fulfillment',
    ownerTeam: 'Developer Platform',
    lifecycleStatus: 'Active',
    environments: ['Production'],
    region: 'US-East',
    complianceTags: ['PII', 'Internal'],
    criticality: 'Standard',
    dataClassification: 'Confidential',
    authPattern: 'SSH Key + SFTP',
    version: 'Unknown',
    specType: 'Unknown',
    specSnippet: `# Print & Mail Fulfillment Service
# Type: SFTP file transfer
# Format: Fixed-width record (vendor-specific)
# Schedule: Batch (multiple daily windows)
# Confidence: Medium (vendor spec doc available)`,
    associatedApps: noAssoc(false, undefined, false),
    dependencies: [
      { interfaceId: 'rest-008', interfaceName: 'Statement Generation API', type: 'REST API', relationship: 'downstream' },
    ],
    consumers: ['Statement Generation API', 'Card Issuance', 'Notices Team'],
    tags: ['print-mail', 'sftp', 'batch', 'vendor', 'physical-fulfillment'],
    updatedAt: '2025-11-01',
    createdAt: '2016-01-01',
  },
  {
    id: 'generic-009',
    name: 'Regulatory Reporting Data Feed',
    type: 'Generic API',
    origin: 'api-gateway',
    description: 'Outbound data feed to regulatory bodies (Fed, OCC, FDIC). Multiple file formats including XBRL, XML, and CSV. Schedule varies by report type.',
    domain: 'AML / Compliance',
    businessCapability: 'Regulatory Reporting',
    ownerTeam: 'Risk Data Services',
    lifecycleStatus: 'Active',
    environments: ['Production'],
    region: 'US-East',
    complianceTags: ['SOX', 'Basel III', 'CCAR', 'Internal'],
    criticality: 'Mission Critical',
    dataClassification: 'Restricted',
    authPattern: 'Vendor-specific + mTLS',
    version: 'Multiple',
    specType: 'Unknown',
    specSnippet: `# Regulatory Reporting Data Feed
# Multiple output formats: XBRL, XML, CSV
# Destinations: FRB, OCC, FDIC, SEC
# Reports: Call Report, FR Y-9C, CCAR, DFAST
# Schedule: Quarterly, monthly, and ad-hoc
# Confidence: High (well-documented regulatory requirements)`,
    associatedApps: noAssoc(true, undefined, false),
    dependencies: [
      { interfaceId: 'rest-018', interfaceName: 'Risk Exposure API', type: 'REST API', relationship: 'upstream' },
    ],
    consumers: ['Regulators', 'Compliance Team', 'Finance'],
    tags: ['regulatory', 'reporting', 'xbrl', 'compliance', 'external'],
    updatedAt: '2026-03-01',
    createdAt: '2014-06-01',
  },
  {
    id: 'generic-010',
    name: 'Market Data Feed (Bloomberg)',
    type: 'Generic API',
    origin: 'api-gateway',
    description: 'Bloomberg Terminal and B-PIPE market data feed integration. Provides real-time pricing, reference data, and analytics for treasury and trading desks.',
    domain: 'Treasury',
    businessCapability: 'Market Data',
    ownerTeam: 'Treasury Platform',
    lifecycleStatus: 'Active',
    environments: ['Production'],
    region: 'US-East, EU-West',
    complianceTags: ['Internal', 'Vendor License'],
    criticality: 'Business Critical',
    dataClassification: 'Confidential',
    authPattern: 'Bloomberg SAPI credentials',
    version: 'BLPAPI v3',
    specType: 'Unknown',
    specSnippet: `# Market Data Feed (Bloomberg)
# Protocol: Bloomberg BLPAPI (proprietary)
# Data: Real-time pricing, reference data, analytics
# Delivery: Subscription-based streaming
# Confidence: High (vendor-documented API)`,
    associatedApps: noAssoc(true, undefined, false),
    dependencies: [],
    consumers: ['FX Rates API', 'Treasury Liquidity Assistant MCP', 'Trading Desk'],
    tags: ['bloomberg', 'market-data', 'vendor', 'proprietary', 'real-time'],
    updatedAt: '2026-03-15',
    createdAt: '2017-01-01',
  },
];
