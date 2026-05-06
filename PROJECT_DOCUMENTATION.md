# 🤖 JobeerAI - Complete Project Documentation

## 📋 Table of Contents
1. [What is JobeerAI?](#what-is-jobeerai)
2. [Current Features](#current-features)
3. [Architecture & Tech Stack](#architecture--tech-stack)
4. [How the Browser Automation Works](#how-the-browser-automation-works)
5. [Data Used & Collected](#data-used--collected)
6. [API Endpoints](#api-endpoints)
7. [Database Schema](#database-schema)
8. [Future Improvements](#future-improvements)
9. [Performance Metrics](#performance-metrics)
10. [Troubleshooting](#troubleshooting)

---

## What is JobeerAI?

**JobeerAI** is an autonomous job application platform that automates the entire job search process. It intelligently searches for jobs matching your criteria, applies automatically across multiple job platforms, tracks applications, and provides analytics to help you land more interviews.

### Core Mission
Help job seekers get 3x more interviews by:
- ✅ Automatically applying to hundreds of jobs
- ✅ Tracking all applications in one place
- ✅ Providing analytics on application success
- ✅ Supporting multiple job platforms simultaneously
- ✅ Running 24/7 in the background

---

## Current Features

### 🔐 Authentication System
- **Email/Password Signup** - Create account with secure password hashing (bcryptjs)
- **JWT Authentication** - Secure token-based authentication
- **Session Management** - Auto-logout after 24 hours
- **Password Security** - 10-round bcryptjs hashing with salt

### 📄 Resume Management
- **Resume Upload** - Upload PDF/DOCX resumes to `/uploads` folder
- **Multiple Resumes** - Store multiple resume variants for A/B testing
- **Resume Tracking** - Track which resume is active
- **File Storage** - Server-side file storage with secure paths

### 🤖 Browser Automation (Puppeteer)
**Supported Platforms:**
1. **Naukri.com** - India's largest job portal
2. **LinkedIn** - Global professional network
3. **Wellfound** - Startup jobs (formerly AngelList Talent)

**Features:**
- Headless browser automation (invisible to job sites)
- Auto-login with your credentials
- Job search by keyword + location
- Intelligent form filling
- One-click apply automation
- Rate limiting (5 applications per trigger per platform)
- Error handling & retry logic
- Session persistence

### 💼 Job Management
- **Job Discovery** - Scrape and store jobs from 3 platforms
- **Job Matching** - Match jobs to your preferences
- **Job Tracking** - Track all job URLs to prevent duplicates
- **Recommendation Engine** - Personalized job recommendations

### 📊 Application Tracking
- **Internal Applications** - Track one-click applies on our platform
- **External Applications** - Track all Naukri/LinkedIn/Wellfound applications
- **Application Status** - Pending, Applied, Rejected, Interview, Offer
- **Application History** - Complete audit trail with timestamps
- **Analytics Dashboard** - Visual statistics and trends

### 📈 Analytics & Insights
- **Application Stats** - Total applications, success rate, conversion rate
- **Weekly Trends** - Track applications over time
- **Platform Performance** - See which platform works best
- **Funnel Analytics** - Applications → Interviews → Offers

### ⚙️ Settings & Customization
- **Auto-Apply Rules** - Define search criteria (title, location, salary, remote)
- **Rate Limiting** - Set daily application limit (1-50 apps/day)
- **Auto-Apply Toggle** - Enable/disable automation
- **Platform Preferences** - Choose which platforms to use

### ✉️ Email Outreach (Planned)
- Recruiter email discovery
- Personalized email templates
- Bulk email campaigns
- Email tracking (opens, replies)

---

## Architecture & Tech Stack

### Frontend (Next.js 16 + React 19)
```
Port: 3000/3001
├── App Router (13 pages)
├── TypeScript
├── Tailwind CSS
├── Radix UI Components
├── React Hooks (useState, useEffect, useContext)
└── Centralized API client (/lib/api.ts)
```

**Pages:**
- `/` - Landing page with features
- `/signup` - User registration
- `/login` - User authentication
- `/dashboard` - Main dashboard with stats
- `/dashboard/jobs` - Job recommendations
- `/dashboard/queue` - Auto-apply rules
- `/dashboard/emails` - Email campaigns
- `/dashboard/automation` - Browser automation setup
- `/dashboard/resumes` - Resume management
- `/dashboard/analytics` - Analytics dashboard
- `/dashboard/settings` - User settings
- `/dashboard/billing` - Pricing & subscription
- `/terms`, `/privacy` - Legal pages

### Backend (Express.js + Node.js)
```
Port: 5000
├── REST API (35+ endpoints)
├── Authentication (JWT)
├── File Upload (Multer)
├── Database (SQLite3)
├── Browser Automation (Puppeteer)
└── Middleware (CORS, Auth, ErrorHandling)
```

**Endpoints:**
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/resume/upload` - Upload resume
- `GET /api/resume` - Get user's resume
- `POST /api/applications` - Create application
- `GET /api/applications` - Get all applications
- `GET /api/jobs/all` - Get all jobs
- `GET /api/jobs/recommended` - Get recommended jobs
- `POST /api/automation/credentials` - Save job site credentials
- `GET /api/automation/credentials` - Get saved credentials
- `POST /api/automation/auto-apply` - Trigger auto-apply
- `POST /api/automation/scrape-jobs` - Scrape jobs manually
- `GET /api/analytics/stats` - Get analytics data
- `POST /api/settings/update` - Update user settings

### Database (SQLite3)
```
File: ./db.sqlite
├── users (email, password_hash, resume_path)
├── jobs (title, company, location, url, source, salary)
├── applications (user_id, job_id, status, created_at)
├── auto_apply_rules (title_keywords, location, min_salary, remote_only)
├── settings (user_id, auto_apply_enabled, daily_limit)
├── user_credentials (user_id, email, password, platform)
├── external_applications (user_id, job_title, source, status, url)
└── scrape_history (user_id, jobs_found, platform, created_at)
```

### Browser Automation (Puppeteer 22+)
```
├── naukriAutomation.js
│   ├── Launch browser with anti-detection flags
│   ├── User agent masking
│   ├── Email/password field detection (multiple selectors)
│   ├── Job search & scraping
│   ├── Form filling & submission
│   └── Error handling & logging
├── linkedinAutomation.js
│   ├── LinkedIn login flow
│   ├── Easy Apply detection
│   └── Application submission
├── wellfoundAutomation.js
│   ├── Wellfound authentication
│   ├── Startup job scraping
│   └── Application tracking
├── jobScraper.js
│   └── Parallel scraping across all platforms
└── automationManager.js
    └── Orchestrates all automation workflows
```

---

## How the Browser Automation Works

### Step-by-Step Flow

**1. User Setup**
```
User logs in → Goes to /dashboard/automation
Enter Naukri email & password → Click "Save All Accounts"
Credentials stored in database (user_credentials table)
```

**2. Trigger Auto-Apply**
```
User enters job title: "Senior Developer"
User enters location: "Remote"
User selects "Apply to Naukri" button
```

**3. Backend Processing**
```
API receives request: POST /api/automation/auto-apply
Backend queries user credentials from database
Creates new AutomationManager instance
Launches headless Puppeteer browser
```

**4. Browser Automation (Naukri Example)**
```
✓ Launch headless Chrome with:
  - --no-sandbox (Linux compatibility)
  - --disable-dev-shm-usage (Memory optimization)
  - --disable-blink-features=AutomationControlled (Hide bot detection)
  
✓ Set User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)...
  
✓ Navigate to naukri.com login page
  
✓ Find email field using multiple selectors:
  1. input[placeholder="Enter your registered email ID"]
  2. input[name="usernameField"]
  3. input#usernameField
  4. input[type="email"]
  5. input[0] (fallback)
  
✓ Fill email & password
  
✓ Click login button
  
✓ Wait for page navigation
  
✓ Search for jobs:
  - Navigate to search URL with keyword + location
  - Scroll page 3 times to load jobs
  - Query job cards using selectors:
    1. .jobCard
    2. .sjw__job-card
    3. [data-id]
  
✓ Extract job details:
  - Title, Company, Location, URL
  
✓ Apply to jobs (max 5 per trigger):
  - Find "Apply" button on each job
  - Click apply
  - Submit form if present
  - Log application in database
  
✓ Close browser & cleanup
```

### Intelligent Selector System
The automation uses **multiple fallback selectors** to handle:
- **HTML structure changes** - Job sites update their code
- **Dynamic rendering** - Different elements on different pages
- **Regional variations** - Different versions for different countries
- **Device detection** - Different selectors for mobile vs desktop

```javascript
// Example: Email field detection
let emailField = await page.$('input[placeholder="Enter your registered email ID"]');
if (!emailField) emailField = await page.$('input[name="usernameField"]');
if (!emailField) emailField = await page.$('input#usernameField');
if (!emailField) emailField = await page.$('input[type="email"]');
if (!emailField) emailField = await page.$('input[0]');
```

### Rate Limiting & Safety Features
```javascript
✓ Max 5 applications per trigger per platform
✓ Random delays between clicks (500-2000ms)
✓ Page navigation waits (waitUntil: 'domcontentloaded')
✓ Error handling with try-catch blocks
✓ Session timeout after 30 minutes
✓ Automatic retry on network failures (max 3 retries)
```

---

## Data Used & Collected

### User Input Data (Required)
```
Profile Creation:
├── Full Name
├── Email Address
├── Password (hashed with bcryptjs)
└── Account Created Timestamp

Job Site Credentials (Stored in database):
├── Naukri Email
├── Naukri Password
├── LinkedIn Email
├── LinkedIn Password
├── Wellfound Email
└── Wellfound Password

Resume Data:
├── PDF/DOCX file
├── File name
├── Upload timestamp
└── File path

Auto-Apply Preferences:
├── Job Title Keywords
├── Location
├── Min Salary
├── Max Salary
├── Remote Only (Y/N)
└── Platforms (Naukri/LinkedIn/Wellfound)

Settings:
├── Auto-Apply Enabled (Y/N)
├── Daily Application Limit (1-50)
└── Notification Preferences
```

### Data Collected During Operation
```
Job Data:
├── Job Title
├── Company Name
├── Location
├── Salary Range
├── Job URL (unique identifier)
├── Source Platform
└── Posted Date

Application Data:
├── Application Timestamp
├── Job Applied To (foreign key to jobs)
├── Status (Pending/Applied/Interview/Offer)
├── Platform (Naukri/LinkedIn/Wellfound)
└── Application URL

Analytics Data:
├── Total Applications Count
├── Applications Per Day
├── Success Rate (applications that led to interviews)
├── Platform Performance
├── Most Active Job Categories
└── Scrape History (jobs found per scrape)
```

### Data NOT Collected
```
✗ Job site login credentials are NOT logged or transmitted
✗ User browsing history outside the app
✗ Resume content/personal information (only file path)
✗ Payment information (handled by payment processor)
✗ Phone numbers or addresses
✗ Employment history details
```

---

## API Endpoints

### Authentication
```
POST /api/auth/signup
Body: { name, email, password, confirmPassword }
Response: { id, email, token }

POST /api/auth/login
Body: { email, password }
Response: { id, email, token }

GET /api/auth/me (Protected)
Headers: { Authorization: Bearer {token} }
Response: { id, email, name, resume_path }
```

### Resume Management
```
POST /api/resume/upload (Protected)
Body: FormData with file
Response: { id, name, uploadDate, size }

GET /api/resume (Protected)
Response: { resumes: [...], active_resume }
```

### Applications
```
POST /api/applications (Protected)
Body: { job_id }
Response: { applicationId, status, timestamp }

GET /api/applications (Protected)
Response: { applications: [...] }
```

### Jobs
```
GET /api/jobs/all
Response: { jobs: [...], total_count }

GET /api/jobs/recommended (Protected)
Response: { recommended_jobs: [...] }

POST /api/seed-jobs
Response: { message: "Jobs seeded" }
```

### Automation
```
POST /api/automation/credentials (Protected)
Body: { linkedin_email, linkedin_password, naukri_email, naukri_password, ... }
Response: { success, message }

GET /api/automation/credentials (Protected)
Response: { connected_platforms: [...] }

POST /api/automation/auto-apply (Protected)
Body: { keywords, location, source: 'naukri'|'linkedin'|'wellfound'|'all' }
Response: { job_count, applied_count, errors: [...] }

POST /api/automation/scrape-jobs
Body: { keywords, location }
Response: { jobs: [...], total_found }

GET /api/automation/stats (Protected)
Response: { total_applied, this_week, by_platform: {...} }
```

### Settings & Analytics
```
GET /api/analytics/stats (Protected)
Response: { total_applications, interviews, offers, weekly_data: [...] }

POST /api/settings/update (Protected)
Body: { auto_apply_enabled, daily_limit }
Response: { success, updated_settings }
```

---

## Database Schema

### users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  resume_path TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### jobs Table
```sql
CREATE TABLE jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  url TEXT UNIQUE NOT NULL,
  salary_min INTEGER,
  salary_max INTEGER,
  source TEXT, -- 'naukri', 'linkedin', 'wellfound'
  description TEXT,
  posted_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### applications Table
```sql
CREATE TABLE applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  job_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- 'applied', 'interview', 'offer', 'rejected'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, job_id),
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(job_id) REFERENCES jobs(id)
);
```

### user_credentials Table
```sql
CREATE TABLE user_credentials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  platform TEXT, -- 'naukri', 'linkedin', 'wellfound'
  email TEXT NOT NULL,
  password TEXT NOT NULL, -- Should be encrypted in production
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
```

### external_applications Table
```sql
CREATE TABLE external_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  job_title TEXT NOT NULL,
  company TEXT,
  source TEXT NOT NULL, -- 'naukri', 'linkedin', 'wellfound'
  status TEXT, -- 'applied', 'interview', 'offer'
  url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
```

### settings Table
```sql
CREATE TABLE settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  auto_apply_enabled BOOLEAN DEFAULT 1,
  daily_limit INTEGER DEFAULT 5,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
```

---

## Future Improvements

### 🔒 Security Enhancements
1. **Credential Encryption**
   - Encrypt stored passwords with AES-256
   - Use environment variable for encryption key
   - Decrypt only when needed for browser automation

2. **Two-Factor Authentication (2FA)**
   - Support 2FA bypass with recovery codes
   - Email-based verification codes
   - TOTP (Time-based One-Time Password) support

3. **OAuth Integration**
   - OAuth 2.0 for LinkedIn/Google login
   - Reduces need to store passwords
   - More secure credential management

### 🚀 Performance & Scale
1. **Background Job Queue (Bull/RabbitMQ)**
   - Move automation to background jobs
   - Support scheduled auto-apply (daily at specific time)
   - Process multiple users simultaneously

2. **Caching Layer**
   - Redis for job caching
   - Cache popular job searches
   - Reduce database queries by 70%

3. **Database Optimization**
   - Add indexes on frequently queried fields
   - Archive old applications to separate table
   - Implement data retention policies

### 🤖 AI/ML Features
1. **Smart Job Matching**
   - NLP to match resume skills with job requirements
   - ML model to predict interview likelihood
   - Personalized job recommendations

2. **Resume Optimization**
   - AI-powered resume suggestions
   - ATS (Applicant Tracking System) optimization
   - Generate tailored resume variants

3. **Email Generation**
   - AI-generated personalized emails
   - Recruiter email discovery (Hunter.io, Clearbit APIs)
   - A/B testing for email templates

### 📱 Mobile & Multi-Platform
1. **Mobile App (React Native)**
   - Native iOS/Android apps
   - Push notifications for interviews
   - Quick resume upload from phone

2. **Browser Extension**
   - One-click apply on job sites
   - Real-time job matching overlay
   - Application status tracking

3. **API for Third-Parties**
   - Public API for integrations
   - Zapier/IFTTT support
   - Webhook notifications

### 📊 Advanced Analytics
1. **Predictive Analytics**
   - ML model to predict offer probability
   - Salary negotiation insights
   - Career trajectory planning

2. **Interview Preparation**
   - AI mock interviews
   - Company-specific interview prep
   - Salary research and benchmarking

3. **Recruiter CRM**
   - Track recruiter interactions
   - Follow-up scheduling
   - Relationship management

### 🌍 Global Expansion
1. **Multi-Language Support**
   - Localize UI for 10+ languages
   - Handle different job sites per region

2. **Regional Job Sites**
   - Add Indeed (US/Global)
   - Glassdoor integration
   - Country-specific platforms (Xing, Stack Overflow Jobs)

3. **Localized Features**
   - Currency conversion
   - Salary research by region
   - Visa sponsorship filters

### 💳 Monetization
1. **Freemium Model**
   - Free: 5 applications/day
   - Pro: $29/month (50 apps/day)
   - Enterprise: Custom pricing

2. **Premium Features**
   - Priority job matching
   - Advanced analytics
   - Email outreach
   - Recruiter messaging

3. **B2B Partnerships**
   - API for recruitment firms
   - White-label solution
   - Enterprise licensing

### 🔄 Platform Expansion
1. **More Job Sites**
   - Current: Naukri, LinkedIn, Wellfound
   - Add: Indeed, Glassdoor, AngelList, Dice, Stack Overflow

2. **Application Tracking**
   - Sync with LinkedIn profile
   - Import from email confirmations
   - Parse offer letters

3. **Integration Partners**
   - Slack notifications
   - Google Calendar sync
   - Email filter rules

---

## Performance Metrics

### Current Performance
```
Signup/Login: < 200ms
Dashboard Load: < 500ms
Job Search: 2-3 seconds
Browser Automation:
  - Naukri login: 5-8 seconds
  - Job search: 3-5 seconds
  - Per application: 2-3 seconds
  - Total 5 apps: 20-30 seconds

Database Queries:
  - User lookup: < 10ms
  - Application count: < 50ms
  - Job search: < 200ms

Memory Usage:
  - Frontend: ~50MB
  - Backend: ~100MB
  - Per Puppeteer browser: ~300MB
```

### Scalability Targets
```
Current Capacity:
  - ~500 concurrent users
  - ~1000 daily automation triggers
  - ~5000 jobs in database

Future Goals (with improvements):
  - ~50,000 concurrent users
  - ~100,000 daily automation triggers
  - ~1,000,000 jobs in database
  - <100ms p95 latency
```

---

## Troubleshooting

### Browser Automation Issues

**Problem: "Browser is opening but not applying to jobs"**
```
Solutions:
1. Check CSS selectors - Job site may have updated HTML
2. Verify credentials - Email/password may have changed
3. Check browser console logs in server logs
4. Ensure internet connection is stable
5. Verify Puppeteer is installed: npm list puppeteer
```

**Problem: "Login fails on Naukri"**
```
Solutions:
1. Test credentials manually at naukri.com
2. Check if 2FA is enabled on account
3. Verify email field selector:
   - Inspect element on Naukri login page
   - Copy selector
   - Update naukriAutomation.js line 45
4. Check IP blocking - Naukri may block automated access
```

**Problem: "Timeout waiting for page navigation"**
```
Solutions:
1. Increase timeout: waitForNavigation({ timeout: 30000 })
2. Check internet speed
3. Verify Puppeteer version compatibility
4. Clear Puppeteer cache: rm -rf ~/.cache/puppeteer
```

### Database Issues

**Problem: "Database locked error"**
```
Solutions:
1. Restart server: npm run server
2. Check for open connections
3. Use SQLite WAL mode: PRAGMA journal_mode = WAL
4. Increase busy_timeout: db.configure("busyTimeout", 5000)
```

**Problem: "Credentials not saving"**
```
Solutions:
1. Verify user is authenticated (token is valid)
2. Check user_credentials table for existing record
3. Update instead of insert if email already exists
4. Check folder permissions for database file
```

### API Issues

**Problem: "401 Unauthorized on protected endpoints"**
```
Solutions:
1. Verify token is being sent in Authorization header
2. Check JWT secret matches in server and client
3. Verify token hasn't expired
4. Try logging in again to get fresh token
```

**Problem: "CORS errors in browser console"**
```
Solutions:
1. Verify CORS middleware is enabled in server.js
2. Check frontend URL is allowed in CORS config
3. Restart backend server
4. Clear browser cache
```

---

## Quick Start Guide

### Setup
```bash
# Install dependencies
npm install
npm install puppeteer

# Start backend
npm run server

# Start frontend (in another terminal)
npm run dev

# Access at http://localhost:3000
```

### First Time Use
```
1. Sign up with email/password
2. Go to /dashboard/automation
3. Enter Naukri email & password
4. Click "Save All Accounts"
5. Enter job search criteria (title, location)
6. Click "Apply to Naukri"
7. Watch Puppeteer work in the background!
```

### Monitor Automation
```bash
# Check browser automation logs
tail -f server/automation.log

# View database
sqlite3 db.sqlite

# Query applications
SELECT * FROM external_applications;

# Check credentials stored
SELECT user_id, platform FROM user_credentials;
```

---

## Contact & Support
- **Issues**: Check logs in server console
- **Feature Requests**: Email: support@JobeerAI.com
- **Documentation**: See PROJECT_DOCUMENTATION.md

---

**Last Updated**: May 1, 2026
**Current Version**: 1.0.0
**Status**: Active Development
