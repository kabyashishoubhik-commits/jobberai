const LinkedInAutomation = require('./linkedinAutomation');
const WellfoundAutomation = require('./wellfoundAutomation');
const NaukriAutomation = require('./naukriAutomation');
const JobScraper = require('./jobScraper');
const path = require('path');

const SOURCE_LABELS = {
  linkedin: 'LinkedIn',
  wellfound: 'Wellfound',
  naukri: 'Naukri',
};

class AutomationManager {
  constructor(db) {
    this.db = db;
    this.linkedIn = null;
    this.wellfound = null;
    this.naukri = null;
    this.scraper = null;
    this.isRunning = false;
    this.browserSessions = new Map();
  }

  normalizeSource(source) {
    const normalized = String(source || '').toLowerCase();
    if (!SOURCE_LABELS[normalized]) {
      throw new Error('Unsupported source. Use linkedin, wellfound, or naukri.');
    }
    return normalized;
  }

  getSessionKey(userId, source) {
    return `${userId}:${source}`;
  }

  getResumePathForUser(userId) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT resume_path FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) return reject(err);
        if (!user?.resume_path) return resolve(null);

        const relativePath = user.resume_path.replace(/^\/+/, '');
        resolve(path.resolve(__dirname, '..', '..', relativePath));
      });
    });
  }

  getDailyLimit(userId) {
    return new Promise((resolve) => {
      this.db.get('SELECT daily_limit FROM settings WHERE user_id = ?', [userId], (err, settings) => {
        if (err || !settings?.daily_limit) return resolve(5);
        resolve(Math.max(1, Math.min(Number(settings.daily_limit) || 5, 50)));
      });
    });
  }

  getPersonalDetails(userId) {
    return new Promise((resolve) => {
      this.db.get('SELECT full_name, contact_email, phone_number FROM user_credentials WHERE user_id = ?', [userId], (err, creds) => {
        if (err || !creds) {
          return resolve({
            fullName: 'Kabeer Sachdev',
            email: 'sachdevkabeer@gmail.com',
            phone: '9958844216'
          });
        }
        resolve({
          fullName: creds.full_name || 'Kabeer Sachdev',
          email: creds.contact_email || 'sachdevkabeer@gmail.com',
          phone: creds.phone_number || '9958844216'
        });
      });
    });
  }

  async initializeScraper() {
    try {
      this.scraper = new JobScraper();
      await this.scraper.launch();
      console.log('JobScraper initialized');
    } catch (err) {
      console.error('Failed to initialize scraper:', err);
    }
  }

  async scrapeJobs(keyword, location) {
    if (!this.scraper) {
      await this.initializeScraper();
    }

    try {
      console.log(`Scraping jobs for: ${keyword} in ${location}`);
      const jobs = await this.scraper.scrapeAllSources(keyword, location);
      this.storeScrapedJobs(jobs);
      return jobs;
    } catch (err) {
      console.error('Scraping failed:', err);
      return { linkedIn: [], wellfound: [], naukri: [], total: 0 };
    }
  }

  storeScrapedJobs(scrapedJobs) {
    const allJobs = [
      ...scrapedJobs.linkedIn,
      ...scrapedJobs.wellfound,
      ...scrapedJobs.naukri,
    ];

    allJobs.forEach((job) => {
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

    console.log(`Stored ${allJobs.length} jobs in database`);
  }

  async autoApplyToJobs(userId, keywords, location, source = 'all') {
    try {
      console.log(`Starting auto-apply for user ${userId}`);

      this.db.get(
        'SELECT linkedin_email, linkedin_password, wellfound_email, wellfound_password, naukri_email, naukri_password FROM user_credentials WHERE user_id = ?',
        [userId],
        async (err, creds) => {
          if (err || !creds) {
            console.error('User credentials not found');
            return;
          }

          const jobs = await this.scrapeJobs(keywords, location);

          if ((source === 'all' || source === 'linkedin') && creds.linkedin_email) {
            await this.applyLinkedIn(userId, creds.linkedin_email, creds.linkedin_password, jobs.linkedIn || []);
          }

          if ((source === 'all' || source === 'wellfound') && creds.wellfound_email) {
            await this.applyWellfound(userId, creds.wellfound_email, creds.wellfound_password, jobs.wellfound || []);
          }

          if ((source === 'all' || source === 'naukri') && creds.naukri_email) {
            await this.applyNaukri(userId, creds.naukri_email, creds.naukri_password, jobs.naukri || []);
          }
        }
      );
    } catch (err) {
      console.error('Auto-apply failed:', err);
    }
  }

  async applyLinkedIn(userId, email, password, jobs) {
    try {
      this.linkedIn = new LinkedInAutomation();
      await this.linkedIn.launch();
      const loggedIn = await this.linkedIn.login(email, password);

      if (!loggedIn) {
        console.error('LinkedIn login failed');
        await this.linkedIn.close();
        return;
      }

      let appliedCount = 0;
      const dailyLimit = await this.getDailyLimit(userId);
      const jobsArray = Array.isArray(jobs) ? jobs : [];
      const jobsToApply = jobsArray.slice(0, dailyLimit);
      
      console.log(`[ApplyLinkedIn] Processing ${jobsToApply.length} jobs (daily limit: ${dailyLimit})`);
      
      for (const job of jobsToApply) {
        console.log(`[ApplyLinkedIn] Attempting to apply - Title: ${job.title}, Link: ${job.link}`);
        const result = await this.linkedIn.applyToJob(job.link);
        
        if (result.success) {
          appliedCount += 1;
          try {
            await this.logApplication(userId, job, 'applied');
            console.log(`[ApplyLinkedIn] Logged application for: ${job.title}`);
          } catch (err) {
            console.error(`[ApplyLinkedIn] Failed to log application for ${job.title}:`, err.message);
          }
        } else {
          console.warn(`[ApplyLinkedIn] Application failed for ${job.title}: ${result.message}`);
        }
      }

      await this.linkedIn.close();
      console.log(`✅ [ApplyLinkedIn] Applied to ${appliedCount} jobs on LinkedIn`);
    } catch (err) {
      console.error('LinkedIn auto-apply failed:', err);
    }
  }

  async applyWellfound(userId, email, password, jobs) {
    try {
      this.wellfound = new WellfoundAutomation();
      await this.wellfound.launch();
      const loggedIn = await this.wellfound.login(email, password);

      if (!loggedIn) {
        console.error('Wellfound login failed');
        await this.wellfound.close();
        return;
      }

      let appliedCount = 0;
      const dailyLimit = await this.getDailyLimit(userId);
      const jobsArray = Array.isArray(jobs) ? jobs : [];
      for (const job of jobsArray.slice(0, dailyLimit)) {
        const result = await this.wellfound.applyToJob(job.link);
        if (result.success) {
          appliedCount += 1;
          try {
            await this.logApplication(userId, job, 'applied');
          } catch (err) {
            console.error('Failed to log application:', err);
          }
        }
      }

      await this.wellfound.close();
      console.log(`Applied to ${appliedCount} jobs on Wellfound`);
    } catch (err) {
      console.error('Wellfound auto-apply failed:', err);
    }
  }

  async applyNaukri(userId, email, password, jobs) {
    try {
      const resumePath = await this.getResumePathForUser(userId);
      const personalDetails = await this.getPersonalDetails(userId);

      this.naukri = new NaukriAutomation(resumePath, { personalDetails });
      await this.naukri.launch();

      console.log(`Naukri automation initialized with resume: ${resumePath || 'None'}`);

      const loggedIn = await this.naukri.login(email, password);

      if (!loggedIn) {
        console.error('Naukri login failed');
        await this.naukri.close();
        return;
      }

      let appliedCount = 0;
      const dailyLimit = await this.getDailyLimit(userId);
      const jobsArray = Array.isArray(jobs) ? jobs : [];
      const jobsToApply = jobsArray.slice(0, dailyLimit);
      
      console.log(`[ApplyNaukri] Processing ${jobsToApply.length} jobs (daily limit: ${dailyLimit})`);
      
      for (let i = 0; i < jobsToApply.length; i++) {
        const job = jobsToApply[i];
        console.log(`[ApplyNaukri] [${i + 1}/${jobsToApply.length}] Attempting to apply - Title: ${job.title}, Link: ${job.link}`);
        
        try {
          const result = await this.naukri.applyToJob(job.link);
          
          if (result.success) {
            appliedCount += 1;
            console.log(`[ApplyNaukri] ✅ Application successful for: ${job.title}`);
            
            try {
              await this.logApplication(userId, job, 'applied');
              console.log(`[ApplyNaukri] Logged application for: ${job.title}`);
            } catch (err) {
              console.error(`[ApplyNaukri] Failed to log application for ${job.title}:`, err.message);
            }
          } else {
            console.warn(`[ApplyNaukri] ❌ Application failed for ${job.title}: ${result.message}`);
          }
          
          // Add delay between applications to prevent browser overload
          if (i < jobsToApply.length - 1) {
            console.log('[ApplyNaukri] Waiting 2 seconds before next application...');
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (err) {
          console.error(`[ApplyNaukri] Exception while applying to job: ${job.title}`, err.message);
          // Wait longer if there's an exception to let browser recover
          if (i < jobsToApply.length - 1) {
            console.log('[ApplyNaukri] Exception occurred. Waiting 3 seconds before next attempt...');
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        }
      }

      await this.naukri.close();
      console.log(`✅ [ApplyNaukri] Applied to ${appliedCount} jobs on Naukri`);
    } catch (err) {
      console.error('Naukri auto-apply failed:', err);
    }
  }

  async openBrowserSession(userId, source, options = {}) {
    const normalizedSource = this.normalizeSource(source);
    const key = this.getSessionKey(userId, normalizedSource);

    if (this.browserSessions.has(key)) {
      const existing = this.browserSessions.get(key);
      return {
        source: SOURCE_LABELS[normalizedSource],
        status: existing.status,
        message: `${SOURCE_LABELS[normalizedSource]} browser is already open.`,
      };
    }

    let automation;
    if (normalizedSource === 'linkedin') {
      automation = new LinkedInAutomation({ headless: false });
    } else if (normalizedSource === 'wellfound') {
      automation = new WellfoundAutomation({ headless: false });
    } else {
      const resumePath = await this.getResumePathForUser(userId);
      const personalDetails = await this.getPersonalDetails(userId);
      automation = new NaukriAutomation(resumePath, { headless: false, personalDetails });
    }

    await automation.launch();
    await automation.openManualLogin(options.startUrl);

    this.browserSessions.set(key, {
      source: normalizedSource,
      automation,
      status: 'waiting_for_manual_login',
      openedAt: new Date().toISOString(),
      lastMessage: 'Browser opened. Complete login in the visible browser, then click Take Over.',
    });

    return {
      source: SOURCE_LABELS[normalizedSource],
      status: 'waiting_for_manual_login',
      message: 'Browser opened. Complete login in the visible browser, then click Take Over.',
    };
  }

  async takeOverBrowserSession(userId, source, keyword, location) {
    const normalizedSource = this.normalizeSource(source);
    const key = this.getSessionKey(userId, normalizedSource);
    const session = this.browserSessions.get(key);

    if (!session) {
      throw new Error(`Open a ${SOURCE_LABELS[normalizedSource]} browser session first.`);
    }

    if (!keyword || !location) {
      throw new Error('Job title and location are required before browser takeover.');
    }

    session.status = 'running';
    session.lastMessage = 'Automation has taken over the browser.';

    const dailyLimit = await this.getDailyLimit(userId);
    
    // Add delay before searching to let browser settle
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const jobs = await session.automation.searchJobs(keyword, location);
    const jobsArray = Array.isArray(jobs) ? jobs : [];
    const limitedJobs = jobsArray.slice(0, dailyLimit);

    console.log(`[TakeOverBrowser] Processing ${limitedJobs.length} jobs for ${SOURCE_LABELS[normalizedSource]}`);

    let appliedCount = 0;
    let failedCount = 0;
    
    for (let i = 0; i < limitedJobs.length; i++) {
      const job = limitedJobs[i];
      
      if (!job?.link) {
        console.warn('[TakeOverBrowser] Skipping job - no link provided');
        failedCount += 1;
        continue;
      }
      
      console.log(`[TakeOverBrowser] [${i + 1}/${limitedJobs.length}] Attempting to apply - Title: ${job.title}, Link: ${job.link}`);
      
      try {
        const result = await session.automation.applyToJob(job.link);
        
        if (result.success) {
          appliedCount += 1;
          console.log(`[TakeOverBrowser] ✅ Application successful for: ${job.title}`);
          
          try {
            await this.logApplication(userId, job, 'applied');
            console.log(`[TakeOverBrowser] Logged application for: ${job.title}`);
          } catch (err) {
            console.error(`[TakeOverBrowser] Failed to log application for ${job.title}:`, err.message);
          }
        } else {
          failedCount += 1;
          console.warn(`[TakeOverBrowser] ❌ Application failed for ${job.title}: ${result.message}`);
        }
        
        // Add delay between applications to prevent browser overload (especially for Naukri)
        if (i < limitedJobs.length - 1) {
          console.log('[TakeOverBrowser] Waiting 2 seconds before next application...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (err) {
        failedCount += 1;
        console.error(`[TakeOverBrowser] Exception while applying to job: ${job.title}`, err.message);
        // Wait longer if there's an exception to let browser recover
        if (i < limitedJobs.length - 1) {
          console.log('[TakeOverBrowser] Exception occurred. Waiting 3 seconds before next attempt...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }

    session.status = 'completed';
    session.lastMessage = `Applied to ${appliedCount} out of ${limitedJobs.length} ${SOURCE_LABELS[normalizedSource]} jobs. (${failedCount} failed)`;

    return {
      source: SOURCE_LABELS[normalizedSource],
      appliedCount,
      checkedCount: limitedJobs.length,
      status: session.status,
      message: session.lastMessage,
    };
  }

  getBrowserSessionStatus(userId, source) {
    const normalizedSource = this.normalizeSource(source);
    const session = this.browserSessions.get(this.getSessionKey(userId, normalizedSource));

    if (!session) {
      return {
        source: SOURCE_LABELS[normalizedSource],
        status: 'closed',
        message: 'No browser session is open.',
      };
    }

    return {
      source: SOURCE_LABELS[normalizedSource],
      status: session.status,
      message: session.lastMessage,
      openedAt: session.openedAt,
    };
  }

  async closeBrowserSession(userId, source) {
    const normalizedSource = this.normalizeSource(source);
    const key = this.getSessionKey(userId, normalizedSource);
    const session = this.browserSessions.get(key);

    if (session?.automation) {
      await session.automation.close();
    }

    this.browserSessions.delete(key);
    return {
      source: SOURCE_LABELS[normalizedSource],
      status: 'closed',
      message: `${SOURCE_LABELS[normalizedSource]} browser session closed.`,
    };
  }

  logApplication(userId, job, status) {
    return new Promise((resolve, reject) => {
      // Prepare job data with validation
      const jobData = {
        title: (job.title || 'Job Application').trim(),
        company: (job.company || 'Unknown Company').trim(),
        location: (job.location || '').trim(),
        url: (job.link || '').trim(),
      };

      // Validate URL exists and is not empty
      if (!jobData.url) {
        const errorMsg = `Cannot log application: Job URL is missing. Job object: ${JSON.stringify(job)}`;
        console.error(errorMsg);
        return reject(new Error('Job URL is required'));
      }

      // Ensure URL is valid
      try {
        new URL(jobData.url);
      } catch (e) {
        console.error(`Invalid URL format: ${jobData.url}`, e);
        return reject(new Error(`Invalid URL format: ${jobData.url}`));
      }

      // Save reference to this for use in callbacks
      const db = this.db;

      console.log(`[LogApplication] Logging application - Title: ${jobData.title}, Company: ${jobData.company}, URL: ${jobData.url}`);

      // First, insert or ignore the job
      db.run(
        `INSERT OR IGNORE INTO jobs (title, company, location, url, created_at)
         VALUES (?, ?, ?, ?, datetime('now'))`,
        [jobData.title, jobData.company, jobData.location, jobData.url],
        (err) => {
          if (err) {
            console.error('[LogApplication] Error inserting job:', err);
            return reject(err);
          }

          console.log(`[LogApplication] Job inserted/ignored successfully`);

          // Now get the job_id by URL (URL is UNIQUE)
          db.get(
            `SELECT id FROM jobs WHERE url = ?`,
            [jobData.url],
            (err, jobRow) => {
              if (err) {
                console.error('[LogApplication] Error fetching job by URL:', err);
                return reject(err);
              }

              if (!jobRow) {
                console.error('[LogApplication] Job not found after insert:', jobData.url);
                return reject(new Error('Job not found after insert'));
              }

              console.log(`[LogApplication] Found job with ID: ${jobRow.id}`);

              // Finally, insert the application
              db.run(
                `INSERT OR IGNORE INTO applications (user_id, job_id, status, applied_date)
                 VALUES (?, ?, ?, datetime('now'))`,
                [userId, jobRow.id, status],
                (err) => {
                  if (err) {
                    console.error('[LogApplication] Error logging application:', err);
                    return reject(err);
                  }
                  console.log(`✅ [LogApplication] Application successfully logged - Job ID: ${jobRow.id}, Company: ${jobData.company}, User: ${userId}`);
                  resolve(jobRow.id);
                }
              );
            }
          );
        }
      );
    });
  }

  async syncNaukriApplications(userId, email, password) {
    try {
      const naukri = new NaukriAutomation(null);
      await naukri.launch();
      
      const loggedIn = await naukri.login(email, password);
      if (!loggedIn) {
        console.error('[SyncNaukri] Naukri login failed');
        await naukri.close();
        return { success: false, message: 'Naukri login failed', syncedCount: 0 };
      }

      console.log('[SyncNaukri] Successfully logged in, fetching applied jobs...');
      const appliedJobs = await naukri.getAppliedJobs();
      console.log(`[SyncNaukri] Found ${appliedJobs.length} applied jobs from Naukri`);
      
      await naukri.close();

      let syncedCount = 0;
      let failedCount = 0;
      
      for (const job of appliedJobs) {
        console.log(`[SyncNaukri] Processing job - Title: ${job.title}, Link: ${job.link}`);
        
        try {
          await this.logApplication(userId, job, 'applied');
          syncedCount += 1;
          console.log(`[SyncNaukri] Successfully synced: ${job.title}`);
        } catch (err) {
          failedCount += 1;
          console.error(`[SyncNaukri] Failed to sync job ${job.title}:`, err.message);
        }
      }

      const message = `Synced ${syncedCount} applications from Naukri${failedCount > 0 ? ` (${failedCount} failed)` : ''}`;
      console.log(`✅ [SyncNaukri] ${message}`);
      
      return { success: true, message, syncedCount };
    } catch (err) {
      console.error('[SyncNaukri] Naukri sync failed:', err);
      return { success: false, message: err.message, syncedCount: 0 };
    }
  }

  async closeAll() {
    if (this.linkedIn) await this.linkedIn.close();
    if (this.wellfound) await this.wellfound.close();
    if (this.naukri) await this.naukri.close();
    if (this.scraper) await this.scraper.close();
    for (const session of this.browserSessions.values()) {
      if (session.automation) await session.automation.close();
    }
    this.browserSessions.clear();
  }
}

module.exports = AutomationManager;
