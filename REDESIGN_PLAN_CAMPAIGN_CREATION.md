# Campaign Creation Page Redesign Plan

## Current State Analysis

### Page Structure
- **Route**: `/outreach/campaigns/[id]/create?step=integration`
- **Layout**: Left sidebar stepper (1/4) + Main content area (3/4)
- **Steps**: Integration → Add Leads → Sequence → Schedule → Quota

### Current Integration Step Fields (Must Keep Exact)
```typescript
interface LinkedInProfile {
  id: string;
  name: string;
  email: string;
  profile_picture?: string;
  is_connected: boolean;
  connection_status: "active" | "inactive" | "error";
  last_sync?: string;
  is_premium: boolean;
}
```

### Current Pain Points
1. Two-column layout for profile selection feels cluttered
2. "Selected Profiles" grid takes too much space when empty
3. Progress indicator at top is disconnected from steps
4. Step navigation feels heavy and takes up too much vertical space
5. Loading states are basic spinners
6. No visual feedback on profile hover/selection
7. Mobile responsiveness could be improved

---

## Redesign Proposal

### Design Philosophy
- **Minimalist & Clean**: Remove visual clutter, focus on actions
- **Progressive Disclosure**: Show complexity only when needed
- **Micro-interactions**: Smooth animations for better UX
- **Mobile-First**: Responsive from the ground up

---

## Layout Changes

### Option A: Horizontal Steps with Floating Card (Recommended)

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back    Create LinkedIn Campaign                    Step 1/5  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    ●────────○────────○────────○────────○                        │
│  Integration  Leads   Sequence  Schedule  Quota                  │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │     [LinkedIn Icon]                                      │   │
│  │                                                          │   │
│  │     Select Your LinkedIn Profile                         │   │
│  │     Choose which account to use for this campaign        │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │ ○ [Avatar] Roki Hasan          Premium Connected │   │   │
│  │  │           rokib@prospectengine.com               │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │ ○ [Avatar] John Doe                    Connected │   │   │
│  │  │           john@company.com                       │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  │                              [Continue →]                │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Option B: Sidebar Steps with Cleaner Main Area

```
┌────────────────┬────────────────────────────────────────────────┐
│                │ ← Back          Create LinkedIn Campaign       │
│  Campaign      ├────────────────────────────────────────────────┤
│  ─────────     │                                                │
│                │   [LinkedIn Icon]                              │
│  ● Integration │                                                │
│  ○ Add leads   │   Select LinkedIn Profile                      │
│  ○ Sequence    │   Choose which account to run this campaign    │
│  ○ Schedule    │                                                │
│  ○ Quota       │   ┌────────────────────────────────────────┐  │
│                │   │ ● [Avatar] Roki Hasan                  │  │
│                │   │   rokib@prospectengine.com             │  │
│                │   │   Premium · Connected                   │  │
│                │   └────────────────────────────────────────┘  │
│                │                                                │
│                │   ┌────────────────────────────────────────┐  │
│                │   │ ○ [Avatar] John Doe                    │  │
│                │   │   john@company.com                     │  │
│                │   │   Connected                            │  │
│                │   └────────────────────────────────────────┘  │
│                │                                                │
│                │                          [Continue →]          │
│                │                                                │
└────────────────┴────────────────────────────────────────────────┘
```

---

## Component Redesign Details

### 1. Step Indicator (Horizontal)

**Current**: Card with vertical list in sidebar
**New**: Horizontal progress stepper at top

```tsx
// New horizontal stepper component
<div className="flex items-center justify-center gap-2">
  {steps.map((step, i) => (
    <div key={i} className="flex items-center">
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center",
        "transition-all duration-300",
        i < activeStep ? "bg-emerald-500 text-white" :
        i === activeStep ? "bg-black text-white ring-4 ring-black/10" :
        "bg-gray-200 text-gray-500"
      )}>
        {i < activeStep ? <Check className="w-4 h-4" /> : i + 1}
      </div>
      {i < steps.length - 1 && (
        <div className={cn(
          "w-12 h-0.5 mx-2",
          i < activeStep ? "bg-emerald-500" : "bg-gray-200"
        )} />
      )}
    </div>
  ))}
</div>
```

### 2. Profile Selection Cards

**Current**: Two-column split (Available | Selected)
**New**: Single list with radio/checkbox selection

```tsx
// Profile card with selection state
<div className={cn(
  "group relative p-4 rounded-xl border-2 cursor-pointer",
  "transition-all duration-200 ease-out",
  isSelected
    ? "border-black bg-gray-50 shadow-sm"
    : "border-transparent bg-white hover:border-gray-200 hover:shadow-sm"
)}>
  {/* Selection indicator */}
  <div className={cn(
    "absolute top-4 right-4 w-5 h-5 rounded-full border-2",
    "flex items-center justify-center transition-all",
    isSelected
      ? "border-black bg-black"
      : "border-gray-300 group-hover:border-gray-400"
  )}>
    {isSelected && <Check className="w-3 h-3 text-white" />}
  </div>

  {/* Profile info */}
  <div className="flex items-center gap-3">
    <Avatar className="w-12 h-12 ring-2 ring-white shadow">
      <AvatarImage src={profile.profile_picture} />
      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
        {profile.name.charAt(0)}
      </AvatarFallback>
    </Avatar>

    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-gray-900 truncate">
          {profile.name}
        </span>
        {profile.is_premium && (
          <Badge className="bg-amber-100 text-amber-700 border-0">
            <Crown className="w-3 h-3 mr-1" />
            Premium
          </Badge>
        )}
      </div>
      <p className="text-sm text-gray-500 truncate">{profile.email}</p>
    </div>

    {/* Status indicator */}
    <div className={cn(
      "flex items-center gap-1.5 text-xs font-medium",
      profile.connection_status === "active"
        ? "text-emerald-600"
        : "text-gray-400"
    )}>
      <span className={cn(
        "w-2 h-2 rounded-full",
        profile.connection_status === "active"
          ? "bg-emerald-500 animate-pulse"
          : "bg-gray-300"
      )} />
      {profile.connection_status === "active" ? "Connected" : "Disconnected"}
    </div>
  </div>
</div>
```

### 3. Action Footer

**Current**: Simple flex row with text + button
**New**: Sticky footer with context-aware messaging

```tsx
<div className="sticky bottom-0 bg-white/80 backdrop-blur-lg border-t p-4">
  <div className="max-w-3xl mx-auto flex items-center justify-between">
    <div className="flex items-center gap-2">
      {selectedCount > 0 ? (
        <>
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          <span className="text-sm font-medium">
            {selectedCount} profile{selectedCount > 1 ? 's' : ''} selected
          </span>
        </>
      ) : (
        <>
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <span className="text-sm text-amber-600">
            Select at least one profile to continue
          </span>
        </>
      )}
    </div>

    <Button
      disabled={selectedCount === 0}
      className="min-w-32"
    >
      Continue
      <ArrowRight className="w-4 h-4 ml-2" />
    </Button>
  </div>
</div>
```

### 4. Loading State

**Current**: Simple spinner
**New**: Skeleton cards with shimmer effect

```tsx
// Skeleton loader for profiles
<div className="space-y-3">
  {[1, 2, 3].map(i => (
    <div key={i} className="p-4 rounded-xl border animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gray-200 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-3 bg-gray-100 rounded w-48" />
        </div>
        <div className="h-6 bg-gray-100 rounded w-20" />
      </div>
    </div>
  ))}
</div>
```

---

## Animation & Micro-interactions

### 1. Step Transitions
```css
/* Framer Motion for step changes */
const stepVariants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
};
```

### 2. Profile Selection
```css
/* Card selection animation */
.profile-card {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.profile-card:hover {
  transform: translateY(-2px);
}
.profile-card.selected {
  transform: scale(1.01);
}
```

### 3. Button Loading States
```tsx
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      Saving...
    </>
  ) : (
    <>
      Continue
      <ArrowRight className="w-4 h-4 ml-2" />
    </>
  )}
</Button>
```

---

## Color Scheme

### Keep Consistent with GenSales Theme
- **Primary**: `#000000` (Black) - buttons, selected states
- **Accent**: `#3b82f6` (Blue) - LinkedIn branded elements
- **Success**: `#10b981` (Emerald) - connected status, checkmarks
- **Warning**: `#f59e0b` (Amber) - premium badge, alerts
- **Background**: `#fafafa` to `#f3f4f6` gradient

---

## Mobile Responsiveness

### Breakpoints
- **Mobile** (< 640px): Stack everything vertically, full-width cards
- **Tablet** (640px - 1024px): Horizontal steps, 2-column grid if needed
- **Desktop** (> 1024px): Full layout with comfortable spacing

### Mobile-Specific Changes
1. Steps become swipeable or collapsible
2. Profile cards take full width
3. Footer becomes fixed at bottom
4. Larger touch targets (min 44px)

---

## Implementation Priority

### Phase 1: Core Layout (1-2 hours)
1. Replace sidebar stepper with horizontal stepper
2. Simplify profile selection to single list
3. Update card styling with new selection states

### Phase 2: Polish (1 hour)
1. Add skeleton loaders
2. Add hover/selection animations
3. Improve mobile responsiveness

### Phase 3: Micro-interactions (30 mins)
1. Step transition animations
2. Button loading states
3. Toast notifications styling

---

## Files to Modify

1. `/pages/outreach/campaigns/[id]/create.tsx` - Main layout, stepper
2. `/pages/outreach/campaigns/[id]/steps/IntegrationStep.tsx` - Profile selection UI
3. Create new component: `/components/campaign/HorizontalStepper.tsx`
4. Create new component: `/components/campaign/ProfileSelectionCard.tsx`

---

## Backend Sync Checklist

### Must Preserve (API Contracts)
- [ ] `GET /api/integration/list` - Fetch available profiles
- [ ] `POST /api/outreach/campaign/integrationStep/getIntegrations` - Get campaign integrations
- [ ] `POST /api/outreach/campaign/integrationStep/addIntregrationToCampaign` - Save selection
- [ ] `POST /api/outreach/campaign/getCampaign` - Fetch campaign data

### Data Structure (No Changes)
- [ ] `LinkedInProfile` interface fields remain identical
- [ ] `campaignId`, `integration_ids` payload structure unchanged
- [ ] Response handling for nested `data.data` structure

---

## Design Mockup Summary

### Before
- Heavy sidebar taking 25% width
- Two-column profile selection
- Basic progress indicator
- Cluttered visual hierarchy

### After
- Clean horizontal stepper
- Single-column profile list with selection indicators
- Floating card design with subtle shadows
- Clear visual hierarchy with typography and spacing
- Smooth animations and micro-interactions

Would you like me to proceed with implementing this redesign?
