# 🤖 Browser Automation Setup Guide

## Overview
Jobber AI now includes **browser automation** to automatically apply to jobs on LinkedIn, Wellfound, and Naukri!

## How It Works

### 1. **Browser Automation Flow**
```
User enters credentials → Puppeteer launches headless browser → Logs into job site → 
Searches for jobs → Fills application forms → Submits applications → Logs results
```

### 2. **Supported Job Platforms**
- ✅ **LinkedIn** - Easy Apply & regular applications
- ✅ **Wellfound** - Startup jobs (formerly AngelList Talent)
- ✅ **Naukri** - Indian job market leader

### 3. **Key Features**
- **Headless Browser**: No visible window, runs in background
- **Auto Form Filling**: Automatically fills job application forms
- **Rate Limiting**: Prevents account flagging by job sites
- **Application Tracking**: All applications logged in database
- **Error Handling**: Graceful failures with detailed logging

---

## Setup Instructions

### Step 1: Access Browser Automation
1. Login to your Jobber AI account
2. Go to **Dashboard → Browser Automation**
3. Or navigate to: `http://localhost:3000/dashboard/automation`

### Step 2: Connect Your Accounts
1. **For LinkedIn**:
   - Enter your LinkedIn email
   - Enter your LinkedIn password
   - Click "Save"

2. **For Wellfound**:
   - Enter your Wellfound email
   - Enter your Wellfound password
   - Click "Save"

3. **For Naukri**:
   - Enter your Naukri email
   - Enter your Naukri password
   - Click "Save"

### Step 3: Configure Auto-Apply
1. Enter the **Job Title** (e.g., "Senior Developer")
2. Enter the **Location** (e.g., "San Francisco" or "Remote")
3. Click the platform button to auto-apply:
   - "Apply to LinkedIn"
   - "Apply to Wellfound"
   - "Apply to Naukri"

---

## How Auto-Apply Works

### Job Scraping
```javascript
// Scrapes job listings from the platform
GET /api/automation/scrape
Request: { keyword: "Developer", location: "Remote" }
Response: { linkedIn: [...], wellfound: [...], naukri: [...] }
```

### Application Submission
```javascript
// Triggers automatic job applications
POST /api/automation/auto-apply
Request: { keyword: "Developer", location: "Remote", source: "linkedin" }
// Browser automation then:
// 1. Logs into your account
// 2. Searches for jobs
// 3. Applies to matching positions
// 4. Logs applications in database
```

---

## Database Storage

### New Tables Created

1. **user_credentials** - Stores encrypted credentials
   ```
   - user_id
   - linkedin_email, linkedin_password
   - wellfound_email, wellfound_password
   - naukri_email, naukri_password
   ```

2. **external_applications** - Tracks all external applications
   ```
   - user_id
   - job_title
   - source (LinkedIn, Wellfound, Naukri)
   - status (applied, failed, etc.)
   - applied_date
   ```

3. **scrape_history** - Records all job scraping activities
   ```
   - user_id
   - keyword
   - location
   - source
   - jobs_found
   - scraped_at
   ```

---

## API Endpoints

### Save Credentials
```
POST /api/automation/credentials
Authorization: Bearer {token}
Body: {
  linkedinEmail: "user@linkedin.com",
  linkedinPassword: "password123",
  wellfoundEmail: "user@wellfound.com",
  wellfoundPassword: "password123",
  naukriEmail: "user@naukri.com",
  naukriPassword: "password123"
}
Response: { message: "Credentials saved securely" }
```

### Get Credential Status
```
GET /api/automation/credentials
Authorization: Bearer {token}
Response: {
  linkedinConnected: true,
  wellfoundConnected: false,
  naukriConnected: true
}
```

### Scrape Jobs
```
POST /api/automation/scrape
Authorization: Bearer {token}
Body: { keyword: "Developer", location: "Remote" }
Response: { message: "Scraping started in background" }
```

### Trigger Auto-Apply
```
POST /api/automation/auto-apply
Authorization: Bearer {token}
Body: { keyword: "Developer", location: "Remote", source: "linkedin" }
Response: { message: "Auto-apply started in background" }
```

### Get External Applications
```
GET /api/automation/applications
Authorization: Bearer {token}
Response: [
  {
    id: 1,
    user_id: 1,
    job_title: "Senior Developer",
    source: "LinkedIn",
    status: "applied",
    applied_date: "2026-04-30T10:30:00Z"
  },
  ...
]
```

### Get Automation Stats
```
GET /api/automation/stats
Authorization: Bearer {token}
Response: {
  total_external_apps: 15,
  linkedin_apps: 8,
  wellfound_apps: 4,
  naukri_apps: 3
}
```

---

## Configuration

### Daily Application Limits (Rate Limiting)
Currently set in `automationManager.js`:
```javascript
// LinkedIn: 5 applications per trigger
// Wellfound: 5 applications per trigger
// Naukri: 5 applications per trigger
```

To modify, edit `server/automation/automationManager.js`:
```javascript
// Line: for (const job of jobs.slice(0, 5))
// Change 5 to desired limit
```

### Browser Launch Options
Edit `server/automation/linkedinAutomation.js`:
```javascript
this.browser = await puppeteer.launch({
  headless: 'new',  // Set to false to see browser
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage'
  ]
});
```

---

## Security Considerations

⚠️ **Important**:
1. **Credentials are stored** in the SQLite database
2. **Not encrypted** in this version - consider adding encryption for production
3. **Job sites may detect** automated applications and flag accounts
4. **Use with caution** on LinkedIn and similar platforms
5. **Terms of Service**: Check job site ToS before using automation

### Recommended Security Measures:
```javascript
// Add password encryption in production
const crypto = require('crypto');
const encryptPassword = (password) => {
  return crypto.createCipher('aes192', 'secret-key').update(password, 'utf8', 'hex');
};
```

---

## Troubleshooting

### Issue: Browser won't launch
```
Error: Failed to launch Puppeteer
Solution: Ensure Puppeteer dependencies are installed
$ npm install puppeteer --save
```

### Issue: Login failing
```
Problem: Credentials incorrect or job site requires 2FA
Solution: 
- Verify email/password are correct
- Disable 2FA temporarily or use app passwords
- Check if account is locked
```

### Issue: Applications not being submitted
```
Problem: Job site HTML selectors may have changed
Solution:
- Update selectors in automation files
- Example: document.querySelector('.apply-button')
- Test manually on the job site
```

---

## Performance

### System Requirements
- **RAM**: Minimum 2GB (Puppeteer needs ~300-500MB per browser)
- **CPU**: 2+ cores recommended
- **Storage**: 50MB+ for Chromium
- **Network**: 2+ Mbps recommended

### Optimization Tips
```javascript
// Close browser after each session
await browser.close();

// Use parallel processing for multiple users
Promise.all([...])

// Set timeouts to prevent hanging
page.setDefaultTimeout(30000);
```

---

## Monitoring

### View Application Logs
```bash
# Backend console logs
npm run server
# Look for: ✅ Applied to X jobs on LinkedIn

# Database query
SELECT * FROM external_applications 
WHERE user_id = 1 
ORDER BY applied_date DESC;
```

### Check Scrape History
```bash
# Query database
SELECT * FROM scrape_history 
WHERE user_id = 1 
ORDER BY scraped_at DESC LIMIT 10;
```

---

## Advanced Usage

### Bulk Auto-Apply
```javascript
// Apply to multiple job searches
const keywords = ["Developer", "Engineer", "Designer"];
const locations = ["Remote", "San Francisco"];

for (const keyword of keywords) {
  for (const location of locations) {
    await automationAPI.autoApply(keyword, location, 'all');
  }
}
```

### Schedule Auto-Apply (Cron Job)
```javascript
// In server.js - Add node-cron
const cron = require('node-cron');

// Run auto-apply daily at 9 AM
cron.schedule('0 9 * * *', () => {
  console.log('Running scheduled auto-apply...');
  automationManager.autoApplyToJobs(userId, 'Developer', 'Remote');
});
```

---

## FAQ

**Q: Is my account safe?**
A: Your credentials are stored in the database. Consider encryption in production.

**Q: Will LinkedIn ban my account?**
A: Automated applications may trigger account reviews. Use responsibly.

**Q: How many jobs can I apply to?**
A: Currently limited to 5 per trigger to avoid detection. Modify in automationManager.js

**Q: Can I apply to international job sites?**
A: Yes, you can extend by adding more scrapers for other platforms.

**Q: Is there a delay between applications?**
A: Yes, 1-2 second delays built in to appear human-like.

---

## Support

For issues or questions:
1. Check the logs in the browser console
2. Verify credentials are correct
3. Check job site selectors haven't changed
4. Open an issue with detailed error logs

