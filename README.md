# Ayat Tutoring Platform

A comprehensive tutoring management system with family booking, payment processing, and session management capabilities.

## 🌟 Features

### Multi-Role Dashboard System
- **Teacher Dashboard**: Session management, student tracking, availability scheduling
- **Sales Dashboard**: Lead management, follow-ups, payment link generation
- **Admin Dashboard**: User management, system configuration, analytics
- **Supervisor Dashboard**: Quality control, team oversight, performance monitoring

### Family Booking System
- **Family Groups**: Book multiple siblings together
- **Coordinated Scheduling**: Shared sessions for family members
- **Package Selection**: Individual or family package options
- **Payment Management**: Unified billing for families

### Payment Processing
- **Stripe Integration**: Secure payment processing
- **Multi-Currency Support**: USD, SAR, AED, QAR
- **Payment Links**: Generate and track payment links
- **Revenue Tracking**: Comprehensive financial analytics

### Session Management
- **Trial Sessions**: Schedule and manage trial classes
- **Regular Sessions**: Complete session lifecycle management
- **Rescheduling**: Flexible scheduling with availability checks
- **Progress Tracking**: Student progress and session completion

### Communication Features
- **WhatsApp Integration**: Contact tracking and communication
- **Telegram Integration**: Secure verification and notifications
- **N8N Automation**: Automated notification workflows
- **Real-time Updates**: Live dashboard updates

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **React Router** for navigation
- **React Query** for server state management

### Backend
- **Supabase** as Backend-as-a-Service
- **PostgreSQL** database with Row Level Security
- **Edge Functions** for serverless computing
- **Real-time subscriptions** for live updates

### Integrations
- **Stripe** for payment processing
- **WhatsApp Business API**
- **Telegram Bot API**
- **N8N** for workflow automation

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Stripe account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/GenZMedia-ai/ayat-tutoring-platform.git
   cd ayat-tutoring-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**
   - Run the migrations in the `supabase/migrations/` directory
   - Configure Row Level Security policies
   - Set up Edge Functions

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── admin/          # Admin dashboard components
│   ├── teacher/        # Teacher dashboard components
│   ├── sales/          # Sales dashboard components
│   ├── auth/           # Authentication components
│   ├── booking/        # Booking system components
│   └── ui/             # Reusable UI components
├── hooks/              # Custom React hooks
├── contexts/           # React contexts
├── services/           # API service layer
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── integrations/       # External service integrations

supabase/
├── functions/          # Edge Functions
├── migrations/         # Database migrations
└── config.toml         # Supabase configuration
```

## 🎯 Key Features Implemented

### Authentication & Authorization
- Role-based access control (Admin, Teacher, Sales, Supervisor)
- Secure authentication with Supabase Auth
- Row Level Security for data protection

### Student Management
- Comprehensive student profiles
- Family group management
- Status tracking (pending, trial, paid, active, expired)
- Assignment to teachers and sales agents

### Trial System
- Trial session booking
- Outcome tracking
- Conversion to paid students
- Follow-up management

### Payment Integration
- Stripe checkout integration
- Payment link generation
- Revenue tracking and analytics
- Multi-currency support

### Session Management
- Schedule management with Egypt timezone
- Session completion tracking
- Rescheduling functionality
- Progress monitoring

### Notification System
- N8N integration for automated workflows
- WhatsApp and Telegram notifications
- Real-time dashboard updates

## 🔒 Security Features

- Row Level Security (RLS) policies
- Secure API endpoints
- Input validation and sanitization
- Secure payment processing
- Audit logging for administrative actions

## 🌍 Internationalization

- Arabic and English language support
- RTL (Right-to-Left) layout support
- Timezone handling (Egypt/Cairo)

## 📊 Analytics & Reporting

- Teacher performance metrics
- Sales conversion tracking
- Revenue analytics
- Business intelligence dashboard
- Real-time metrics

## 🔧 Configuration

The system supports extensive configuration through:
- Environment variables
- Supabase configuration
- N8N workflow automation
- Stripe webhook configuration

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary software developed for Ayat Tutoring Platform.

## 🤝 Support

For support and questions, please contact the development team.

---

Built with ❤️ for effective tutoring management