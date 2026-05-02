const puppeteer = require('puppeteer');

class LinkedInAutomation {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async launch() {
    try {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ]
      });
      console.log('✅ Puppeteer browser launched');
    } catch (err) {
      console.error('❌ Failed to launch browser:', err);
      throw err;
    }
  }

  async login(email, password) {
    try {
      this.page = await this.browser.newPage();
      await this.page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle2' });

      // Fill email
      await this.page.type('input[name="session_key"]', email, { delay: 50 });
      
      // Fill password
      await this.page.type('input[name="session_password"]', password, { delay: 50 });
      
      // Click login
      await this.page.click('button[type="submit"]');
      
      // Wait for navigation
      await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      console.log('✅ LinkedIn login successful');
      return true;
    } catch (err) {
      console.error('❌ LinkedIn login failed:', err);
      return false;
    }
  }

  async searchJobs(keyword, location) {
    try {
      const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}`;
      await this.page.goto(searchUrl, { waitUntil: 'networkidle2' });

      // Scroll to load more jobs
      await this.page.evaluate(() => {
        window.scrollBy(0, window.innerHeight);
      });

      await this.page.waitForTimeout(2000);

      // Get job listings
      const jobs = await this.page.evaluate(() => {
        return Array.from(document.querySelectorAll('.base-card')).map(job => ({
          title: job.querySelector('.base-search-card__title')?.textContent?.trim(),
          company: job.querySelector('.base-search-card__subtitle')?.textContent?.trim(),
          link: job.querySelector('a')?.href,
        }));
      });

      console.log(`✅ Found ${jobs.length} jobs on LinkedIn`);
      return jobs;
    } catch (err) {
      console.error('❌ Job search failed:', err);
      return [];
    }
  }

  async applyToJob(jobUrl) {
    try {
      await this.page.goto(jobUrl, { waitUntil: 'networkidle2' });

      // Click Easy Apply button if available
      const easyApplyButton = await this.page.$('button[aria-label="Easy Apply"]');
      
      if (easyApplyButton) {
        await easyApplyButton.click();
        await this.page.waitForTimeout(1000);

        // Handle application form
        const submitButton = await this.page.$('button[aria-label="Submit application"]');
        if (submitButton) {
          await submitButton.click();
          console.log('✅ Application submitted to LinkedIn job');
          return { success: true, message: 'Applied successfully' };
        }
      } else {
        console.log('⚠️ Easy Apply button not found');
        return { success: false, message: 'Easy Apply not available for this job' };
      }

      return { success: true, message: 'Applied successfully' };
    } catch (err) {
      console.error('❌ Failed to apply to job:', err);
      return { success: false, message: err.message };
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('✅ Browser closed');
    }
  }
}

module.exports = LinkedInAutomation;
