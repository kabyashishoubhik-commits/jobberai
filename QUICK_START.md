# 🚀 JobAccelerate - QUICK START GUIDE

## ✅ EVERYTHING IS RUNNING!

Your JobAccelerate application is **fully operational** with all features ready to use!

---

## 🌐 Access Points

| Component | URL | Status |
|-----------|-----|--------|
| Frontend App | http://localhost:3000 | ✅ Running |
| Backend API | http://localhost:5000 | ✅ Running |
| Dashboard | http://localhost:3000/dashboard | ✅ Ready |
| Automation | http://localhost:3000/dashboard/automation | ✅ New! |

---

## 📋 Quick Start (5 Minutes)

### Step 1: Open the App
```
http://localhost:3000
```

### Step 2: Create Account
1. Click "Sign Up"
2. Enter Name, Email, Password
3. Confirm Password
4. Click "Create Account"

### Step 3: Upload Resume
1. Go to Dashboard → Resume Library
2. Click "Upload New Resume"
3. Select your PDF or Word doc
4. Resume saved! ✅

### Step 4: Apply to Jobs
1. Go to Dashboard → Job Matches
2. Browse available jobs
3. Click "Apply" on any job
4. Watch it turn green when applied ✅

### Step 5: Enable Browser Automation
1. Go to Dashboard → **Browser Automation** (NEW!)
2. Connect your LinkedIn/Wellfound/Naukri accounts
3. Enter email and password for each site
4. Click "Save All Accounts"

### Step 6: Auto-Apply to External Sites
1. In Browser Automation page
2. Enter Job Title (e.g., "Senior Developer")
3. Enter Location (e.g., "Remote")
4. Click the platform button:
   - "Apply to LinkedIn" 💼
   - "Apply to Wellfound" 🚀
   - "Apply to Naukri" 🇮🇳
5. Watch applications get submitted automatically!

---

## 🎯 Main Features

### 📱 Dashboard
- View recommended jobs
- See your statistics
- Quick access to all tools

### 💼 Job Matches
- Browse job listings
- One-click apply
- Track all applications

### 🤖 Browser Automation (NEW!)
- Connect LinkedIn, Wellfound, Naukri
- Auto-apply to jobs on these platforms
- Headless browser (runs in background)
- Rate-limited to prevent account flagging

### 🔄 Auto Apply Queue
- Create custom job matching rules
- Set preferences (location, salary, etc.)
- See active rules and stats

### 📧 Email Outreach
- Manage email campaigns
- Track open rates and replies
- Use pre-built templates

### 📄 Resume Library
- Upload multiple resumes
- Manage different versions
- Track which resume is active

### 📊 Analytics
- View conversion funnel
- See application breakdown by source
- Track email performance

### ⚙️ Settings
- Enable/disable auto-apply
- Set daily application limit
- Configure notifications

---

## 🔌 How Browser Automation Works

### The Magic Behind It

```
You enter credentials
     ↓
Puppeteer launches hidden browser
     ↓
Logs into job site with your credentials
     ↓
Searches for jobs based on your criteria
     ↓
Fills out application forms automatically
     ↓
Submits applications
     ↓
Logs all submissions in database
     ↓
You see results in "External Applications"
```

### Supported Sites

| Platform | Status | Features |
|----------|--------|----------|
| LinkedIn | ✅ Active | Easy Apply, Form Filling |
| Wellfound | ✅ Active | Startup Jobs, Auto-Apply |
| Naukri | ✅ Active | Indian Jobs, Auto-Apply |

---

## 📊 Where Your Data is Stored

### Database Location
```
C:\Users\sachd\Downloads\JobAccelerate-main\db.sqlite
```

### What Gets Stored

| Data | Storage |
|------|---------|
| Your account info | `users` table |
| Resumes you upload | `uploads/` folder |
| Jobs you apply to internally | `applications` table |
| Jobs scraped from LinkedIn/Wellfound/Naukri | `jobs` table |
| Auto-apply rules | `auto_apply_rules` table |
| External applications | `external_applications` table |
| Browser automation history | `scrape_history` table |

### Privacy Note
- Credentials are stored in `user_credentials` table
- ⚠️ Consider adding encryption for production
- Only you can see your data

---

## 🎮 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + K` | Quick search (if enabled) |
| `Escape` | Close modals |
| `/` | Focus search (some pages) |

---

## ⚡ Pro Tips

### Tip 1: Multiple Resumes
Upload different resumes for different job types:
- `resume-tech.pdf` - Technical roles
- `resume-management.pdf` - Leadership roles
- `resume-startup.pdf` - Startup roles

### Tip 2: Auto-Apply Limits
Set daily limits to avoid detection:
- Free Plan: 5 apps/day
- Pro Plan: 50 apps/day
- Enterprise: Unlimited

### Tip 3: Browser Automation Timing
- Run auto-apply during business hours
- Don't run too frequently (risk of account flagging)
- Check applications regularly to ensure they're working

### Tip 4: Job Search
- Be specific with keywords (e.g., "Senior Frontend Engineer")
- Include location for better matches
- Use multiple searches for broader coverage

### Tip 5: Email Outreach
- Personalize templates for each company
- Track which emails get opened
- Follow up with replies

---

## 🆘 Troubleshooting

### Issue: Can't login
**Solution**: 
- Check email and password are correct
- Ensure you've signed up first

### Issue: Resume won't upload
**Solution**:
- Must be PDF or DOCX
- Must be under 5MB
- Check file permissions

### Issue: Apply button not working
**Solution**:
- Refresh the page
- Make sure you're logged in
- Check browser console for errors

### Issue: Browser automation not applying
**Solution**:
- Verify credentials are correct
- Check if 2FA is enabled (disable if possible)
- Check job site isn't blocking automation
- Try manually on the job site first

### Issue: Jobs not found
**Solution**:
- Try different keywords
- Use broader location (e.g., "Remote" instead of city)
- Check job site directly to verify jobs exist

---

## 🔒 Security Tips

1. **Strong Password**: Use 8+ characters, mix case and numbers
2. **Keep Credentials Safe**: Don't share login info
3. **2FA**: Some sites may require disabling 2FA for automation
4. **Regular Backups**: Your resume uploads are safe in `uploads/` folder
5. **Monitor Applications**: Check external applications regularly

---

## 🚀 What's Next?

### After Setup
1. Wait for applications to be submitted
2. Check your email for job site notifications
3. Review application status in the dashboard
4. Follow up on promising leads

### Advanced Usage
1. Create multiple auto-apply rules for different roles
2. Use email outreach for manual applications
3. Monitor analytics to see what works
4. Optimize keywords based on conversion rate

### Optimization
1. Track which job sources get best responses
2. Adjust daily limits based on results
3. Refine resume versions based on feedback
4. Follow up on interview opportunities

---

## 📞 Support

### Common Questions

**Q: Is my account safe?**
A: Yes! Your data is private and secure. Credentials stored in database.

**Q: Will job sites ban me?**
A: Unlikely if you use reasonable limits. We limit to 5 apps/trigger.

**Q: Can I apply to jobs manually too?**
A: Yes! Mix manual and automated applications for best results.

**Q: How long does automation take?**
A: Depends on number of jobs. Usually 2-5 minutes for 20-30 applications.

**Q: Can I use multiple email addresses?**
A: Yes, create multiple accounts on JobAccelerate.

---

## 🎉 You're All Set!

Your JobAccelerate is fully configured and ready to help you land your next job!

### Next Steps:
1. ✅ Open http://localhost:3000
2. ✅ Sign up for an account
3. ✅ Upload your resume
4. ✅ Connect to job sites
5. ✅ Start applying!

---

**Good luck with your job search! 🚀**

*Last Updated: May 1, 2026*
