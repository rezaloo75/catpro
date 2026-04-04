export type InterfaceType = 'REST API' | 'Event API' | 'LLM API' | 'MCP' | 'Generic API';

export type LifecycleStatus = 'Proposed' | 'Active' | 'Deprecated' | 'Retiring' | 'Experimental';

export type Criticality = 'Mission Critical' | 'Business Critical' | 'Standard';

export type SpecType = 'OpenAPI' | 'AsyncAPI' | 'MCP' | 'Unknown';

export type GatewayProductType = 'api' | 'event' | 'ai';

export type DataClassification = 'Public' | 'Internal' | 'Confidential' | 'Restricted';

export type LLMProvider = 'openai' | 'anthropic' | 'mistral' | 'google' | 'meta' | 'cohere';

export type Environment = 'Production' | 'Staging' | 'Development' | 'Sandbox';

export interface GatewayObject {
  type: string;
  name: string;
  id: string;
}

export interface GatewayLink {
  gatewayProductType: GatewayProductType;
  controlPlaneName: string;
  gatewayInstanceName: string;
  environment: Environment;
  objects: GatewayObject[];
  navigableTargetId: string;
}

export interface AppAssociation {
  linked: boolean;
  summary?: string;
  linkedObjectsCount?: number;
  details?: Record<string, string | number | boolean>;
}

export interface PortalPublication {
  portalName: string;
  portalId: string;
  audience: 'External' | 'Internal' | 'Partner';
  visibility: 'Public' | 'Private';
  status: 'Published' | 'Draft';
}

export interface RegistryPublication {
  registryName: string;
  registryId: string;
  toolsExposed: number;
  agents: string[];
}

// Where this interface was originally created
export type OriginApp = 'portal' | 'api-gateway' | 'event-gateway' | 'ai-gateway' | 'context-mesh';

export interface AssociatedApps {
  observability: AppAssociation;
  portal: AppAssociation & { publications?: PortalPublication[] };
  meteringBilling: AppAssociation;
  contextMesh: AppAssociation & { registries?: RegistryPublication[] };
}

export interface Dependency {
  interfaceId?: string;
  interfaceName: string;
  type: InterfaceType | 'External';
  relationship: 'composes-from' | 'upstream' | 'downstream' | 'consumes' | 'provides';
  detail?: string;
}

export interface CatalogInterface {
  id: string;
  name: string;
  type: InterfaceType;
  origin: OriginApp;
  description: string;
  domain: string;
  businessCapability: string;
  ownerTeam: string;
  lifecycleStatus: LifecycleStatus;
  environments: Environment[];
  region: string;
  complianceTags: string[];
  criticality: Criticality;
  dataClassification: DataClassification;
  authPattern: string;
  version: string;
  specType: SpecType;
  specSnippet?: string;
  llmProvider?: LLMProvider;
  gatewayLink?: GatewayLink;
  associatedApps: AssociatedApps;
  dependencies: Dependency[];
  consumers: string[];
  tags: string[];
  updatedAt: string;
  createdAt: string;
}
