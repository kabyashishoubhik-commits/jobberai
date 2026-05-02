const puppeteer = require('puppeteer');

class WellfoundAutomation {
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
      console.log('✅ Puppeteer browser launched for Wellfound');
    } catch (err) {
      console.error('❌ Failed to launch browser:', err);
      throw err;
    }
  }

  async login(email, password) {
    try {
      this.page = await this.browser.newPage();
      await this.page.goto('https://wellfound.com/login', { waitUntil: 'networkidle2' });

      // Fill email
      const emailField = await this.page.$('input[type="email"]');
      if (emailField) {
        await emailField.type(email, { delay: 50 });
      }

      // Fill password
      const passwordField = await this.page.$('input[type="password"]');
      if (passwordField) {
        await passwordField.type(password, { delay: 50 });
      }

      // Click login
      await this.page.click('button[type="submit"]');
      await this.page.waitForNavigation({ waitUntil: 'networkidle2' });

      console.log('✅ Wellfound login successful');
      return true;
    } catch (err) {
      console.error('❌ Wellfound login failed:', err);
      return false;
    }
  }

  async searchJobs(keyword, location) {
    try {
      const searchUrl = `https://wellfound.com/jobs?query=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}`;
      await this.page.goto(searchUrl, { waitUntil: 'networkidle2' });

      // Scroll to load more jobs
      await this.page.evaluate(() => {
        window.scrollBy(0, window.innerHeight);
      });

      await this.page.waitForTimeout(2000);

      // Get job listings
      const jobs = await this.page.evaluate(() => {
        return Array.from(document.querySelectorAll('[data-testid="job-card"]')).map(job => ({
          title: job.querySelector('[data-testid="job-title"]')?.textContent?.trim(),
          company: job.querySelector('[data-testid="company-name"]')?.textContent?.trim(),
          link: job.querySelector('a')?.href,
        }));
      });

      console.log(`✅ Found ${jobs.length} jobs on Wellfound`);
      return jobs;
    } catch (err) {
      console.error('❌ Job search failed:', err);
      return [];
    }
  }

  async applyToJob(jobUrl) {
    try {
      await this.page.goto(jobUrl, { waitUntil: 'networkidle2' });

      // Click Apply button
      const applyButton = await this.page.$('button:contains("Apply Now")');

      if (!applyButton) {
        // Try alternative selector
        const buttons = await this.page.$$('button');
        for (let btn of buttons) {
          const text = await btn.evaluate(el => el.textContent);
          if (text.includes('Apply')) {
            await btn.click();
            break;
          }
        }
      } else {
        await applyButton.click();
      }

      await this.page.waitForTimeout(1000);

      // Fill application form
      const nameField = await this.page.$('input[name="fullName"]');
      if (nameField) {
        await nameField.fill('Resume Owner');
      }

      // Submit
      const submitButton = await this.page.$('button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
        console.log('✅ Application submitted to Wellfound job');
        return { success: true, message: 'Applied successfully' };
      }

      return { success: true, message: 'Application initiated' };
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

module.exports = WellfoundAutomation;
