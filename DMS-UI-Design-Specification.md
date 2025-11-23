# DMS Production System - UI/UX Design Specification

## Executive Summary
This document provides comprehensive design specifications for the DMS (Digital Manufacturing System) Production interface. It includes design system guidelines, component specifications, and screen layouts that can be implemented in Figma.

## Design System

### Color Palette

#### Primary Colors
- **Primary Blue**: #2563EB (rgb(37, 99, 235))
  - Used for: Primary actions, active states, links
  - Variants: #1E40AF (dark), #3B82F6 (light)

- **Success Green**: #10B981 (rgb(16, 185, 129))
  - Used for: Success states, positive indicators, running status
  - Variants: #059669 (dark), #34D399 (light)

- **Warning Yellow**: #F59E0B (rgb(245, 158, 11))
  - Used for: Warning states, attention indicators
  - Variants: #D97706 (dark), #FBBF24 (light)

- **Danger Red**: #EF4444 (rgb(239, 68, 68))
  - Used for: Error states, critical indicators, downtime
  - Variants: #DC2626 (dark), #F87171 (light)

#### Neutral Grays
- Gray 50: #F9FAFB (backgrounds)
- Gray 100: #F3F4F6 (subtle backgrounds)
- Gray 200: #E5E7EB (borders)
- Gray 300: #D1D5DB (disabled elements)
- Gray 400: #9CA3AF (placeholder text)
- Gray 500: #6B7280 (secondary text)
- Gray 600: #4B5563 (primary text)
- Gray 700: #374151 (headings)
- Gray 800: #1F2937 (dark text)
- Gray 900: #111827 (darkest text)

#### Accent Colors
- Purple: #8B5CF6 (HR section)
- Cyan: #06B6D4 (Maintenance section)
- Pink: #EC4899 (KPI section)
- Orange: #F97316 (Lessons Learned)
- Teal: #14B8A6 (Transport)

### Typography

#### Font Family
- Primary: System UI fonts (Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto)
- Monospace: "Roboto Mono" for numerical data

#### Font Sizes
- **Headings**
  - H1: 24px / 2rem (Page titles)
  - H2: 20px / 1.25rem (Section titles)
  - H3: 18px / 1.125rem (Card titles)
  - H4: 16px / 1rem (Subsection titles)

- **Body Text**
  - Large: 16px / 1rem (Primary content)
  - Base: 14px / 0.875rem (Standard text)
  - Small: 12px / 0.75rem (Secondary text, labels)
  - Tiny: 10px / 0.625rem (Micro text, badges)

#### Font Weights
- Regular: 400 (Body text)
- Medium: 500 (Labels, navigation)
- Semibold: 600 (Headings, important data)
- Bold: 700 (Key metrics, emphasis)

### Spacing System
Based on 4px base unit:
- XS: 4px (0.25rem)
- SM: 8px (0.5rem)
- MD: 16px (1rem)
- LG: 24px (1.5rem)
- XL: 32px (2rem)
- 2XL: 48px (3rem)
- 3XL: 64px (4rem)

### Border Radius
- Small: 4px (inputs, badges)
- Medium: 8px (buttons, cards)
- Large: 12px (modals, panels)
- XL: 16px (major containers)
- Full: 9999px (circular elements, pills)

### Shadows
- **Small**: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
  - Usage: Subtle elevation

- **Medium**: 0 4px 6px -1px rgba(0, 0, 0, 0.1)
  - Usage: Cards, dropdowns

- **Large**: 0 10px 15px -3px rgba(0, 0, 0, 0.1)
  - Usage: Modals, floating panels

## Component Library

### 1. Navigation Components

#### Sidebar Navigation
- **Width**: 
  - Expanded: 256px (16rem)
  - Collapsed: 80px (5rem)
- **Background**: White (#FFFFFF)
- **Border**: 1px solid Gray 200
- **Height**: 100vh

**Navigation Item States**:
- Default: Gray 600 text, Gray 400 icon
- Hover: Gray 50 background
- Active: Blue 50 background, Blue 600 text, 4px right border (Primary Blue)

**Logo Section**:
- Height: 64px (4rem)
- Contains: Logo icon (32x32px), App name
- Border bottom: 1px solid Gray 200

**User Profile Section**:
- Height: Auto
- Border top: 1px solid Gray 200
- Padding: 16px
- Avatar: 40x40px circular gradient

### 2. Header Component
- **Height**: 64px (4rem)
- **Background**: White
- **Border**: 1px solid Gray 200 (bottom)
- **Content**: 
  - Left: Page title, breadcrumbs
  - Right: Shift info, live status badge

### 3. KPI Card Component

**Structure**:
```
┌─────────────────────────────┐
│ Label              [Icon]    │
│ 412 units                   │
│ Target: 424 units    -2.8%  │
└─────────────────────────────┘
```

**Specifications**:
- Dimensions: Flexible width, 140px height
- Border: 2px solid (color based on status)
- Border Radius: 12px
- Padding: 24px
- Background: White
- Shadow: Small

**Status Colors**:
- Success: Green 200 border, Green 50 background
- Warning: Yellow 200 border, Yellow 50 background
- Danger: Red 200 border, Red 50 background

**Elements**:
1. Label: 14px, Medium weight, Gray 600
2. Status Icon: 20x20px, top right
3. Value: 30px, Bold, Gray 900
4. Unit: 18px, Regular, Gray 500
5. Target: 12px, Regular, Gray 500
6. Trend: 12px, Medium, conditional color

### 4. Production Line Card

**Layout**:
```
┌──────────────────────────────────────────────────┐
│ VW Handle Assy Line 1     [Running Badge]        │
│ Project: VW Handle Assy                           │
│                    97.2%    412/424    [→]       │
│                  Efficiency Output/Target         │
└──────────────────────────────────────────────────┘
```

**Specifications**:
- Height: 96px
- Background: White, hover Gray 50
- Border bottom: 1px solid Gray 200
- Padding: 24px

**Elements**:
1. Line Name: 16px, Semibold, Gray 900
2. Status Badge: 12px, Medium, rounded full, colored background
3. Project Label: 14px, Regular, Gray 500
4. Metrics: 24px value, 10px label
5. Chevron: 20x20px, Gray 400

### 5. Button Components

#### Primary Button
- Background: Primary Blue (#2563EB)
- Text: White, 14px, Medium
- Padding: 12px 24px
- Border Radius: 8px
- Hover: Primary Dark (#1E40AF)
- Active: Slightly darker with scale(0.98)

#### Secondary Button
- Background: White
- Border: 1px solid Gray 300
- Text: Gray 700, 14px, Medium
- Padding: 12px 24px
- Border Radius: 8px
- Hover: Gray 50 background

#### Icon Button
- Size: 40x40px
- Border Radius: 8px
- Icon: 20x20px
- Hover: Gray 100 background

### 6. Input Components

#### Text Input
- Height: 40px
- Border: 1px solid Gray 300
- Border Radius: 8px
- Padding: 8px 16px
- Font: 14px, Regular
- Focus: 2px ring Primary Blue, border Primary Blue

#### Select Dropdown
- Height: 40px
- Border: 1px solid Gray 300
- Border Radius: 8px
- Padding: 8px 16px
- Icon: 16x16px chevron, right aligned
- Font: 14px, Regular

#### Label
- Font: 14px, Medium
- Color: Gray 700
- Margin bottom: 8px

### 7. Status Badge
- Padding: 4px 12px
- Border Radius: 9999px (full)
- Font: 12px, Medium
- Variants:
  - Running: Green 100 bg, Green 700 text
  - Downtime: Red 100 bg, Red 700 text
  - Setup: Yellow 100 bg, Yellow 700 text
  - Warning: Orange 100 bg, Orange 700 text

### 8. Chart Components

#### Bar Chart
- Bar color: Gradient from Primary Blue to lighter blue
- Bar border radius: 4px (top)
- Spacing: 8px between bars
- Axis labels: 12px, Gray 500
- Grid lines: 1px, Gray 200

#### Progress Bar
- Height: 8px
- Background: Gray 200
- Fill: Gradient (context dependent)
- Border Radius: 9999px

### 9. Card Component
- Background: White
- Border: 1px solid Gray 200
- Border Radius: 12px
- Shadow: Small
- Padding: 24px

**Header**:
- Border bottom: 1px solid Gray 200
- Padding: 16px 24px
- Title: 18px, Semibold, Gray 900

**Body**:
- Padding: 24px

## Screen Layouts

### Dashboard Layout

```
┌─────────────┬─────────────────────────────────────────┐
│             │  Header (64px)                           │
│             ├─────────────────────────────────────────┤
│  Sidebar    │  ┌────┐ ┌────┐ ┌────┐ ┌────┐           │
│  (256px)    │  │KPI │ │KPI │ │KPI │ │KPI │           │
│             │  └────┘ └────┘ └────┘ └────┘           │
│             │                                          │
│   Nav       │  ┌─────────────────────────────────┐   │
│   Items     │  │  Production Lines Status         │   │
│             │  │  ┌──────────────────────────┐   │   │
│             │  │  │ Line 1                    │   │   │
│             │  │  ├──────────────────────────┤   │   │
│             │  │  │ Line 2                    │   │   │
│             │  │  ├──────────────────────────┤   │   │
│             │  │  │ Line 3                    │   │   │
│             │  │  └──────────────────────────┘   │   │
│             │  └─────────────────────────────────┘   │
│             │                                          │
│  User       │  ┌────────────┐ ┌────────────────────┐ │
│  Profile    │  │ Output/Hr  │ │ Downtime Analysis  │ │
│             │  │   Chart    │ │     Chart          │ │
│             │  └────────────┘ └────────────────────┘ │
└─────────────┴─────────────────────────────────────────┘
```

### Production Monitoring Layout

```
┌─────────────┬─────────────────────────────────────────┐
│             │  Header (Shift Info, Date, Time)        │
│             ├─────────────────────────────────────────┤
│  Sidebar    │  ┌─────────────────────────────────┐   │
│             │  │  Shift Configuration             │   │
│             │  │  [Shift] [Project] [Part No]     │   │
│             │  │  [Hour]  [Workstation]           │   │
│             │  └─────────────────────────────────┘   │
│             │                                          │
│             │  ┌─────────┬─────────┬─────────────┐   │
│             │  │ Output  │ Target  │ Efficiency   │   │
│             │  │  212    │  212    │   100%       │   │
│             │  └─────────┴─────────┴─────────────┘   │
│             │                                          │
│             │  ┌─────────────────────────────────┐   │
│             │  │  Production Team / Workstation   │   │
│             │  │  [Scan ID Card] [Workstation]    │   │
│             │  │                                   │   │
│             │  │  [Remove] [Add] [License Card]   │   │
│             │  │                                   │   │
│             │  │  ┌───────┬────────┬──────────┐  │   │
│             │  │  │ Photo │ Name   │ Station  │  │   │
│             │  │  ├───────┼────────┼──────────┤  │   │
│             │  │  │  👤   │ User 1 │ ASB-0029 │  │   │
│             │  │  └───────┴────────┴──────────┘  │   │
│             │  └─────────────────────────────────┘   │
│             │                                          │
│             │  ┌─────────────────────────────────┐   │
│             │  │  Downtime Tracking               │   │
│             │  │  [Create Ticket] [Confirm]       │   │
│             │  │                                   │   │
│             │  │  Time/Min: [_____]               │   │
│             │  │  Problem:  [Dropdown]            │   │
│             │  │  Action:   [Text Area]           │   │
│             │  └─────────────────────────────────┘   │
└─────────────┴─────────────────────────────────────────┘
```

## Screen-by-Screen Specifications

### 1. Dashboard Screen
**Purpose**: Real-time overview of all production metrics

**Components**:
1. Top KPI Row (4 cards)
   - Output, Efficiency, Scrap, Downtime
2. Production Lines Status Panel
   - List of all active production lines
   - Real-time status indicators
3. Charts Row
   - Left: Output per hour bar chart
   - Right: Downtime analysis breakdown

### 2. Production Screen
**Purpose**: Detailed production tracking and data entry

**Components**:
1. Shift Configuration Panel
   - Shift selection (Morning/Evening/Night)
   - Date picker with calendar
   - Project dropdown
   - Production line selector
   - Part number selector
   - Hour selector
2. Output Metrics Row
   - Large numeric displays for key metrics
3. Team/Workstation Assignment
   - ID card scanner integration
   - Employee photo badges
   - Workstation assignments
   - Qualification indicators
4. Downtime Tracking
   - Ticket creation form
   - Problem category selector
   - Time tracking
   - Action/comment textarea

### 3. Inventory Screen
**Purpose**: Material inventory tracking and management

**Components**:
1. Search and Filter Bar
2. Inventory Data Grid
   - Part Number
   - Description
   - Quantity
   - Location
   - Batch Number
   - Status
3. Quick Actions
   - Add Entry
   - Generate Report
   - Incomplete Box View

### 4. HR & Employees Screen
**Purpose**: Employee management and qualification tracking

**Components**:
1. Employee Directory
   - Photo cards
   - Contact information
   - Department
   - Status
2. Qualification Matrix
   - Employee vs. Process grid
   - Certification status
   - Expiry dates
3. Attendance Tracker
   - Calendar view
   - Shift assignments

### 5. Quality & Defects Screen
**Purpose**: Defect tracking and quality control

**Components**:
1. Defect Entry Form
   - Workstation
   - Defect type
   - Quantity
   - Photos
2. Defect Statistics
   - Top defects Pareto chart
   - Trend analysis
3. Quality Metrics
   - PPM (Parts Per Million)
   - FTQ (First Time Quality)
   - Scrap rate

### 6. Maintenance Screen
**Purpose**: Machine maintenance and downtime management

**Components**:
1. Downtime List
   - Active and closed tickets
   - Status indicators
   - Priority levels
2. Maintenance Calendar
   - Scheduled maintenance
   - Preventive maintenance
3. Equipment Status
   - Machine health indicators
   - Last maintenance date

### 7. KPI & Indicators Screen
**Purpose**: Track and manage key performance indicators

**Components**:
1. KPI Cards Grid
   - Configurable metrics
   - Target vs. actual
   - Trend indicators
2. Department Selector
3. Time Range Selector
4. Action Plans
   - Issues and corrective actions
   - Responsible parties
   - Due dates

### 8. Lessons Learned Screen
**Purpose**: Document and share lessons learned

**Components**:
1. Lesson Card Grid
   - Type (Good/Bad practice)
   - Description
   - Root cause
   - Actions taken
   - Status
2. Filtering Options
   - Project
   - Process
   - Date range
3. Reaction/Feedback System

## Interaction Patterns

### Navigation
- Single click to navigate
- Active state persists
- Smooth transitions (200ms)

### Forms
- Inline validation
- Error messages below fields
- Clear error states
- Success confirmation

### Data Loading
- Skeleton screens for initial load
- Shimmer effects for content loading
- Progress indicators for long operations

### Responsive Behavior
- Sidebar collapses on mobile
- Cards stack vertically on small screens
- Tables become scrollable horizontally

## Accessibility Guidelines

### Color Contrast
- Text: Minimum 4.5:1 ratio
- Large text: Minimum 3:1 ratio
- Interactive elements: Minimum 3:1 ratio

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Focus states clearly visible (2px blue outline)
- Logical tab order

### Screen Reader Support
- Proper ARIA labels
- Semantic HTML
- Alt text for images

## Implementation Notes for Figma

### File Structure
```
DMS Production System/
├── 🎨 Design System
│   ├── Colors
│   ├── Typography
│   ├── Spacing
│   └── Shadows
├── 🧩 Components
│   ├── Navigation
│   ├── Cards
│   ├── Forms
│   ├── Buttons
│   ├── Charts
│   └── Status Indicators
├── 📱 Screens
│   ├── Dashboard
│   ├── Production
│   ├── Inventory
│   ├── HR
│   ├── Quality
│   ├── Maintenance
│   ├── KPI
│   └── Lessons Learned
└── 📐 Templates
    └── Master Layout
```

### Component Variants
Create variants for:
- Button states (default, hover, active, disabled)
- Card types (default, success, warning, danger)
- Status badges (all status types)
- Input states (default, focus, error, disabled)

### Auto Layout
Use Auto Layout for:
- Navigation items
- Card content
- Form fields
- Button groups
- KPI cards

### Responsive Frames
Create frames for:
- Desktop: 1920x1080
- Tablet: 1024x768
- Mobile: 375x812

### Prototyping
- Create interactive prototype for main user flows
- Use overlays for modals and dropdowns
- Implement smooth transitions
- Add hover states

## Technical Specifications

### Performance
- Maximum initial load: 2 seconds
- Time to interactive: 3 seconds
- Refresh rate for real-time data: 5 seconds

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Data Refresh
- Real-time metrics: 5-second polling
- Charts: 1-minute refresh
- Static data: On-demand refresh

---

## Appendix: Component Checklist

### Must-Have Components
- ✅ Sidebar Navigation
- ✅ Header with breadcrumbs
- ✅ KPI Cards (4 variants)
- ✅ Production Line Cards
- ✅ Data Tables
- ✅ Forms (Input, Select, Textarea)
- ✅ Buttons (Primary, Secondary, Icon)
- ✅ Status Badges
- ✅ Charts (Bar, Line, Donut)
- ✅ Modal Dialogs
- ✅ Dropdown Menus
- ✅ Date Pickers
- ✅ Time Pickers
- ✅ Search Bars
- ✅ Filter Panels
- ✅ Progress Bars
- ✅ Loading Indicators
- ✅ Alert/Notification Banners
- ✅ Employee Photo Badges
- ✅ Workstation Cards

### Page Templates
- ✅ Dashboard Layout
- ✅ Form Layout
- ✅ Table Layout
- ✅ Grid Layout
- ✅ Detail View Layout

---

*This specification document should be used as a complete guide for implementing the DMS Production System UI in Figma. All measurements, colors, and spacing are production-ready values.*
