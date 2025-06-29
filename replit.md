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

### WhatsApp Integration Enhancement - Migration Day
- **Direct WhatsApp Integration**: Modified subscription verification to open user's own WhatsApp
- **User Phone Number Routing**: Now uses the phone number entered by user for verification instead of fixed number
- **Improved User Experience**: Users are redirected to their own WhatsApp app with verification code

### Enhanced WhatsApp & Email Verification - January 24, 2025
- **WhatsApp Integration**: Modified the subscription flow to open user's own WhatsApp instead of a fixed number
- **Email Verification Step**: Added email verification as a required step after phone verification 
- **Creative Gmail Integration**: Changed from API to direct Gmail opening with highly creative HTML email templates
- **Advanced Email Design**: Implemented extremely creative email templates with:
  - Multiple CSS animations (shimmer, glow, pulse, slide effects)
  - Gradient backgrounds and glassmorphism effects
  - Interactive hover effects and responsive design
  - Advanced typography with Cairo font and text effects
  - Professional layout with user information and security features
- **Multi-Step Process**: Updated subscription flow from 3 steps to 4 steps including email verification
- **Arabic Interface**: Fully localized verification messages and user interface
- **Centralized Email**: All verification emails sent to qoudratak@gmail.com for manual processing

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

### Full Dark Mode Implementation - June 27, 2025
- **Complete Dark Theme**: Enforced dark mode across entire application
- **CSS Variables Update**: Enhanced dark theme with deep blue color scheme
- **ThemeProvider Configuration**: Forced dark theme as default with no toggle option
- **APK Download Enhancement**: Replaced generated APK with user-provided real APK file (91MB)
- **File Serving Fix**: Added direct APK route bypassing authentication middleware
- **Visual Consistency**: All UI components now use dark theme variables consistently
- **Enhanced APK Download**: Optimized download system for large files with direct download method

### Free-for-All Educational Platform - June 27, 2025
- **Universal Free Access**: All features available to everyone at no cost
- **Authentication from JSON**: User login system reads from attached_assets/user.json file
- **Philosophy**: "Education is a right for everyone" - no paywalls or feature restrictions
- **Creative Guest Names**: Randomly assigned inspiring Arabic names for free users
- **Pro User Recognition**: Premium subscribers acknowledged but receive same features
- **Enhanced Statistics**: Improved user profiles with realistic test data and achievements
- **Beautiful Design**: Creative gradient banners with animated elements and inspiring messages
- **Unlimited Everything**: No limits on tests, AI assistant, time management, or any features
- **Account Management**: Seamless switching between guest accounts and premium logins

### Enhanced PayPal Payment Integration - June 28, 2025
- **Multiple Payment Options**: PayPal, Credit Cards, Bank Transfer, and STC Pay all using same PayPal link
- **Creative Interface Design**: Unique styling and descriptions for each payment method
- **Card Brand Support**: Visual display of Visa, Mastercard, Mada, and American Express
- **Security Features**: PayPal buyer protection and SSL encryption badges
- **User-Friendly Design**: Gradient buttons with distinct colors for each payment type
- **Comprehensive Instructions**: Step-by-step payment completion guidance
- **Apple Pay Removal**: Removed Apple Pay option as requested, maintaining 4 payment methods

### Advanced Test Results with Performance Analytics - June 29, 2025
- **Category-Based Performance Analysis**: Detailed breakdown of performance in verbal and quantitative sections
- **Creative Visualization**: Interactive cards with progress bars, star ratings, and animated elements
- **Intelligent Insights**: Performance level indicators (ممتاز، جيد، يحتاج تحسين) with color-coded feedback
- **Dark Mode PDF Support**: Comprehensive dark theme implementation for downloadable PDF files
- **Interactive Theme Toggle**: Dark/light mode switcher with localStorage persistence
- **Enhanced PDF Experience**: Modern CSS variables, smooth transitions, and responsive design
- **Library Categories Update**: Replaced "dialects" filter with "sections/categories" for better content organization
- **Subcategory Display**: Arabic subject classifications like "التناظر اللفظي" and "الهندسة" properly displayed
- **Rounded Percentages**: Percentages now display as rounded numbers instead of precise decimals
- **Creative HTML Question Downloads**: Advanced HTML file downloads for individual subcategories with stunning visual design
- **Complete Report Downloads**: Comprehensive test reports with dark theme and animated elements

### Specialized Verbal Tests System - June 29, 2025
- **Dedicated Verbal Tests Section**: New "اختبارات اللفظي" with specialized tests for each verbal subcategory
- **Individual Test Categories**: Separate 50-question tests for each subcategory:
  - التناظر اللفظي (Verbal Analogy)
  - إكمال الجمل (Sentence Completion)
  - الاستيعاب المقروء (Reading Comprehension)
  - المترادفات والأضداد (Synonyms and Antonyms)
  - الأخطاء الشائعة (Common Errors)
- **Qiyas Standards**: All tests follow official Qiyas examination standards and timing
- **Daily Limits for Free Users**: Free accounts limited to one test per day per category
- **Advanced Test Runner**: Professional test-taking interface with:
  - Real-time timer with color-coded warnings
  - Progress tracking and question navigation
  - Pause/resume functionality
  - Confirmation dialogs for test completion
  - Automatic result calculation and storage
- **Local History Tracking**: Test results stored locally with performance analytics
- **Responsive Design**: Mobile-optimized interface with animated backgrounds and smooth transitions

### Technical Implementation
- **Local Data Storage**: All time management data stored using localStorage with structured schemas
- **Data Types**: Comprehensive TypeScript interfaces for tasks, habits, projects, analytics
- **Component Architecture**: Modular design with reusable time management components
- **Real-time Analytics**: Dynamic calculation of productivity metrics and insights
- **Responsive Design**: Mobile-first approach with adaptive layouts

## Changelog

Previous Updates:
- June 20, 2025. Initial Arabic assessment platform setup with 7,000+ questions