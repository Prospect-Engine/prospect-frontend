# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Red Magic** is the frontend application for Sendout, a multi-channel outreach automation platform. It's built with Next.js 15 and connects to the White Walker backend API.

### What Sendout Does

Sendout automates LinkedIn outreach for sales teams and recruiters:

1. **Connect LinkedIn Accounts** - Users connect their LinkedIn profiles (with OTP/2FA support)
2. **Create Campaigns** - Define target audience via CSV uploads or LinkedIn search URLs
3. **Build Sequences** - Create multi-step message sequences (connection request → follow-up messages)
4. **Execute Outreach** - System automatically sends connection requests and messages
5. **Track Results** - Monitor acceptance rates, replies, and conversions in dashboard
6. **Manage Conversations** - Unified inbox for all campaign replies

**Key Features:**
- Multi-account support (connect multiple LinkedIn accounts per workspace)
- Account warmup system (gradual activity increase to avoid LinkedIn restrictions)
- Rate limiting and quota management
- Team collaboration with workspaces and permissions
- CRM integration for lead management
- Real-time status updates via WebSocket

**Tech Stack:**
- Next.js 15.4.6 with Pages Router
- React 19.1.0
- TypeScript 5 (strict mode)
- Tailwind CSS v4 + shadcn/ui (Radix UI primitives)
- Socket.IO for real-time updates
- Stripe for payments

## Development Commands

```bash
# Install dependencies
yarn install

# Start development server (default port 3001)
export PORT=3001 && yarn dev

# Start with Turbopack (faster)
yarn dev:turbopack

# Build for production
yarn build

# Start production server
yarn start

# Linting and formatting
yarn lint                    # Run ESLint
yarn format                  # Format with Prettier
yarn format:check            # Check formatting without changes

# Testing
yarn test                    # Run Jest tests
yarn test:watch              # Watch mode
yarn test:coverage           # Generate coverage report

# Pre-commit (runs install, format, build)
yarn precommit
```

## Architecture Overview

### Directory Structure

```
src/
├── pages/               # Next.js pages (routes)
│   ├── api/            # API proxy routes to white-walker backend
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # Main dashboard
│   ├── outreach/       # Campaign management
│   ├── conversations/  # Inbox & messaging
│   ├── crm/            # CRM features (leads, deals, pipeline)
│   ├── billing/        # Subscription management
│   └── settings/       # User & workspace settings
├── components/
│   ├── ui/             # Base Radix UI components (shadcn/ui)
│   ├── campaign/       # Campaign-specific components
│   ├── integrations/   # Integration setup flows
│   ├── billing/        # Billing components
│   └── layout/         # Page layouts, navigation
├── hooks/              # Custom React hooks
├── context/            # React Context providers
│   ├── AuthContext.tsx # Global auth state
│   └── SocketContext.tsx # WebSocket context
├── lib/                # Core utilities
│   ├── apiCall.ts      # HTTP client with auto token refresh
│   ├── auth.ts         # AuthService class
│   └── authSync.ts     # Cross-tab auth sync
├── services/           # API service layer
├── types/              # TypeScript definitions
└── configs/            # API endpoint configurations
    └── server-config/  # Backend endpoint definitions
```

### State Management

**No Redux/Zustand** - Uses React Context + custom hooks:

- `AuthContext` - Global user/auth state stored in localStorage as `user_data`
- `SocketContext` - WebSocket connection for real-time events
- Custom hooks for data fetching (e.g., `useDashboardData`, `useSubscription`)

### API Integration Pattern

**Base URL:** `http://localhost:3000/white-walker/v1` (dev) or `https://api.sendout.ai/white-walker/v1` (prod)

**Two methods:**

1. **Direct fetch with `credentials: "include"`** - Automatically includes HTTP-only cookies
2. **`apiCall()` utility** (`src/lib/apiCall.ts`) - Centralized wrapper with:
   - Automatic 401 token refresh
   - Error toast notifications
   - Retry prevention

**API Proxy Routes:** Frontend has `/pages/api/*` routes that relay to backend, handling cookies and auth forwarding.

```typescript
// Example: Using apiCall
const { data, status } = await apiCall({
  url: "/campaigns",
  method: "get",
  applyDefaultDomain: true, // Uses NEXT_PUBLIC_BACKEND_URL
});
```

### Authentication Flow

- JWT tokens stored in **HTTP-only cookies** (not localStorage)
- User data stored in localStorage as `user_data`
- Automatic token refresh on 401 via `apiCall()`
- Cross-tab auth sync via localStorage events
- Middleware at `src/middleware.ts` protects routes

### Real-Time Features

**Socket.IO** connects to white-walker worker for:
- LinkedIn auth progress streaming
- Integration status updates
- Real-time notifications

Events subscribed in `SocketContext`:
- `auth:progress` - LinkedIn authentication state
- `debug-url` - Captcha solving URLs

## Key Business Domains

| Domain | Routes | Purpose |
|--------|--------|---------|
| Outreach | `/outreach/*` | Campaign creation, targeting, message sequences |
| Integrations | `/integration/*` | LinkedIn, Gmail, WhatsApp account connections |
| Conversations | `/conversations/*` | Unified inbox, reply management |
| CRM | `/crm/*` | Leads, deals, pipeline (in development) |
| Billing | `/billing/*` | Stripe subscriptions, seat management |
| Settings | `/settings/*` | User, workspace, organization config |

## Campaign Management System

### Campaign Workflow

```
1. Create Campaign
   └── Name, description, settings

2. Select Integration
   └── Choose connected LinkedIn account

3. Add Target Leads
   ├── Upload CSV file with LinkedIn URLs
   └── OR paste LinkedIn search URL (Sales Navigator supported)

4. Create/Select Sequence
   └── Multi-step message templates with delays

5. Review & Launch
   └── Campaign moves to ACTIVE status

6. Execution (Backend)
   ├── System processes leads through sequence steps
   ├── Rate-limited per integration
   └── Real-time status updates via Socket.IO

7. Track & Manage
   ├── Dashboard shows metrics
   ├── Inbox receives replies
   └── Pause/resume campaigns as needed
```

### Campaign States

```typescript
CampaignStatus: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED"
ProcessStatus: "IDLE" | "PROCESSING" | "COMPLETED" | "FAILED"
```

### Campaign Components (`src/components/campaign/`)

| Component | Purpose |
|-----------|---------|
| `CampaignCard.tsx` | Campaign list item with stats and actions |
| `CampaignCreator.tsx` | Multi-step campaign creation wizard |
| `CampaignDetails.tsx` | Campaign overview and settings |
| `CampaignStats.tsx` | Metrics display (sent, accepted, replied) |
| `SequenceBuilder.tsx` | Message sequence editor with steps |
| `SequenceStep.tsx` | Individual step in sequence (message + delay) |
| `LeadsUploader.tsx` | CSV upload and LinkedIn URL input |
| `LeadsTable.tsx` | Target leads list with status |
| `AddLeadsStep.tsx` | Lead targeting step in wizard |

### Sequence System

Sequences are ordered lists of actions sent to leads:

```typescript
SequenceStep: {
  id: string;
  type: "CONNECTION_REQUEST" | "MESSAGE" | "INMAIL" | "FOLLOW_UP";
  content: string;        // Message template with variables
  delay: number;          // Days to wait before this step
  delay_unit: "DAYS" | "HOURS";
}

// Variables in templates:
// {{firstName}}, {{lastName}}, {{company}}, {{title}}
```

### Lead States (19 audience states)

```typescript
AudienceState:
  | "PENDING"           // Awaiting processing
  | "FETCHING_PROFILE"  // Fetching LinkedIn profile
  | "PROFILE_FETCHED"   // Profile data retrieved
  | "SENDING_CONNECTION"// Sending connection request
  | "CONNECTION_SENT"   // Request sent, awaiting response
  | "CONNECTED"         // Connection accepted
  | "MESSAGING"         // Sending message
  | "MESSAGE_SENT"      // Message delivered
  | "REPLIED"           // Lead responded
  | "COMPLETED"         // Sequence finished
  | "FAILED"            // Error occurred
  | "EXCLUDED"          // Manually excluded
  | "WITHDRAWN"         // Connection withdrawn
  // ... additional states
```

## Integration System

### Supported Platforms

| Platform | Auth Method | Features |
|----------|-------------|----------|
| LinkedIn | Credentials + OTP | Full outreach, Sales Navigator |
| Gmail | OAuth | Email outreach |
| WhatsApp | QR Code | Messaging |
| Facebook | OAuth | Messaging |
| Telegram | Phone + Code | Messaging |
| Twitter | OAuth | DMs |

### LinkedIn Integration Components (`src/components/integrations/`)

| Component | Purpose |
|-----------|---------|
| `LinkedinAuthFlow.tsx` | LinkedIn connection wizard |
| `IntegrationCard.tsx` | Account card with status |
| `IntegrationStatus.tsx` | Connection status indicator |
| `OtpInput.tsx` | 2FA/OTP code input |
| `CaptchaSolver.tsx` | Captcha detection and resolution |
| `ProxySelector.tsx` | Country-based proxy selection |
| `WarmupStatus.tsx` | Account warmup progress |

### Integration States

```typescript
ConnectionStatus: "CONNECTED" | "DISCONNECTED" | "RECONNECTING"
RequiredAction: "WAITING" | "PROVIDE_OTP" | "UPDATE_CREDENTIALS" | "RETRY" | "SOLVE_CAPTCHA" | "TWO_FACTOR_AUTH_ENABLED"
```

### Account Warmup Phases

New LinkedIn accounts go through warmup to avoid restrictions:

```
INITIAL → RAMPING → BUILDING → MATURE
(Day 1-3)  (Day 4-7)  (Day 8-14)  (Day 15+)
```

Each phase has increasing daily action limits.

## Dashboard & Analytics

### Dashboard Components (`src/components/dashboard/`)

| Component | Purpose |
|-----------|---------|
| `DashboardStats.tsx` | Key metrics cards |
| `ActivityFeed.tsx` | Recent campaign activities |
| `ReplyList.tsx` | Recent message replies |
| `CampaignOverview.tsx` | Active campaigns summary |
| `QuotaUsage.tsx` | Daily action limits |

### Dashboard Hook

```typescript
// src/hooks/useDashboardData.ts
const {
  stats,        // Campaign metrics
  activities,   // Recent activities
  replies,      // Message replies
  campaigns,    // Active campaigns
  loading,
  refetch
} = useDashboardData(filters);
```

## Conversations/Inbox System

### Inbox Components (`src/components/conversations/`)

| Component | Purpose |
|-----------|---------|
| `InboxList.tsx` | Conversation list sidebar |
| `ConversationThread.tsx` | Message thread view |
| `MessageComposer.tsx` | Reply composer |
| `ContactCard.tsx` | Lead profile in conversation |

### Features

- Unified inbox for all platform messages
- Conversation threading by lead
- Quick reply with templates
- Mark as read/unread
- Filter by campaign, status, platform

## Key Types

### Campaign Types (`src/types/campaign/`)

```typescript
interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  process_status: ProcessStatus;
  integration_id: string;
  sequence_id: string;
  target_leads_count: number;
  campaign_stats: {
    total_leads: number;
    connections_sent: number;
    connections_accepted: number;
    messages_sent: number;
    replies_received: number;
  };
  created_at: string;
  updated_at: string;
}

interface Sequence {
  id: string;
  name: string;
  steps: SequenceStep[];
  is_active: boolean;
}

interface TargetLead {
  id: string;
  campaign_id: string;
  lead_id: string;
  status: AudienceState;
  current_step: number;
  linkedin_url: string;
  profile_data?: LeadProfile;
}
```

### Integration Types (`src/types/integration/`)

```typescript
interface Integration {
  id: string;
  platform: Platform;
  account_name: string;
  account_email: string;
  connection_status: ConnectionStatus;
  required_action?: RequiredAction;
  warmup_phase: WarmupPhase;
  daily_quota: QuotaInfo;
  created_at: string;
}

interface QuotaInfo {
  connections_limit: number;
  connections_used: number;
  messages_limit: number;
  messages_used: number;
}
```

## Billing System

### Billing Components (`src/components/billing/`)

| Component | Purpose |
|-----------|---------|
| `PricingPlans.tsx` | Subscription plan cards |
| `SubscriptionStatus.tsx` | Current plan display |
| `SeatManager.tsx` | Team seat allocation |
| `PaymentHistory.tsx` | Invoice list |
| `UpgradeModal.tsx` | Plan upgrade dialog |

### Subscription States

```typescript
interface Plan {
  plan_id: string;
  plan_code: string;
  name: string;
  is_active: boolean;
  is_canceled: boolean;
  is_trial: boolean;
  on_trial: boolean;
  trial_used: boolean;
  is_on_grace_period: boolean;
  seat_count: number;
  interval: "MONTHLY" | "YEARLY";
}
```

### Stripe Integration

- Checkout sessions via `/api/subscription/createCheckoutSession`
- Customer portal via `/api/billing/customerPortal`
- Promo code validation
- 30-day trial period

## CRM System (In Development)

### CRM Components (`src/components/crm-components/`)

| Component | Purpose |
|-----------|---------|
| `LeadsTable.tsx` | Lead database with filters |
| `LeadDetails.tsx` | Individual lead profile |
| `CompanyCard.tsx` | Company information |
| `PipelineBoard.tsx` | Kanban-style deal pipeline |
| `DealCard.tsx` | Deal item in pipeline |
| `TaskList.tsx` | CRM tasks and reminders |

### CRM Routes

```
/crm/leads      - Lead database
/crm/companies  - Company directory
/crm/deals      - Deal management
/crm/pipeline   - Kanban pipeline view
/crm/tasks      - Task management
/crm/inbox      - CRM inbox
/crm/settings   - CRM configuration
```

**Note:** CRM uses a separate backend (`NEXT_PUBLIC_CRM_BACKEND_URL`) and is currently disabled in `_app.tsx`.

## Team & Workspace System

### Workspace Components (`src/components/workspace/`)

| Component | Purpose |
|-----------|---------|
| `WorkspaceSwitcher.tsx` | Workspace dropdown selector |
| `WorkspaceSettings.tsx` | Workspace configuration |
| `TeamMembers.tsx` | Member list and roles |
| `InviteMember.tsx` | Send team invitations |
| `PermissionManager.tsx` | Role-based access control |

### Permission Levels

```typescript
WorkspaceRole: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER"
Permission: "READ_ONLY" | "RESTRICTED" | "FULL_PERMISSION"
```

### Multi-Tenant Structure

```
Organization (billing entity)
  └── Workspace (team/project)
       └── Integrations (connected accounts)
            └── Campaigns
```

## HTTP Status Codes

- `200`, `201` - Success
- `400` - Bad Request
- `401` - Unauthorized (triggers token refresh)
- `403` - Forbidden (immediate logout)
- `438` - Trial period expired (custom)
- `498` - Extension period expired (custom)

## Environment Variables

```env
PORT=3001
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000/white-walker/v1
NEXT_PUBLIC_CRM_BACKEND_URL=https://crm-service.rokify.ai/break-engine-backend/v1
NEXT_PUBLIC_MINIO_ENDPOINT=https://cdn.sendout.ai
NEXT_PUBLIC_MINIO_BUCKET=sendout
NEXT_PUBLIC_MAINTENANCE_MODE=false
```

## Code Style

**TypeScript:** Strict mode enabled, but ESLint rules are permissive (allows `any`, unused vars)

**Prettier:** 80-char width, 2-space indent, double quotes, semicolons, trailing commas

**Path Aliases:** `@/*` → `./src/*`

**Naming:**
- Components: PascalCase (`Navigation.tsx`)
- Utilities: camelCase (`apiCall.ts`)
- Types: suffix with `Type` or `Props` (e.g., `UserDataType`)

## Docker

```bash
# Development
docker-compose up red-magic-dev     # Port 3000

# Staging
docker-compose up red-magic-stage   # Port 3001

# Production
docker-compose up red-magic-prod    # Port 3002

# Build images
docker build -t red-magic:dev --target=dev .
docker build -t red-magic:prod --target=prod .
```

## Important Files

| File | Purpose |
|------|---------|
| `src/context/AuthContext.tsx` | Global auth state (1200+ lines - very large) |
| `src/lib/apiCall.ts` | HTTP client with token refresh |
| `src/middleware.ts` | Route protection, auth validation |
| `src/pages/_app.tsx` | App wrapper with providers |
| `src/configs/server-config/*.ts` | Backend endpoint definitions |
| `server.js` | Custom Next.js server with Socket.IO relay |

## Testing

- **Framework:** Jest with jsdom
- **Setup:** `jest.setup.js` mocks `window.matchMedia`, `IntersectionObserver`, `ResizeObserver`
- **Pattern:** `*.test.ts(x)` or `*.spec.ts(x)` in `tests/` directory
- **Module paths:** `@/` aliased to `src/`

## Third-Party Integrations

- **Stripe:** Checkout, customer portal, webhooks
- **Socket.IO:** Real-time auth progress, integration status
- **MinIO/S3:** File storage at `cdn.sendout.ai`
- **LinkedIn:** OAuth + credential auth with OTP/2FA handling

## Known Patterns

1. **API calls use proxy routes** - Frontend calls `/api/*`, which relays to backend
2. **Auth tokens in cookies** - Never access directly; use `credentials: "include"`
3. **Integration auth is async** - Uses Socket.IO for real-time progress
4. **CRM is separate** - Different backend URL, features disabled in `_app.tsx`
5. **Campaign execution** - Per-integration queues with rate limiting
