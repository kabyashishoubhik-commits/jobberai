const puppeteer = require('puppeteer');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class LinkedInAutomation {
  constructor(options = {}) {
    this.browser = null;
    this.page = null;
    this.options = options;
  }

  async launch() {
    try {
      this.browser = await puppeteer.launch({
        headless: this.options.headless ?? 'new',
        defaultViewport: this.options.headless === false ? null : undefined,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--start-maximized'],
      });
      console.log('Puppeteer browser launched for LinkedIn');
    } catch (err) {
      console.error('Failed to launch LinkedIn browser:', err);
      throw err;
    }
  }

  async ensurePage() {
    if (!this.page) {
      this.page = await this.browser.newPage();
      await this.page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121 Safari/537.36'
      );
    }
    return this.page;
  }

  async openManualLogin(startUrl = 'https://www.linkedin.com/login') {
    const page = await this.ensurePage();
    await page.goto(startUrl || 'https://www.linkedin.com/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(1000);
    return true;
  }

  async login(email, password) {
    try {
      const page = await this.ensurePage();
      await page.goto('https://www.linkedin.com/login', { waitUntil: 'domcontentloaded', timeout: 60000 });

      await page.type('input[name="session_key"]', email, { delay: 50 });
      await page.type('input[name="session_password"]', password, { delay: 50 });
      await page.click('button[type="submit"]');
      await delay(5000);

      console.log('LinkedIn login submitted');
      return !/login/i.test(page.url());
    } catch (err) {
      console.error('LinkedIn login failed:', err.message);
      return false;
    }
  }

  async searchJobs(keyword, location) {
    try {
      const page = await this.ensurePage();
      const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(
        location
      )}&f_AL=true`;
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await delay(3000);

      for (let i = 0; i < 4; i += 1) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await delay(800);
      }

      const jobs = await page.evaluate(() => {
        const cards = Array.from(
          document.querySelectorAll('.job-card-container, .jobs-search-results__list-item, .base-card')
        );

        return cards
          .map((job) => {
            const titleEl = job.querySelector('.job-card-list__title, .base-search-card__title, a[href*="/jobs/view"]');
            const companyEl = job.querySelector('.artdeco-entity-lockup__subtitle, .base-search-card__subtitle');
            const locationEl = job.querySelector('.job-card-container__metadata-item, .job-search-card__location');
            const linkEl = job.querySelector('a[href*="/jobs/view"]');
            const href = linkEl?.href;
            const title = titleEl?.textContent?.trim();

            if (!title || !href) return null;
            return {
              title,
              company: companyEl?.textContent?.trim() || 'Company',
              location: locationEl?.textContent?.trim() || '',
              link: href.split('?')[0],
              source: 'LinkedIn',
            };
          })
          .filter(Boolean)
          .slice(0, 20);
      });

      console.log(`Found ${jobs.length} jobs on LinkedIn`);
      return jobs;
    } catch (err) {
      console.error('LinkedIn job search failed:', err.message);
      return [];
    }
  }

  async clickButtonByText(keywords) {
    return this.page.evaluate((buttonKeywords) => {
      const elements = Array.from(document.querySelectorAll('button, a'));
      const target = elements.find((element) => {
        const text = `${element.textContent || ''} ${element.getAttribute('aria-label') || ''}`.toLowerCase();
        return buttonKeywords.some((keyword) => text.includes(keyword));
      });

      if (target) {
        target.click();
        return true;
      }
      return false;
    }, keywords);
  }

  async applyToJob(jobUrl) {
    try {
      const page = await this.ensurePage();
      await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await delay(2500);

      const easyApplyClicked = await this.clickButtonByText(['easy apply']);
      if (!easyApplyClicked) {
        return { success: false, message: 'Easy Apply is not available for this job' };
      }

      await delay(1500);
      await this.clickButtonByText(['next', 'review']);
      await delay(1000);
      const submitted = await this.clickButtonByText(['submit application']);
      await delay(1000);

      return {
        success: submitted,
        message: submitted ? 'Application submitted' : 'Application opened for review',
      };
    } catch (err) {
      console.error('Failed to apply to LinkedIn job:', err.message);
      return { success: false, message: err.message };
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      console.log('LinkedIn browser closed');
    }
  }
}

module.exports = LinkedInAutomation;
