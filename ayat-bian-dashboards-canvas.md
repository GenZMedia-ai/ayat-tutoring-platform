# Ayat w Bian - Complete Dashboards Canvas

## System Overview
A comprehensive tutoring management system with role-based dashboards designed to manage the complete student journey from trial booking through active learning.

### Brand Identity
- **Primary Color**: #a57865 (Light brown/taupe)
- **Secondary Color**: #57463f (Dark brown)
- **Role Colors**: Admin (Red), Sales (Blue), Teacher (Green), Supervisor (Yellow)

---

## 🔴 Admin Dashboard
**Purpose**: Complete system control, financial management, and user administration  
**Access Level**: Unrestricted - full system visibility

### 📊 Homepage (System Command Center)
**Top Metrics Row**
- Total Revenue (multi-currency consolidated)
- Active Students Count
- Teacher Utilization Rate %
- Today's Sessions Count
- Monthly Conversion Rate
- System Uptime Status

**Critical Alerts Panel**
- Failed payment webhooks with retry options
- System errors requiring attention
- Pending user approval queue (with count)
- Expired payment links summary
- Teacher capacity warnings (>90% full)
- Low performance alerts

**Quick Actions Grid**
- Create Invitation Code → Opens modal
- Approve Pending Users → Direct to approvals
- Generate Financial Report → Date range selector
- System Announcement → Broadcast message
- Backup System → One-click backup
- View Audit Logs → Recent system changes

**Recent Activity Feed**
- New user registrations
- Large payments received
- Teacher status changes
- System configuration updates

### 📅 Trial Appointments (System-Wide View)
**Main Features**
- Complete trial list across all teachers/sales agents
- Real-time status updates via WebSocket
- Bulk operations toolbar

**Filtering Options**
- Date range picker with presets
- Status multi-select (Pending, Confirmed, Completed, Ghosted)
- Teacher selector with capacity display
- Sales agent performance comparison
- Country/timezone grouping

**Data Columns**
- Student Name (clickable → profile)
- Trial Date/Time (with timezone)
- Teacher (with current capacity)
- Sales Agent (with conversion rate)
- Status (with duration in status)
- Actions (Edit, Cancel, Reassign)

**Bulk Actions**
- Mass reassignment with capacity preview
- Bulk status updates
- Export to CSV/Excel
- Send bulk notifications

**Analytics Panel**
- Conversion funnel by teacher
- Sales agent performance ranking
- No-show patterns analysis
- Peak booking times heatmap

### 👥 Students (Complete Database)
**View Modes**
- Grid view with photos
- Detailed list view
- Family grouping view
- Timeline view (student journey)

**Advanced Filters**
- Status (all 13 statuses)
- Package type and progress
- Teacher assignment
- Country/timezone
- Payment status and history
- Last activity date
- Tag system

**Student Profile Access**
- Complete history timeline
- All payments and amounts
- Session attendance records
- Teacher notes compilation
- Family connections
- Communication logs

**Administrative Actions**
- Force status changes
- Manual payment recording
- Archive/restore functions
- Merge duplicate profiles
- Add administrative notes
- Override system restrictions

**Bulk Operations**
- Mass status updates
- Batch reassignments
- Group archival
- Export segments
- Tag management

### 📚 Sessions (Financial Control Center)
**Calendar View**
- Month/week/day toggles
- Revenue per day overlay
- Teacher utilization heatmap
- Drag-drop rescheduling

**List View Columns**
- Session Date/Time
- Student (with package info)
- Teacher (with hourly rate)
- Duration (planned vs actual)
- Revenue (calculated)
- Payment to Teacher
- Profit Margin
- Status

**Financial Analytics**
- Revenue by package type
- Teacher cost analysis
- Profit margins by segment
- Currency performance
- Refund tracking

**Payroll Management**
- Automatic calculation preview
- Bonus applications
- Adjustment interface
- Export for accounting
- Payment confirmation tracking

### ⚙️ Settings (Multi-Tab Configuration)

#### User Management Tab
**Invitation Code System**
- Create codes with role assignment
- Set expiration (hours/days/uses)
- Bulk code generation
- Usage tracking
- Revoke active codes

**User Approval Queue**
- Pending registrations list
- Profile preview
- One-click approve/reject
- Bulk approval options
- Rejection reasons

**Active User Management**
- Role changes
- Permission overrides
- Password resets
- Account deactivation
- Activity monitoring
- Login history

#### Package Management Tab
**Package Creation**
- Name and description
- Session count setting
- Pricing (currency-neutral)
- Active/inactive toggle
- Promotional flags

**Package Analytics**
- Sales by package
- Completion rates
- Renewal patterns
- Popular combinations

#### Currency Management Tab
**Currency Controls**
- Enable/disable currencies
- Display order
- Symbol management
- Decimal precision
- Regional settings

**Multi-Currency Reports**
- Consolidated revenue
- Currency distribution
- Exchange impact (if applicable)

#### Teacher Configuration Tab
**Compensation Settings**
- Base hourly rates by type
- Bonus structures
- Capacity limits (individual)
- Performance thresholds
- Payment schedules

**Teacher Categories**
- Kids specialist settings
- Adult learning config
- Mixed category rules
- Expert qualifications

#### System Configuration Tab
**Notification Rules**
- Channel priorities
- Retry attempts
- Quiet hours
- Template management

**Business Rules**
- Payment link expiry (hours)
- Archive timing (days)
- Session duration limits
- Reschedule maximum
- Capacity defaults

**Integration Settings**
- Webhook URLs
- API rate limits
- External calendar sync
- Backup schedules

---

## 🔵 Sales Dashboard
**Purpose**: Rapid trial booking and payment conversion  
**Primary Goal**: Book trials in <2 minutes, convert at 65%+

### 🏠 Homepage (Sales Command Center)
**Personal Performance Cards**
- My Conversion Rate (with trend)
- Trials Booked Today/Week/Month
- Pending Follow-ups Count
- Active Payment Links
- This Month's Ranking

**🔍 Quick Availability Checker (PRIMARY FEATURE)**
- **Layout**: Center of homepage, always visible
- **Search Fields**:
  - Date picker (with today button)
  - Timezone selector (customer's location)
  - Teacher type (Kids/Adult/Mixed/Expert)
  - Time range (AM/PM/Evening presets)
- **Results Display**:
  - 30-minute slots with availability
  - "3 teachers available" indicators
  - One-click booking buttons
  - Visual capacity indicators
  - Real-time updates (30-second cache)

**Today's Priority Tasks**
- Follow-ups due (sorted by time)
- Expiring payment links (<24h)
- Recent trial completions (<5h)
- Custom reminders set
- Uncontacted leads

**Quick Stats**
- Team average conversion rate
- My rank this month
- Best performing package
- Peak conversion times

### 📅 Trial Appointments
**My Bookings View**
- Status-grouped lists (Pending, Confirmed, Completed)
- Time since booking indicators
- Teacher assignment display
- Quick filters sidebar

**Booking Interface**
- **Step 1**: Slot selection from checker
- **Step 2**: Booking type choice
  - Single Student
  - Multi Students (2-5)
- **Step 3**: Information forms
  
**Single Student Form**
- Student Name
- Country (dropdown)
- WhatsApp Number
- Platform (Zoom/Meet)
- Age
- Notes field
- Auto-filled trial details

**Multi Student Form**
- Parent information section
- Number of students selector
- Dynamic student fields
- Shared trial confirmation
- Family ID generation

**Booking Confirmation**
- 2-minute slot lock timer
- Teacher assignment display
- WhatsApp template copy
- Calendar download option

### 📞 Follow-up Management
**Trial Completed Queue**
- Smart sorting by completion time
- Conversion urgency indicators:
  - 🟢 <15 minutes (hot lead)
  - 🟡 15min-1hr (warm lead)
  - 🔴 >5hrs (cooling lead)
- One-click actions:
  - WhatsApp contact
  - Create payment link
  - Schedule follow-up
  - Mark not interested

**Payment Link Creator**
- Package selector (names only, no prices)
- Currency selector (admin-enabled only)
- Standard vs custom price toggle
- Multi-student cart builder
- Family discount options
- Link expiry timer
- Copy link button
- WhatsApp share integration

**Custom Follow-up Scheduler**
- Calendar with available slots
- Preset reasons:
  - "After Eid holiday"
  - "Payday consideration"
  - "Family decision"
  - "Custom reason"
- Reminder notifications
- Follow-up history log

**Link Performance Tracker**
- Active links with countdown
- Click tracking
- Expired link recovery
- Conversion analytics

### 👥 Students (Paid Only)
**My Converted Students**
- Success stories display
- Package progress bars
- Renewal opportunities flags
- Quick contact buttons
- Session attendance summary

**Filters**
- Package type
- Sessions remaining
- Last contact date
- Renewal eligible

### 📊 Sessions
**Calendar View**
- My students' sessions only
- No financial data
- Contact shortcuts
- Session status tags

### 📈 Analysis
**Conversion Funnel**
- Visual funnel chart
- Stage-by-stage metrics
- Drop-off analysis
- Improvement suggestions

**Performance Trends**
- Daily/weekly/monthly views
- Comparison with team
- Best practices highlights
- Goal tracking

---

## 🟢 Teacher Dashboard
**Purpose**: Efficient trial management and quality session delivery  
**Focus**: Student relationships and transparent earnings

### 🏠 Homepage (Teacher Command Center)
**Status Overview Cards**
- Current Capacity (e.g., "7/10 students")
- Pending WhatsApp Contacts (red badge)
- Today's Sessions Count
- This Month's Earnings
- Minutes Taught Counter
- Bonus Amount Display

**Urgent Actions Panel**
- Students requiring WhatsApp contact (sorted by age)
- Unconfirmed trials (with elapsed time)
- Sessions starting soon (<2 hours)
- Unmarked completed sessions
- Registration pending queue

**Today's Schedule Timeline**
- Visual timeline 6 AM - 10 PM
- Session blocks with student names
- Platform icons (Zoom/Meet)
- One-click join buttons
- Break time indicators

**Earnings Widget**
- Month-to-date base salary
- Bonus accumulation
- Projected monthly total
- Minutes breakdown
- Payment date countdown

### 📅 Add Availability
**Weekly Grid Interface**
- 7-day view (Mon-Sun)
- 30-minute slots (6 AM - 10 PM)
- Egypt timezone display only
- Drag to select multiple slots
- Click to toggle single slots

**Bulk Operations Toolbar**
- Copy last week
- Clear all
- Set recurring pattern
- Mark vacation days
- Apply template

**Visual Indicators**
- Available (green)
- Booked (gray)
- Pending (yellow)
- Your sessions (blue)
- Conflicts (red)

**Smart Features**
- Conflict detection
- Minimum break enforcement
- Peak time suggestions
- Capacity warnings

### 🎯 Trial Appointments
**Pending Confirmations**
- Priority-sorted list
- Time elapsed badges
- Student age display
- Country/timezone info
- Contact status icons

**WhatsApp Integration**
- Pre-filled message templates
- One-click contact buttons
- Contact confirmation tracking
- Template variations by age

**Trial Management Actions**
- Confirm (after contact)
- Mark completed
- Mark ghosted
- Request reschedule
- Add notes

**Trial History**
- Completed trials log
- Conversion tracking
- Personal success rate
- Feedback compilation

### 👥 Students (Paid Only)
**Active Students Grid**
- Profile cards with photos
- Session progress rings
- Package type badges
- WhatsApp group status
- Last session date

**Complete Registration Flow**
1. Payment notification receipt
2. WhatsApp congratulations
3. Create group (Teacher + Student + Supervisor)
4. Schedule ALL sessions upfront
5. System registration form
6. Activation confirmation

**Student Management**
- Session history access
- Learning notes log
- Progress tracking
- Attendance records
- Communication timeline

### 📚 Sessions
**Today's Paid Sessions**
- Quick-access list
- Countdown timers
- Platform quick links
- Previous session notes
- Mark complete buttons

**Session Completion Form**
- Actual minutes (10-90)
- Attendance status
- Learning notes
- Homework assigned
- Next session prep

**Calendar Management**
- Month view with filters
- Completed (green)
- Upcoming (blue)
- Missed (red)
- Rescheduled (yellow)

### 💰 Revenue
**Earnings Dashboard**
- **Current Month Section**:
  - Base salary progress
  - Minutes accumulation
  - Bonus breakdown
  - Daily earnings chart
  
- **Historical View**:
  - Past 6 months
  - Payment records
  - Bonus history
  - Annual summary

- **Transparency Features**:
  - Calculation breakdown
  - Rate visibility
  - Bonus criteria
  - Payment schedule

---

## 🟡 Supervisor Dashboard
**Purpose**: Team quality management and performance optimization  
**Scope**: Typically manages 15 teachers

### 🏠 Homepage (Quality Command Center)
**Team Metrics Cards**
- Total Teachers Count
- Average Capacity Utilization %
- Team Conversion Rate
- Active Alerts Count
- Quality Score Average
- Today's Team Sessions

**Alert Priority Queue**
- 🔴 Critical: >6h unconfirmed trials
- 🟡 Warning: 3-6h delays
- 🔵 Info: Performance notifications
- ⚪ Resolved: Recent fixes

**Team Performance Snapshot**
- Top 5 performers
- Bottom 5 needing support
- Capacity distribution chart
- Response time analysis

**Quick Actions**
- Message all teachers
- Schedule team meeting
- View quality reports
- Access training materials

### 🚨 Alerts Management
**Active Alerts Queue**
- Auto-sorted by severity
- Time-based escalation
- Teacher grouping
- One-click resolutions
- Snooze options

**Alert Types**
- Confirmation delays
- Low performance metrics
- Capacity issues
- Quality concerns
- Student complaints
- Technical problems

**Alert Configuration**
- Threshold settings
- Escalation rules
- Notification preferences
- Auto-resolution rules

### 👥 Team Management
**Teacher List View**
- Real-time capacity bars
- Performance indicators
- Current status (Available/Busy/Break)
- Last activity timestamp
- Quick action buttons

**Individual Teacher Profiles**
- Performance metrics dashboard
- Student feedback summary
- Session history analysis
- Quality scores trending
- Improvement plans
- Communication logs

**Bulk Management Tools**
- Message selected teachers
- Adjust capacity limits
- Apply bonuses
- Schedule observations
- Export reports

### ✅ Quality Control
**Session Observation Scheduler**
- Calendar integration
- Random selection algorithm
- Teacher notification options
- Observation forms
- Follow-up scheduling

**Evaluation Tools**
- Standardized rubrics
- Real-time scoring
- Feedback templates
- Improvement tracking
- Best practice sharing

**Quality Metrics Dashboard**
- Team average scores
- Individual rankings
- Trend analysis
- Category breakdowns
- Action plan tracking

### 🔄 Reassignment Tools
**Bulk Reassignment Wizard**
- **Step 1**: Select source teacher
- **Step 2**: View affected students
- **Step 3**: Choose distribution method:
  - Auto-distribute (AI-optimized)
  - Manual selection
  - Type-based matching
- **Step 4**: Preview capacity impacts
- **Step 5**: Confirm with notifications

**Capacity Preview Panel**
- Before/after visualization
- Warning indicators
- Suggested alternatives
- Impact analysis

**Emergency Reassignment**
- Quick single student moves
- Immediate teacher swaps
- Session coverage recording
- Payroll adjustment notes

### 👥 Students
**Team Student Overview**
- All students under team teachers
- Status distribution
- Progress monitoring
- At-risk indicators
- Success stories

### 📚 Sessions
**Team Calendar**
- All teacher sessions
- Observation schedule overlay
- Coverage management
- Conflict resolution
- Attendance patterns

**Session Quality Tools**
- Random spot checks
- Student feedback review
- Completion rate analysis
- Duration compliance

### 📊 Analysis
**Team Performance Suite**
- **Comparative Metrics**:
  - Teacher rankings
  - Conversion rates
  - Student satisfaction
  - Response times
  - Quality scores

- **Predictive Analytics**:
  - Capacity forecasting
  - Performance trends
  - Risk indicators
  - Optimization suggestions

- **Reports Generation**:
  - Weekly team summary
  - Individual progress reports
  - Quality assessments
  - Training recommendations

---

## 🔧 Common Features Across All Dashboards

### Navigation & Interface
- Responsive design (mobile/tablet/desktop)
- Role-based color theming
- Breadcrumb navigation
- Quick search (Ctrl+K)
- Keyboard shortcuts
- Dark mode toggle

### Communication Integration
- WhatsApp buttons with templates
- Internal commenting system
- @mention notifications
- Activity feeds
- Announcement banners

### Data Management
- Advanced filtering UI
- Column customization
- Export options (CSV/Excel/PDF)
- Saved filter sets
- Bulk operations
- Undo/redo support

### Real-Time Features
- WebSocket connections
- Live status updates
- Presence indicators
- Typing indicators
- Auto-refresh toggles
- Offline mode detection

### Security & Permissions
- Role-based access control
- Field-level permissions
- Audit trail logging
- Session management
- 2FA support
- API token management

### Performance Features
- Lazy loading
- Infinite scroll
- Virtual scrolling
- Optimistic updates
- Request debouncing
- Smart caching

---

## 📱 Mobile Considerations

### Teacher Mobile Priority
- Session quick-complete
- Availability toggle
- Student contact
- Earnings view

### Sales Mobile Priority  
- Quick availability checker
- Trial booking
- Payment link sharing
- Follow-up management

### Responsive Breakpoints
- Desktop: 1200px+
- Tablet: 768px-1199px
- Mobile: <768px

### Touch Optimizations
- Larger tap targets
- Swipe gestures
- Pull to refresh
- Bottom navigation

---

## 🎯 Success Metrics Integration

### Per-Dashboard KPIs
- **Admin**: Revenue growth, system health
- **Sales**: Conversion rate, booking speed  
- **Teacher**: Capacity utilization, earnings
- **Supervisor**: Team performance, quality scores

### Gamification Elements
- Sales leaderboards
- Teacher achievements
- Quality badges
- Streak counters
- Monthly challenges

### Analytics Integration
- Real-time dashboards
- Historical comparisons
- Predictive insights
- Anomaly detection
- Custom reports

---

## 🔐 Data Access Matrix

| Data Type | Admin | Sales | Teacher | Supervisor |
|-----------|-------|-------|---------|------------|
| Financial Details | ✅ Full | ❌ Hidden | ✅ Own Only | ❌ Hidden |
| Student Info | ✅ Full | ✅ Full | ✅ Assigned | ✅ Team |
| Teacher Data | ✅ Full | ✅ Limited | ✅ Own | ✅ Team |
| System Settings | ✅ Full | ❌ None | ❌ None | ❌ None |
| Session Details | ✅ Full | ✅ Limited | ✅ Own | ✅ Team |
| Performance Metrics | ✅ Full | ✅ Own | ✅ Own | ✅ Team |

---

This canvas represents a complete blueprint for the Ayat w Bian dashboard system, designed to optimize every role's workflow while maintaining strict data security and operational efficiency.