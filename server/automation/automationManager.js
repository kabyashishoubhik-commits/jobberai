const LinkedInAutomation = require('./linkedinAutomation');
const WellfoundAutomation = require('./wellfoundAutomation');
const NaukriAutomation = require('./naukriAutomation');
const JobScraper = require('./jobScraper');

class AutomationManager {
  constructor(db) {
    this.db = db;
    this.linkedIn = null;
    this.wellfound = null;
    this.naukri = null;
    this.scraper = null;
    this.isRunning = false;
  }

  async initializeScraper() {
    try {
      this.scraper = new JobScraper();
      await this.scraper.launch();
      console.log('✅ JobScraper initialized');
    } catch (err) {
      console.error('❌ Failed to initialize scraper:', err);
    }
  }

  async scrapeJobs(keyword, location) {
    if (!this.scraper) {
      await this.initializeScraper();
    }

    try {
      console.log(`🔍 Scraping jobs for: ${keyword} in ${location}`);
      const jobs = await this.scraper.scrapeAllSources(keyword, location);
      
      // Store scraped jobs in database
      this.storeScrapedJobs(jobs);
      
      return jobs;
    } catch (err) {
      console.error('❌ Scraping failed:', err);
      return { linkedIn: [], wellfound: [], naukri: [], total: 0 };
    }
  }

  storeScrapedJobs(scrapedJobs) {
    const allJobs = [
      ...scrapedJobs.linkedIn,
      ...scrapedJobs.wellfound,
      ...scrapedJobs.naukri
    ];

    allJobs.forEach(job => {
      if (job.link) {
        this.db.run(
          `INSERT OR IGNORE INTO jobs (title, company, location, url, posted_date, created_at)
           VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
          [job.title, job.company, job.location, job.link],
          (err) => {
            if (err) console.error('Error storing job:', err);
          }
        );
      }
    });

    console.log(`✅ Stored ${allJobs.length} jobs in database`);
  }

  async autoApplyToJobs(userId, keywords, location, source = 'all') {
    try {
      console.log(`🤖 Starting auto-apply for user ${userId}`);
      
      // Get user credentials from settings
      this.db.get(
        'SELECT linkedin_email, linkedin_password, wellfound_email, wellfound_password, naukri_email, naukri_password FROM user_credentials WHERE user_id = ?',
        [userId],
        async (err, creds) => {
          if (err || !creds) {
            console.error('❌ User credentials not found');
            return;
          }

          // Scrape jobs
          const jobs = await this.scrapeJobs(keywords, location);

          // Apply to jobs based on source
          if ((source === 'all' || source === 'linkedin') && creds.linkedin_email) {
            await this.applyLinkedIn(userId, creds.linkedin_email, creds.linkedin_password, jobs.linkedIn);
          }

          if ((source === 'all' || source === 'wellfound') && creds.wellfound_email) {
            await this.applyWellfound(userId, creds.wellfound_email, creds.wellfound_password, jobs.wellfound);
          }

          if ((source === 'all' || source === 'naukri') && creds.naukri_email) {
            await this.applyNaukri(userId, creds.naukri_email, creds.naukri_password, jobs.naukri);
          }
        }
      );
    } catch (err) {
      console.error('❌ Auto-apply failed:', err);
    }
  }

  async applyLinkedIn(userId, email, password, jobs) {
    try {
      this.linkedIn = new LinkedInAutomation();
      await this.linkedIn.launch();
      const loggedIn = await this.linkedIn.login(email, password);

      if (!loggedIn) {
        console.error('❌ LinkedIn login failed');
        await this.linkedIn.close();
        return;
      }

      let appliedCount = 0;
      for (const job of jobs.slice(0, 5)) { // Limit to 5 per day
        const result = await this.linkedIn.applyToJob(job.link);
        if (result.success) {
          appliedCount++;
          this.logApplication(userId, job.title, 'LinkedIn', 'applied');
        }
      }

      await this.linkedIn.close();
      console.log(`✅ Applied to ${appliedCount} jobs on LinkedIn`);
    } catch (err) {
      console.error('❌ LinkedIn auto-apply failed:', err);
    }
  }

  async applyWellfound(userId, email, password, jobs) {
    try {
      this.wellfound = new WellfoundAutomation();
      await this.wellfound.launch();
      const loggedIn = await this.wellfound.login(email, password);

      if (!loggedIn) {
        console.error('❌ Wellfound login failed');
        await this.wellfound.close();
        return;
      }

      let appliedCount = 0;
      for (const job of jobs.slice(0, 5)) { // Limit to 5 per day
        const result = await this.wellfound.applyToJob(job.link);
        if (result.success) {
          appliedCount++;
          this.logApplication(userId, job.title, 'Wellfound', 'applied');
        }
      }

      await this.wellfound.close();
      console.log(`✅ Applied to ${appliedCount} jobs on Wellfound`);
    } catch (err) {
      console.error('❌ Wellfound auto-apply failed:', err);
    }
  }

  async applyNaukri(userId, email, password, jobs) {
    try {
      // Get user's resume path
      const user = await new Promise((resolve, reject) => {
        this.db.get(
          'SELECT resume_path FROM users WHERE id = ?',
          [userId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      const resumePath = user?.resume_path ? `./uploads/${user.resume_path}` : null;
      
      this.naukri = new NaukriAutomation(resumePath);
      await this.naukri.launch();
      
      console.log(`📄 Naukri automation initialized with resume: ${resumePath || 'None'}`);

      const loggedIn = await this.naukri.login(email, password);

      if (!loggedIn) {
        console.error('❌ Naukri login failed');
        await this.naukri.close();
        return;
      }

      let appliedCount = 0;
      for (const job of jobs.slice(0, 5)) { // Limit to 5 per day
        const result = await this.naukri.applyToJob(job.link);
        if (result.success) {
          appliedCount++;
          this.logApplication(userId, job.title, 'Naukri', 'applied');
        }
      }

      await this.naukri.close();
      console.log(`✅ Applied to ${appliedCount} jobs on Naukri`);
    } catch (err) {
      console.error('❌ Naukri auto-apply failed:', err);
    }
  }

  logApplication(userId, jobTitle, source, status) {
    this.db.run(
      `INSERT INTO external_applications (user_id, job_title, source, status, applied_date)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      [userId, jobTitle, source, status],
      (err) => {
        if (err) console.error('Error logging application:', err);
      }
    );
  }

  async closeAll() {
    if (this.linkedIn) await this.linkedIn.close();
    if (this.wellfound) await this.wellfound.close();
    if (this.naukri) await this.naukri.close();
    if (this.scraper) await this.scraper.close();
  }
}

module.exports = AutomationManager;
