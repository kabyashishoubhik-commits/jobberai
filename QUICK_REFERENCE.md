# 🚀 Jobber AI - Quick Reference Card

## 📍 URLs

| Page | URL |
|------|-----|
| **Home** | http://localhost:3000 |
| **Login** | http://localhost:3000/login |
| **Signup** | http://localhost:3000/signup |
| **Dashboard** | http://localhost:3000/dashboard |
| **Browser Automation** | http://localhost:3000/dashboard/automation |
| **Resume Upload** | http://localhost:3000/dashboard/resumes |
| **Settings** | http://localhost:3000/dashboard/settings |
| **Analytics** | http://localhost:3000/dashboard/analytics |
| **API Base** | http://localhost:5000 |

---

## 🔑 Test Credentials

```
Email: sachdevkabeer@gmail.com
Password: TestPass123!
```

---

## 📦 Key Commands

```bash
# Start Backend
npm run server

# Start Frontend
npm run dev

# View Database
sqlite3 db.sqlite

# Check All Tables
sqlite3 db.sqlite ".tables"

# Query Users
sqlite3 db.sqlite "SELECT * FROM users;"

# Query Applications
sqlite3 db.sqlite "SELECT * FROM external_applications;"

# Seed Sample Jobs
curl http://localhost:5000/api/seed-jobs -X POST

# Install Dependencies
npm install
npm install puppeteer
```

---

## 🗄️ Database Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts & passwords |
| `jobs` | Job listings |
| `applications` | Internal applications |
| `external_applications` | Naukri/LinkedIn/Wellfound apps |
| `user_credentials` | Saved job site credentials |
| `auto_apply_rules` | Search criteria |
| `settings` | User settings |
| `scrape_history` | Automation history |

---

## 🔌 API Endpoints

### Auth
```
POST /api/auth/signup
POST /api/auth/login
GET /api/auth/me (Protected)
```

### Jobs
```
GET /api/jobs/all
GET /api/jobs/recommended (Protected)
POST /api/seed-jobs
```

### Applications
```
POST /api/applications (Protected)
GET /api/applications (Protected)
```

### Automation
```
POST /api/automation/credentials (Protected)
GET /api/automation/credentials (Protected)
POST /api/automation/auto-apply (Protected)
GET /api/automation/stats (Protected)
```

### Resume
```
POST /api/resume/upload (Protected)
GET /api/resume (Protected)
```

---

## 🤖 How to Trigger Automation

### Manual (Browser)
1. Go to: http://localhost:3000/dashboard/automation
2. Login with your credentials
3. Enter Naukri email & password
4. Click "Save All Accounts"
5. Enter job title: "Developer"
6. Enter location: "Remote"
7. Click "Apply to Naukri"

### API (Command Line)
```bash
# Get token
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sachdevkabeer@gmail.com","password":"TestPass123!"}' | jq '.token')

# Trigger automation
curl -X POST http://localhost:5000/api/automation/auto-apply \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"keywords":"Developer","location":"Remote","source":"naukri"}'
```

---

## 📊 Check Results

### In Dashboard
- Visit: http://localhost:3000/dashboard
- See: Total applications, weekly stats, by platform

### In Database
```bash
sqlite3 db.sqlite "SELECT * FROM external_applications LIMIT 5;"
```

### In Browser Console
- Open: http://localhost:3000
- Press: F12 → Console
- Look for: Success/error messages

### In Server Logs
- Check terminal where `npm run server` is running
- Look for: ✅ success or ❌ error messages

---

## 🛠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| Login fails | Check database has user |
| Automation doesn't apply | Check server logs for CSS selector errors |
| Dashboard shows 0 apps | Trigger automation from /dashboard/automation |
| Database locked | Restart server: `npm run server` |
| Port already in use | `npm run dev` uses 3001 if 3000 taken |
| Puppeteer not found | Run: `npm install puppeteer` |

---

## 📁 Important Files

```
Backend:
├── server/server.js ........... Main API
├── server/db.js .............. Database setup
└── server/automation/ ........ Automation modules

Frontend:
├── app/dashboard/automation/page.tsx .... Automation UI
├── lib/api.ts ......................... API client
└── components/ ....................... UI components

Docs:
├── PROJECT_DOCUMENTATION.md ............ Full reference
├── AUTOMATION_ACTIVATION_GUIDE.md ..... How to use
├── IMPROVEMENTS_ROADMAP.md ........... What to build
└── README_SUMMARY.md ................ Overview
```

---

## ✅ Checklist for Success

- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Can login with sachdevkabeer@gmail.com
- [ ] Can save Naukri credentials
- [ ] Can trigger automation
- [ ] Applications tracked in database
- [ ] Dashboard shows statistics

---

## 🎯 What Each Page Does

| Page | Purpose |
|------|---------|
| Dashboard | See stats & recommended jobs |
| Browser Automation | Set up credentials & trigger apps |
| Resume Library | Upload & manage resumes |
| Settings | Control automation behavior |
| Analytics | View detailed statistics |
| Billing | Pricing & payment (future) |

---

## 💡 Pro Tips

1. **Test First** - Start with "Developer" + "Remote"
2. **Check Limits** - Max 5 apps per trigger
3. **Track Apps** - Use dashboard to see all applications
4. **Monitor Logs** - Watch server console for issues
5. **Backup Data** - Copy db.sqlite regularly
6. **Test on Small Scale** - Try 1 platform before 3
7. **Read Docs** - 3 guides available for deep learning

---

## 📞 Support

| Need | Read |
|------|------|
| System overview | PROJECT_DOCUMENTATION.md |
| How to use | AUTOMATION_ACTIVATION_GUIDE.md |
| What to build | IMPROVEMENTS_ROADMAP.md |
| Quick answers | README_SUMMARY.md |

---

## 🎓 Key Concepts

**Automation**: Browser that clicks buttons for you
**JWT Token**: Authentication token (lasts 24h)
**Headless Browser**: Chrome running without UI
**CSS Selector**: Way to find HTML elements
**External Application**: App made through automation
**Scrape**: Extract job data from websites

---

## ⚡ Quick Start

```
1. npm run server           # Terminal 1
2. npm run dev             # Terminal 2
3. Open http://localhost:3000/login
4. Login: sachdevkabeer@gmail.com / TestPass123!
5. Go to /dashboard/automation
6. Enter Naukri credentials
7. Click "Apply to Naukri"
8. Watch it work! ✨
```

---

## 🚀 Status

```
✅ Authentication .......... Working
✅ Resume Upload ........... Working
✅ Database ............... Working
✅ API Endpoints ........... Working (35+)
✅ Puppeteer .............. Installed
✅ Browser Automation ...... Ready
✅ Frontend UI ............ Complete
✅ Documentation .......... Comprehensive

🟡 LinkedIn Automation .... Partial
🟡 Wellfound Automation ... Partial
🟡 Email Outreach ........ UI only

⏳ Mobile App ............. Planned
⏳ Browser Extension ...... Planned
⏳ Advanced Analytics ..... Planned
```

---

## 📈 Next Steps

```
This Week:
├─ Test Naukri automation
├─ Verify apps are tracked
└─ Read documentation

Next Week:
├─ Test LinkedIn
├─ Test Wellfound
└─ Full end-to-end testing

This Month:
├─ Fix security issues (Priority 1)
├─ Complete features (Priority 2)
└─ Deploy to production
```

---

**Last Updated**: May 1, 2026
**Version**: 1.0.0
**Status**: ✅ Ready to Use

🎉 **You're all set! Start automating now!**
