# Dakqaeq - Arabic Assessment Platform

## Overview

Dakqaeq is a comprehensive Arabic-language educational platform focused on standardized test preparation, particularly for the Qiyas (قياس) exams used in Saudi Arabia. The platform provides verbal and quantitative ability testing, gamification elements, premium subscriptions, and AI-powered assistance to help students prepare for academic assessments.

## System Architecture

### Frontend Architecture

The application uses a modern React-based frontend built with:
- **React 18** with TypeScript for type safety
- **Wouter** for client-side routing (lightweight alternative to React Router)
- **TailwindCSS** with custom CSS variables for styling
- **shadcn/ui** component library for consistent UI elements
- **Radix UI** primitives for accessible components
- **Vite** as the build tool and development server
- **TanStack Query** for server state management and caching

### Backend Architecture

The backend is built with:
- **Express.js** server with TypeScript
- **Session-based authentication** using express-session
- **RESTful API** architecture with centralized error handling
- **File-based storage** system for development/prototyping
- **Drizzle ORM** configured for PostgreSQL (with Neon Database)

### Database Design

The system uses PostgreSQL with the following key entities:
- **Users**: Authentication, points, levels, subscription status
- **Questions**: Multi-category questions with difficulty levels, topics, and explanations
- **UserTestResults**: Test performance tracking with scoring and analytics
- **ExamTemplates**: Configurable exam structures
- **Folders**: User-created question collections
- **FolderQuestions**: Many-to-many relationship for organizing questions

## Key Components

### Authentication System
- Session-based authentication with Google OAuth integration
- User profile management with subscription tiers (Free, Pro, Pro Life)
- Points and level progression system

### Assessment Engine
- **Qiyas Exam Simulation**: Full 120-question, 120-minute standardized tests
- **Abilities Testing**: Verbal and quantitative skill assessments with adaptive difficulty
- **Custom Challenges**: Gamified learning experiences with streak tracking
- **Mock Exams**: Practice tests with realistic timing and scoring

### Gamification Features
- **Points System**: Reward users for completing tests and challenges
- **Level Progression**: Unlock advanced content through achievement
- **Achievement Badges**: Recognition for milestones and consistent performance
- **Streak Tracking**: Encourage daily engagement

### AI Assistant
- **Anthropic Claude Integration**: Natural language Q&A support
- **Question Search**: Fuzzy matching and semantic search capabilities
- **Smart Suggestions**: Related question recommendations
- **Arabic Text Processing**: Specialized handling for Arabic diacritics and variations

### Subscription Management
- **Tiered Access**: Free, Pro, and Pro Life subscription levels
- **PayPal Integration**: Automated payment processing
- **Feature Gating**: Progressive access to premium content and features

## Data Flow

1. **User Registration/Login**: Session creation and profile initialization
2. **Assessment Flow**: Question retrieval → User interaction → Score calculation → Results storage
3. **Progress Tracking**: Real-time updates to user stats and achievements
4. **AI Interaction**: Query processing → External API calls → Response formatting
5. **Subscription Management**: Payment verification → Access level updates

## External Dependencies

### Payment Processing
- **PayPal SDK**: Handles subscription payments and upgrades
- **STC Pay**: Alternative payment method for Middle Eastern users

### AI Services
- **Anthropic Claude API**: Powers the intelligent assistant functionality
- **Custom fuzzy search**: Arabic-specific text matching algorithms

### Database & Infrastructure
- **Neon Database**: Managed PostgreSQL hosting
- **Replit**: Development and deployment platform

### UI Libraries
- **Radix UI**: Accessible component primitives
- **Lucide Icons**: Consistent iconography
- **Cairo Font**: Arabic typography optimization

## Deployment Strategy

The application is configured for deployment on Replit with:
- **Auto-scaling**: Handles variable user loads
- **Environment Variables**: Secure configuration management
- **Build Pipeline**: Vite frontend build + esbuild backend compilation
- **Asset Management**: Static file serving with proper caching headers

The deployment process:
1. Frontend builds to `dist/public` directory
2. Backend compiles to `dist/index.js`
3. Static assets served through Express middleware
4. Database migrations run automatically on startup

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### Advanced Time Management System - June 20, 2025
- **Enhanced "وقتي" (Time Management) Section**: Completely rebuilt with advanced features and local data storage
- **Smart Local Storage**: Comprehensive data management system storing all user data locally on device
- **Advanced Analytics**: Multi-dimensional productivity analysis with charts and insights
- **Smart Goals System**: SMART goals with milestones, progress tracking, and rewards
- **Intelligent Insights**: Automated analysis providing personalized recommendations
- **Comprehensive Backup System**: Full backup/restore functionality with automatic weekly backups
- **Advanced Settings**: Customizable productivity parameters, notifications, and Pomodoro configurations
- **Enhanced Components**: 
  - Advanced task management with time tracking and categories
  - Comprehensive habit tracker with streak monitoring
  - Enhanced Pomodoro timer with session analytics
  - Project management with progress tracking
  - Time block calendar for visual scheduling
- **Arabic Interface**: Fully localized with proper RTL support and Arabic terminology

### Progressive Web App (PWA) Integration - June 20, 2025
- **App Download Section**: Created comprehensive download instructions for all platforms
- **PWA Support**: Added Service Worker and manifest.json for mobile app experience
- **Platform-Specific Instructions**: 
  - Android: Chrome browser installation with step-by-step guide
  - iOS: Safari "Add to Home Screen" detailed instructions
  - Desktop: Chrome/Edge app installation for Windows, Mac, Linux
- **Creative App Logo**: Custom gradient logo with Arabic letter "ق"
- **Features Highlighting**: Offline capability, faster loading, native app experience
- **User-Friendly Interface**: Interactive cards with platform detection and guided tutorials

### Technical Implementation
- **Local Data Storage**: All time management data stored using localStorage with structured schemas
- **Data Types**: Comprehensive TypeScript interfaces for tasks, habits, projects, analytics
- **Component Architecture**: Modular design with reusable time management components
- **Real-time Analytics**: Dynamic calculation of productivity metrics and insights
- **Responsive Design**: Mobile-first approach with adaptive layouts

## Changelog

Previous Updates:
- June 20, 2025. Initial Arabic assessment platform setup with 7,000+ questions