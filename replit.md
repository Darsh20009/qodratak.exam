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

### Free Test System for Registered Users - January 8, 2025
- **Free Test Integration**: Added free test option (20 questions) for both verbal and quantitative sections
- **Daily Free Access**: Free registered users get one test per day in each category (verbal/quantitative)
- **Authentication Required**: Non-registered users cannot access any tests - must register/login first
- **Premium Differentiation**: 
  - Free users: One 20-question test daily per category
  - Premium users: Unlimited access to all advanced test suites
- **Enhanced Backend Support**: 
  - New API endpoint `/api/questions/free-test/:category` for mixed 20-question tests
  - Automatic question shuffling for variety
- **New Test Runners**: 
  - `FreeVerbalTestRunner`: 20-minute verbal test with mixed questions
  - `FreeQuantitativeTestRunner`: 20-minute quantitative test with mixed questions
- **Improved User Experience**:
  - Clear messaging for authentication requirements
  - Different error messages for free vs premium test access
  - Results saved to local storage with proper categorization
- **Routing Updates**: Added `/free-verbal-test` and `/free-quantitative-test` routes
- **Access Control**: Verbal and quantitative test pages now accessible to all registered users

### Enhanced Advanced Laboratory with Full Dark Mode & Quick Assessment - January 2, 2025
- **Complete Dark Mode Integration**: Enhanced Advanced Laboratory with full dark theme support for all UI components
- **Quick Level Assessment**: Integrated former Level Assessment features into Advanced Laboratory as "قياس المستوى السريع"
- **Streamlined Navigation**: Removed separate Level Assessment page and consolidated features into unified Advanced Laboratory
- **Enhanced User Experience**: 
  - Quick 15-question tests for each subcategory (15 minutes each)
  - Interactive assessment cards with subject-specific icons and colors
  - Improved dark mode contrast and visibility
  - Professional timer and progress tracking
- **Comprehensive Subject Coverage**:
  - Verbal: التناظر اللفظي، إكمال الجمل، الاستيعاب المقروء، المترادفات والأضداد، الأخطاء الشائعة
  - Quantitative: الهندسة، العمليات الحسابية، النسب والتناسب، الإحصاء
- **Revolutionary Assessment System**: Maintained all advanced testing modes with enhanced dark theme
- **Intelligent Progress Tracking**: Built sophisticated skill progression monitoring with XP system
- **Multi-Dimensional Analysis**: Implemented advanced performance metrics (accuracy, speed, consistency, confidence)
- **Adaptive Testing Modes**: Created 6 different testing modes (adaptive, timed, endurance, speed, precision, marathon)
- **Real-Time Analytics**: Developed live performance tracking with instant feedback and recommendations
- **Achievement System**: Built comprehensive gamification with unlockable achievements and skill progression
- **Smart Configuration**: Advanced test customization with difficulty levels, question counts, and accessibility options

### Enhanced Question Database Integration - January 2, 2025
- **Comprehensive Question Bank Update**: Successfully integrated updated question bank with 1,504 authentic questions
- **Increased Verbal Content**: Expanded from 605 to 854 verbal questions (40% increase)
- **Maintained Quantitative Content**: Preserved 650 quantitative questions 
- **JSON Processing**: Developed robust extraction system to handle complex Arabic question data
- **System Validation**: All questions successfully loaded and validated in platform
- **Performance Optimization**: Enhanced question loading and processing for larger datasets

### Migration to Standard Replit Environment - January 2, 2025
- **Complete Platform Migration**: Successfully migrated from Replit Agent to standard Replit environment
- **Security Enhancements**: Implemented robust client/server separation and secure authentication
- **System Stability**: Resolved all TypeScript errors and JSON parsing issues
- **Database Integration**: Maintained comprehensive question bank with 1,255+ authentic questions
- **Feature Preservation**: All existing functionality preserved including AI assistant, subscriptions, and time management
- **Development Ready**: Platform now fully operational for continued development and deployment

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

### Enhanced UI/UX with Usage Guide - January 8, 2025
- **Elegant Design Overhaul**: Removed "magic access code" system for cleaner, more professional interface
- **Comprehensive Usage Guide**: Created detailed `/usage-guide` page with platform features, tutorials, and pricing
- **Enhanced Descriptions**: Updated platform descriptions for more sophistication and elegance
- **Improved Navigation**: Added usage guide to main navigation for easy access
- **Consistent Branding**: Unified design language across all pages with professional Arabic interface
- **Feature Documentation**: Complete guide covering all platform capabilities and subscription tiers
- **Tutorial System**: Step-by-step instructions for new users to maximize platform benefits

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

### Revolutionary Question Bank System - July 7, 2025
- **Sequential Testing System**: Created comprehensive Question Bank with organized sequential 50-question tests
- **Progressive Unlocking**: Tests unlock only after completing previous ones, ensuring proper learning progression
- **Smart Scoring**: Only answered questions count toward scores, unanswered questions are treated as incorrect
- **Creative Download System**: HTML files with beautiful designs for downloading mistakes and unanswered questions
- **Visual Lock System**: Tests show lock icons and require completion of previous tests
- **Enhanced Analytics**: Detailed breakdown of mistakes vs unanswered questions
- **Dual Categories**: Separate verbal (18 tests, 854 questions) and quantitative (13 tests, 650 questions) banks
- **Beautiful UI**: Modern gradient designs with progress tracking and statistics
- **Local Storage**: Persistent test progress and results stored locally
- **Error Prevention**: Clear warnings about incomplete tests and unanswered questions

### Complete Questions Database Integration - January 2, 2025
- **Full Questions Dataset**: Successfully integrated 1,255 authentic questions from updated question bank
- **Comprehensive Question Coverage**: 
  - 605 verbal questions across 4 categories (التناظر اللفظي، إكمال الجمل، الخطأ السياقي، استيعاب المقروء)
  - 650 quantitative questions across 9 categories (الهندسة، عمليات حسابية، النسبة المئوية، المقارنات، الحركة والأنماط، النسبة والتناسب، الإحصاء، المعادلات، أفكار متنوعة)

### Latest Questions Database Update - January 2, 2025
- **Enhanced Question Bank**: Updated with comprehensive revised question set
- **JSON Format Fix**: Resolved parsing issues and successfully loaded new questions
- **Total Questions**: Now contains 1,255 authentic questions (605 verbal + 650 quantitative)
- **Quality Improvement**: All questions include detailed explanations and proper categorization
- **System Integration**: Seamlessly replaced previous question set with updated comprehensive bank

### Advanced Testing System Development - January 2, 2025
- **Enhanced Verbal Tests Platform**: Created comprehensive specialized verbal testing interface
  - Advanced test types: التناظر اللفظي المتقدم، خبير إكمال الجمل، نخبة الاستيعاب المقروء
  - AI-powered analysis with adaptive difficulty adjustment
  - Real-time performance tracking and analytics
  - Achievement system with gamification elements
  - Detailed weakness/strength area analysis
  
- **Enhanced Quantitative Tests Platform**: Developed advanced mathematical testing system
  - Specialized math tests: سيد الهندسة، خبير الجبر، محترف الإحصاء
  - Calculator integration and complex problem solving
  - Speed-focused arithmetic challenges
  - Mathematics-themed achievements and progress tracking
  - Performance analytics with speed and accuracy metrics
  
- **Advanced API System**: Implemented comprehensive backend for specialized testing
  - Advanced test results tracking (/api/test-results/advanced)
  - User achievements system (/api/achievements/:userId)
  - Performance analytics API (/api/analytics/:userId)
  - Automated achievement awarding based on performance
  - Session-based test tracking and analytics
  
- **Enhanced User Experience**: 
  - Real-time statistics panels with performance breakdowns
  - Interactive achievement progress tracking
  - Comprehensive test session management
  - Advanced test configuration with AI analysis options
  - Professional test runner with pause/resume functionality
  
- **Navigation Integration**: Added new navigation entries for enhanced test platforms
  - "اللفظي المتقدم" (/enhanced-verbal) - Advanced verbal testing suite
  - "الكمي المتقدم" (/enhanced-quantitative) - Advanced quantitative testing suite
  - Premium indicators with diamond and crown icons for test levels
- **Enhanced Test Configuration**: 
  - **Verbal Tests**: 65 questions in 65 minutes per test
  - **Quantitative Tests**: 55 questions in 55 minutes per test
- **Proper Question Classification**: Fixed all category assignments ensuring correct verbal/quantitative separation
- **Data Integrity**: All questions include proper Arabic text, multiple choice options, correct answers, and explanations
- **System Performance**: Optimized loading and processing of large question dataset with proper error handling

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
- **Premium-Only Access Control**: 
  - **Complete subscription requirement**: All verbal tests now restricted to premium subscribers only
  - Authentication required for all verbal tests
  - ProtectedRoute implementation with premium verification
  - Strong validation preventing unauthorized access from free users
- **Premium Qiyas Features**:
  - Enhanced progress tracking with gradient displays
  - Professional test status indicators with animations
  - Advanced daily usage analytics and warnings
  - Creative button designs with hover effects and animations
  - Qiyas-standard timing and difficulty indicators
- **Advanced Test Runner**: Professional test-taking interface with:
  - Real-time timer with color-coded warnings
  - Progress tracking and question navigation
  - Pause/resume functionality
  - Confirmation dialogs for test completion
  - Automatic result calculation and storage
- **Local History Tracking**: Test results stored locally with performance analytics
- **Responsive Design**: Mobile-optimized interface with animated backgrounds and smooth transitions
- **Updated API Integration**: Fixed user API to return subscription data from JSON file for proper premium verification

### Quantitative Tests System - June 29, 2025
- **Dedicated Quantitative Tests Section**: New "اختبارات الكمي" with specialized tests for quantitative subcategories
- **Individual Test Categories**: Separate 20-question tests with 10-minute time limits for each subcategory:
  - الإحصاء (Statistics)
  - عمليات حسابية (Arithmetic Operations)
  - الحركة والأنماط (Movement and Patterns)
  - النسبة والتناسب (Ratio and Proportion)
  - المعادلات (Equations)
  - الهندسة (Geometry)
  - النسبة المئوية (Percentages)
  - أفكار متنوعة (Mixed Ideas)
  - المقارنات (Comparisons)
- **Premium-Only Access Control**: 
  - **Complete subscription requirement**: All quantitative tests restricted to premium subscribers only
  - Same ProtectedRoute implementation as verbal tests
  - Daily limits system for free users (1 test per day across all quantitative categories)
- **Optimized Test Format**: 
  - **Shorter duration**: 20 questions in 10 minutes (vs 50 questions in 30+ minutes for verbal)
  - **Focused testing**: Each test targets specific mathematical skills
  - **Quick assessment**: Designed for rapid skill evaluation
- **Advanced Test Features**:
  - Real-time countdown timer with color-coded warnings
  - Question navigation panel with completion status
  - Pause/resume functionality
  - Confirmation dialogs for test completion
  - Automatic result calculation and local storage
- **Creative UI Design**: 
  - Mathematics-themed icons and color schemes
  - Animated backgrounds and smooth transitions
  - Responsive design optimized for mathematical content
  - Dark mode support with proper contrast for formulas
- **Navigation Integration**: Added to main navigation menu with Calculator-themed icon

### Enhanced Verbal Test Interface - June 29, 2025
- **Creative Design Alignment**: Updated VerbalTestRunner.tsx to match the innovative design of quantitative tests
- **Beautiful Start Screen**: Added animated BookOpen icon with rotating effect and professional layout
- **Enhanced Test Runner Interface**: 
  - Top information bar with timer and pause/resume controls
  - Side question map panel for easy navigation
  - Color-coded progress indicators and completion status
  - Smooth animations and transitions between questions
- **Improved User Experience**:
  - Visual feedback for selected answers with checkmark icons
  - Professional card-based layout matching quantitative tests
  - Responsive design optimized for Arabic text
  - Consistent branding and color scheme throughout
- **Advanced Controls**: 
  - Question navigation with previous/next buttons
  - Finish test confirmation modal with answer count display
  - Pause/resume functionality with clear visual indicators
  - Real-time progress tracking and completion percentages

### Revolutionary Mistake Challenge System - January 2, 2025
- **Complete Redesign**: Built a revolutionary mistake challenge system with gaming elements and advanced interactivity
- **Six Challenge Modes**: 
  - **Speed Demon (شيطان السرعة)**: Time-based challenges with double points for speed
  - **Survival Mode (وضع البقاء)**: 3 lives system where each mistake costs a life
  - **Zen Master (سيد الزن)**: Relaxed mode with no time pressure and detailed explanations
  - **Warrior Mode (وضع المحارب)**: Epic battle system with special powers and progressive difficulty
  - **Perfectionist (الكمالي)**: 100% accuracy required or restart, with 3x points multiplier
  - **Adventure Mode (وضع المغامرة)**: Interactive story with characters and varied levels
- **Gaming Features**:
  - **Health & Energy System**: Player stats with health, energy, streak, score, and experience points
  - **Power-Ups System**: Special abilities including hints, time freeze, answer reveal, and question skip
  - **Achievement System**: Unlockable badges for various milestones and performance levels
  - **Visual Effects**: Particle systems, gradient animations, and special effects for different modes
- **Advanced UI/UX**:
  - **Dark Gaming Theme**: Immersive dark gradient backgrounds with animated particles
  - **Interactive HUD**: Real-time stats display with animated counters and progress bars
  - **Smooth Transitions**: Framer Motion animations for seamless screen transitions
  - **Responsive Design**: Optimized for all devices with touch-friendly controls
- **Smart Features**:
  - **Adaptive Difficulty**: Questions adapt based on player performance and selected mode
  - **Hint System**: Contextual hints using question explanations with smart formatting
  - **Progress Tracking**: Detailed analytics and performance measurement across all modes
  - **Local Storage**: Advanced save system for challenge results and achievement progress

### Technical Implementation
- **Local Data Storage**: All time management data stored using localStorage with structured schemas
- **Data Types**: Comprehensive TypeScript interfaces for tasks, habits, projects, analytics
- **Component Architecture**: Modular design with reusable time management components
- **Real-time Analytics**: Dynamic calculation of productivity metrics and insights
- **Responsive Design**: Mobile-first approach with adaptive layouts

## Changelog

Previous Updates:
- June 20, 2025. Initial Arabic assessment platform setup with 7,000+ questions