# 🚀 JobeerAI — Autonomous AI Job Search Engine

**Get 3x More Interviews With Automated Job Matching, Auto-Apply, Recruiter Outreach & Analytics**

<p align="center">
  <b>The world's first fully agentic AI system that finds and applies to jobs for you, emails recruiters, and optimizes your CV using real-time analytics.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active_Development-blue?style=flat-square" alt="status">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="license">
  <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen?style=flat-square" alt="prs-welcome">
  <img src="https://img.shields.io/badge/Node-v18+-orange?style=flat-square" alt="node">
</p>

---

## 🚀 Overview

**JobeerAI** is a modern SaaS platform that automates every part of the job search:

- AI agents search and filter jobs daily  
- Automatically apply on your behalf where permitted  
- Find recruiter emails and send personalized outreach  
- Measure what’s working using analytics, A/B testing, and optimization insights  

**Goal:** Make job searching effortless while materially increasing interview conversions.

---

## 🌟 Key Features

### 🔍 Intelligent Job Matching
- Multi-source job aggregation (via partner APIs & permitted feeds)  
- AI semantic matching and relevance scoring  
- Skill & keyword extraction and ranking  
- Daily new job summaries and alerts

### 🤖 Autonomous Auto-Apply Engine
- Auto-apply to relevant jobs daily (where officially supported)  
- Custom rules: title, location, remote, salary ranges, companies  
- Multiple CV variants and A/B testing across applications  
- Detailed application activity logs & retry handling

### ✉️ Recruiter Outreach Automation
- Integrated recruiter email discovery (via paid API integrations)  
- AI-generated personalized outreach using templates & tokens  
- Throttled bulk outreach with deliverability best practices  
- Open, reply, bounce, and reply-quality analytics

### 📄 Resume Intelligence
- Structured resume parsing (skills, experience, education, dates)  
- ATS-compatibility scoring and keyword suggestions  
- Auto-tailor CVs to roles with optional manual review  
- Multi-CV A/B testing with conversion reporting

### 📊 Analytics Dashboard
- End-to-end funnel: Applications → Emails → Opens → Replies → Interviews  
- CV comparison cards showing conversion improvements  
- Email A/B testing results and template recommendations  
- Application heatmaps and trend charts

### 🤖 Bot Integrations
- Telegram / WhatsApp bot for uploads, alerts, and quick actions  
- Bot-driven recruiter message generation and confirmation flows

### 🔐 Security & Compliance
- Encrypted resume storage (at rest & in transit)  
- GDPR-aware consent & data processing flows  
- Verified email sending (DKIM / SPF / DMARC)  
- Audit logs & user data export / deletion

---

---

## 📖 Table of Contents

- [Overview](#overview)
- [🌟 Key Features](#-key-features)
- [🛠 Tech Stack](#-tech-stack)
- [📋 Prerequisites](#-prerequisites)
- [🚀 Quick Start](#-quick-start)
- [📁 Project Structure](#-project-structure)
- [🤖 Browser Automation](#-browser-automation)
- [💼 API Endpoints](#-api-endpoints)
- [📊 Database Schema](#-database-schema)
- [⚙️ Configuration](#️-configuration)
- [🐛 Troubleshooting](#-troubleshooting)
- [📈 Roadmap](#-roadmap)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)

---

## 🛠 Tech Stack

### Frontend
- **Framework:** Next.js 16 + React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI
- **Form Handling:** React Hook Form
- **State Management:** React Context API
- **Animations:** Framer Motion, GSAP

### Backend
- **Runtime:** Node.js
- **API:** Express.js (via Next.js API routes + custom server)
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcryptjs
- **Browser Automation:** Puppeteer
- **Web Scraping:** Cheerio

### Database
- **Primary:** SQLite (development)
- **ORM:** Raw SQL queries (extensible to Prisma/TypeORM)
- **Schema:** Users, Resumes, Jobs, Applications, Analytics

### Infrastructure
- **Port 3000:** Next.js frontend
- **Port 5000:** Node.js backend API
- **File Storage:** Local `/uploads` directory
- **Environment:** Windows/Linux/macOS compatible

---

## 📋 Prerequisites

Before getting started, ensure you have:

- **Node.js** v18 or higher ([Download](https://nodejs.org/))
- **pnpm** package manager (recommended) or npm
  ```bash
  npm install -g pnpm
  ```
- **Git** for version control
- A modern browser (Chrome, Firefox, Safari, Edge)

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/jobeerai.git
cd jobeerai
```

### 2. Install Dependencies
```bash
pnpm install
# or
npm install
```

### 3. Set Up Environment Variables
Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL=./db.sqlite

# JWT
JWT_SECRET=your_jwt_secret_key_here

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Third-party APIs
RECRUITER_API_KEY=your_api_key
```

### 4. Initialize Database
```bash
node server/db.js
```

### 5. Run the Application

**Option A: Run Frontend Only** (requires separate backend)
```bash
pnpm dev
# Frontend: http://localhost:3000
```

**Option B: Run Full Stack** (frontend + backend together)
```bash
pnpm run dev-full
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

**Option C: Run Separately**
```bash
# Terminal 1: Backend
pnpm run server

# Terminal 2: Frontend
pnpm run dev
```

### 6. Access the Application
- **App:** http://localhost:3000
- **Dashboard:** http://localhost:3000/dashboard
- **Automation:** http://localhost:3000/dashboard/automation
- **Backend API:** http://localhost:5000

### 7. Create Your First Account
1. Click "Sign Up"
2. Enter Name, Email, Password
3. Confirm Password
4. Click "Create Account"

---

## 📁 Project Structure

```
jobeerai/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Homepage
│   ├── api/                     # API routes
│   │   └── auth/               # Authentication endpoints
│   ├── dashboard/              # Dashboard pages
│   │   ├── page.tsx
│   │   ├── analytics/
│   │   ├── automation/         # Browser automation
│   │   ├── jobs/               # Job management
│   │   ├── resumes/            # Resume upload/management
│   │   ├── emails/             # Email outreach
│   │   ├── queue/              # Job application queue
│   │   ├── settings/           # User settings
│   │   └── billing/            # Billing management
│   ├── auth/                   # Auth pages
│   ├── login/                  # Login page
│   ├── signup/                 # Signup page
│   ├── pricing/                # Pricing page
│   └── ...
├── components/                  # React components
│   ├── ui/                     # UI components (Radix)
│   ├── dashboard-*.tsx         # Dashboard components
│   ├── magicui/               # Magic UI components
│   ├── MagicBento/            # Bento grid components
│   └── ...
├── server/                      # Backend server
│   ├── server.js              # Express server
│   ├── db.js                  # Database initialization
│   └── automation/            # Browser automation scripts
│       ├── naukriAutomation.js
│       ├── linkedinAutomation.js
│       └── wellfoundAutomation.js
├── lib/                         # Utility functions
│   ├── api.ts                 # API client
│   └── utils.ts               # Helper utilities
├── hooks/                       # Custom React hooks
│   ├── use-mobile.ts
│   └── use-toast.ts
├── types/                       # TypeScript type definitions
├── styles/                      # Global styles
├── public/                      # Static assets
├── uploads/                     # User uploaded files (resumes)
├── next.config.mjs            # Next.js configuration
├── tsconfig.json              # TypeScript configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── postcss.config.mjs         # PostCSS configuration
└── package.json               # Project dependencies
```

---

## 🤖 Browser Automation

JobeerAI uses **Puppeteer** to automate job applications across multiple platforms.

### Supported Platforms

#### 1. **Naukri.com** (India's largest job portal)
- Scrape job listings by keyword + location
- Auto-login with credentials
- Intelligent form filling
- One-click apply automation
- Session persistence

**File:** `server/automation/naukriAutomation.js`

#### 2. **LinkedIn** (Global professional network)
- Browse job listings
- Apply to jobs with one click
- Profile information extraction
- Connection management
- Rate-limited applications

**File:** `server/automation/linkedinAutomation.js`

#### 3. **Wellfound** (Startup jobs - formerly AngelList Talent)
- Startup job discovery
- Application tracking
- Profile matching
- Connection with founders

**File:** `server/automation/wellfoundAutomation.js`

### Browser Automation Features

- ✅ Headless browser (invisible to job sites)
- ✅ Auto-login with your credentials
- ✅ Job search by keyword + location
- ✅ Intelligent form filling
- ✅ One-click apply automation
- ✅ Rate limiting (5 apps per trigger per platform)
- ✅ Error handling & retry logic
- ✅ Session persistence
- ✅ Screenshot capture for debugging
- ✅ Detailed logging and monitoring

### Configuring Auto-Apply

1. Go to Dashboard → **Browser Automation**
2. Connect your accounts:
   - Enter email and password for each platform
   - Click "Save All Accounts"
3. Set auto-apply rules:
   - **Job Title:** Keywords to search for
   - **Location:** City or "Remote"
   - **Salary Range:** Minimum salary expectation
   - **Remote Only:** Filter remote jobs only
   - **Daily Limit:** 1-50 applications per day

4. Enable automation and let it run 24/7

---

## 💼 API Endpoints

### Authentication
```
POST   /api/auth/signup      - Create new account
POST   /api/auth/login       - Login with email/password
POST   /api/auth/logout      - Logout and clear session
GET    /api/auth/me          - Get current user info
POST   /api/auth/refresh     - Refresh JWT token
```

### Resumes
```
GET    /api/resumes          - Get all user resumes
POST   /api/resumes/upload   - Upload new resume
GET    /api/resumes/:id      - Get specific resume
DELETE /api/resumes/:id      - Delete resume
PUT    /api/resumes/:id      - Update resume metadata
```

### Jobs
```
GET    /api/jobs             - Get recommended jobs
POST   /api/jobs/search      - Search jobs by criteria
GET    /api/jobs/:id         - Get job details
POST   /api/jobs/bookmark    - Bookmark a job
```

### Applications
```
GET    /api/applications     - Get all applications
POST   /api/applications     - Create new application
GET    /api/applications/:id - Get application details
PUT    /api/applications/:id - Update application status
DELETE /api/applications/:id - Delete application
```

### Automation
```
POST   /api/automation/start      - Start browser automation
POST   /api/automation/stop       - Stop automation
GET    /api/automation/status     - Get automation status
POST   /api/automation/configure  - Configure auto-apply rules
GET    /api/automation/logs       - Get automation logs
```

### Analytics
```
GET    /api/analytics/dashboard   - Get dashboard statistics
GET    /api/analytics/applications - Get application analytics
GET    /api/analytics/trends      - Get trends data
GET    /api/analytics/funnel      - Get conversion funnel
```

### Settings
```
GET    /api/settings           - Get user settings
PUT    /api/settings           - Update user settings
POST   /api/settings/password  - Change password
```

---

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  avatar TEXT,
  bio TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Resumes Table
```sql
CREATE TABLE resumes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  filepath TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Jobs Table
```sql
CREATE TABLE jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  job_url TEXT UNIQUE,
  description TEXT,
  requirements TEXT,
  source TEXT,
  posted_date DATETIME,
  fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Applications Table
```sql
CREATE TABLE applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  job_id INTEGER NOT NULL,
  resume_id INTEGER,
  status TEXT DEFAULT 'pending',
  applied_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  response_date DATETIME,
  interview_date DATETIME,
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (job_id) REFERENCES jobs(id),
  FOREIGN KEY (resume_id) REFERENCES resumes(id)
);
```

### Auto-Apply Rules Table
```sql
CREATE TABLE auto_apply_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  job_title_keywords TEXT,
  location TEXT,
  remote_only BOOLEAN DEFAULT 0,
  salary_min INTEGER,
  salary_max INTEGER,
  daily_limit INTEGER DEFAULT 5,
  enabled BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file:

```env
# Database
DATABASE_URL=./db.sqlite

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRY=24h

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Browser Automation
PUPPETEER_HEADLESS=true
PUPPETEER_TIMEOUT=30000

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Email Service (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Third-party APIs (Optional)
RECRUITER_API_KEY=your_recruiter_api_key
JOB_API_KEY=your_job_api_key
```

### Puppeteer Configuration

Edit `server/automation/naukriAutomation.js` to customize:

```javascript
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });
```

---

## 🐛 Troubleshooting

### Issue: Port 3000 Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :3000   # Windows
taskkill /PID <PID> /F         # Windows
```

### Issue: Puppeteer Installation Fails
```bash
# Reinstall Puppeteer
pnpm remove puppeteer
pnpm add puppeteer --save

# Set binary path if needed
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
```

### Issue: Database Lock Error
```bash
# Clear database locks
rm -f db.sqlite-journal
node server/db.js  # Reinitialize
```

### Issue: Authentication Token Expired
- Log out and log back in
- Tokens automatically refresh in the background
- Check browser console for JWT errors

### Issue: Resume Upload Not Working
1. Check `/uploads` directory exists and is writable
2. Verify file size < 10MB
3. Ensure file is PDF or DOCX format
4. Check server logs for upload errors

### Getting Help
- Check [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)
- Review [QUICK_START.md](QUICK_START.md)
- Check logs in browser console and server terminal

---

## 📈 Roadmap

### Phase 1: Current (V1.0)
- ✅ Authentication & User Management
- ✅ Resume Upload & Management
- ✅ Job Discovery & Matching
- ✅ Browser Automation (Naukri, LinkedIn, Wellfound)
- ✅ Application Tracking
- ✅ Basic Analytics Dashboard

### Phase 2: In Development (V1.1)
- 🔄 Advanced Analytics & Reporting
- 🔄 Email Outreach Automation
- 🔄 Cover Letter Generator (AI)
- 🔄 Interview Prep Module
- 🔄 Salary Negotiation Assistant

### Phase 3: Planned (V1.2+)
- 📋 Mobile App (React Native)
- 📋 Slack Integration
- 📋 Browser Extensions (Chrome, Firefox)
- 📋 GitHub Profile Sync
- 📋 Portfolio Website Builder
- 📋 Multi-language Support
- 📋 Custom Domain Support

---

## 🤝 Contributing

We welcome contributions! Here's how to help:

### Development Setup
```bash
# Clone and install
git clone https://github.com/yourusername/jobeerai.git
cd jobeerai
pnpm install

# Create feature branch
git checkout -b feature/your-feature-name

# Make your changes
# Commit with clear messages
git commit -m "feat: Add new feature"

# Push to your fork
git push origin feature/your-feature-name

# Create Pull Request on GitHub
```

### Coding Standards
- Use TypeScript for all new code
- Follow ESLint configuration
- Write tests for new features
- Update documentation
- Follow existing code style

### Areas We Need Help
- [ ] Performance optimization
- [ ] UI/UX improvements
- [ ] Additional job platform integrations
- [ ] Mobile responsiveness
- [ ] Bug fixes and stability
- [ ] Documentation improvements

---

## 📜 License

This project is licensed under the **MIT License** - see [LICENSE.md](LICENSE.md) for details.

### MIT License Summary
- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Private use
- ⚠️ Liability not limited
- ⚠️ Warranty not provided

---

## 📞 Support

- **Email:** support@jobeerai.com
- **Discord:** [Join our community](https://discord.gg/jobeerai)
- **GitHub Issues:** [Report bugs](https://github.com/yourusername/jobeerai/issues)
- **Docs:** [Full Documentation](DOCUMENTATION_INDEX.md)

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/) and [React](https://react.dev/)
- UI components from [Radix UI](https://radix-ui.com/)
- Browser automation with [Puppeteer](https://pptr.dev/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)
- Icons from [Radix Icons](https://radix-ui.com/icons)

---

<p align="center">
  <strong>Made with ❤️ by the JobeerAI Team</strong>
  <br/>
  <em>Automating Your Path to Career Success</em>
</p>

<p align="center">
  <a href="https://github.com/yourusername/jobeerai">⭐ Star us on GitHub</a> • 
  <a href="https://jobeerai.com">🌐 Visit Website</a> • 
  <a href="DOCUMENTATION_INDEX.md">📚 Documentation</a>
</p>
