/**
 * GENIEFY API CONFIGURATION
 * =========================
 * Centralized API endpoints for all Geniefy services.
 * All services share authentication via the main backend.
 */

// Service base URLs
export const API_ENDPOINTS = {
  // Main backend (auth, campaigns, integrations, messaging)
  main: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/white-walker/v1',

  // GenSales - Shared Sales entities (companies, contacts, deals)
  gensales: process.env.NEXT_PUBLIC_GENSALES_URL || 'http://localhost:3010/api/v1',

  // GenChat - AI qualification & chatbots
  genchat: process.env.NEXT_PUBLIC_GENCHAT_URL || 'http://localhost:3011/api/v1',

  // GenFin - Financial management
  genfin: process.env.NEXT_PUBLIC_GENFIN_URL || 'http://localhost:3012/api/v1',

  // GenHR - HR management
  genhr: process.env.NEXT_PUBLIC_GENHR_URL || 'http://localhost:3013/api/v1',

  // GenDo - Task & project management
  gendo: process.env.NEXT_PUBLIC_GENDO_URL || 'http://localhost:3014/api/v1',
} as const;

export type ServiceName = keyof typeof API_ENDPOINTS;

/**
 * Get the base URL for a specific service
 */
export function getServiceUrl(service: ServiceName): string {
  return API_ENDPOINTS[service];
}

/**
 * Build a full API URL for a specific service
 */
export function buildApiUrl(service: ServiceName, path: string): string {
  const baseUrl = API_ENDPOINTS[service];
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

/**
 * Service-specific API helpers
 */
export const api = {
  // Main backend endpoints
  main: {
    auth: (path: string) => buildApiUrl('main', `/auth${path}`),
    campaigns: (path: string = '') => buildApiUrl('main', `/campaigns${path}`),
    integrations: (path: string = '') => buildApiUrl('main', `/integrations${path}`),
    messaging: (path: string = '') => buildApiUrl('main', `/messaging${path}`),
    billing: (path: string = '') => buildApiUrl('main', `/billing${path}`),
  },

  // GenSales endpoints (shared across all products)
  sales: {
    companies: (path: string = '') => buildApiUrl('gensales', `/companies${path}`),
    contacts: (path: string = '') => buildApiUrl('gensales', `/contacts${path}`),
    deals: (path: string = '') => buildApiUrl('gensales', `/deals${path}`),
    activities: (path: string = '') => buildApiUrl('gensales', `/activities${path}`),
    tags: (path: string = '') => buildApiUrl('gensales', `/tags${path}`),
    notes: (path: string = '') => buildApiUrl('gensales', `/notes${path}`),
  },

  // GenChat endpoints
  chat: {
    chatbots: (path: string = '') => buildApiUrl('genchat', `/chatbots${path}`),
    conversations: (path: string = '') => buildApiUrl('genchat', `/conversations${path}`),
    qualification: (path: string = '') => buildApiUrl('genchat', `/qualification${path}`),
    surveys: (path: string = '') => buildApiUrl('genchat', `/surveys${path}`),
  },

  // GenFin endpoints
  finance: {
    invoices: (path: string = '') => buildApiUrl('genfin', `/invoices${path}`),
    expenses: (path: string = '') => buildApiUrl('genfin', `/expenses${path}`),
    accounts: (path: string = '') => buildApiUrl('genfin', `/accounts${path}`),
    budgets: (path: string = '') => buildApiUrl('genfin', `/budgets${path}`),
    products: (path: string = '') => buildApiUrl('genfin', `/products${path}`),
    reports: (path: string = '') => buildApiUrl('genfin', `/reports${path}`),
  },

  // GenHR endpoints
  hr: {
    employees: (path: string = '') => buildApiUrl('genhr', `/employees${path}`),
    departments: (path: string = '') => buildApiUrl('genhr', `/departments${path}`),
    positions: (path: string = '') => buildApiUrl('genhr', `/positions${path}`),
    leave: (path: string = '') => buildApiUrl('genhr', `/leave${path}`),
    attendance: (path: string = '') => buildApiUrl('genhr', `/attendance${path}`),
    payroll: (path: string = '') => buildApiUrl('genhr', `/payroll${path}`),
    recruitment: (path: string = '') => buildApiUrl('genhr', `/recruitment${path}`),
  },

  // GenDo endpoints
  tasks: {
    projects: (path: string = '') => buildApiUrl('gendo', `/projects${path}`),
    tasks: (path: string = '') => buildApiUrl('gendo', `/tasks${path}`),
    boards: (path: string = '') => buildApiUrl('gendo', `/boards${path}`),
    timeEntries: (path: string = '') => buildApiUrl('gendo', `/time-entries${path}`),
  },
};

export default api;
