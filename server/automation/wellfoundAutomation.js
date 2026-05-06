const puppeteer = require('puppeteer');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class WellfoundAutomation {
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
      console.log('Puppeteer browser launched for Wellfound');
    } catch (err) {
      console.error('Failed to launch Wellfound browser:', err);
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

  async openManualLogin(startUrl = 'https://wellfound.com/login') {
    const page = await this.ensurePage();
    await page.goto(startUrl || 'https://wellfound.com/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(1000);
    return true;
  }

  async login(email, password) {
    try {
      const page = await this.ensurePage();
      await page.goto('https://wellfound.com/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
      await delay(1000);

      const emailField = await page.$('input[type="email"], input[name="email"]');
      if (emailField) await emailField.type(email, { delay: 50 });

      const passwordField = await page.$('input[type="password"], input[name="password"]');
      if (passwordField) await passwordField.type(password, { delay: 50 });

      const submit = await page.$('button[type="submit"]');
      if (submit) await submit.click();
      await delay(5000);

      console.log('Wellfound login submitted');
      return !/login/i.test(page.url());
    } catch (err) {
      console.error('Wellfound login failed:', err.message);
      return false;
    }
  }

  async searchJobs(keyword, location) {
    try {
      const page = await this.ensurePage();
      const searchUrl = `https://wellfound.com/jobs?query=${encodeURIComponent(keyword)}&location=${encodeURIComponent(
        location
      )}`;
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await delay(3000);

      for (let i = 0; i < 4; i += 1) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await delay(800);
      }

      const jobs = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('[data-testid="job-card"], div[class*="job"], article'));
        return cards
          .map((job) => {
            const titleEl = job.querySelector('[data-testid="job-title"], a[href*="/jobs/"], h2, h3');
            const companyEl = job.querySelector('[data-testid="company-name"], [class*="company"]');
            const locationEl = job.querySelector('[data-testid="job-location"], [class*="location"]');
            const linkEl = job.querySelector('a[href*="/jobs/"]');
            const href = linkEl?.href;
            const title = titleEl?.textContent?.trim();

            if (!title || !href) return null;
            return {
              title,
              company: companyEl?.textContent?.trim() || 'Company',
              location: locationEl?.textContent?.trim() || '',
              link: href,
              source: 'Wellfound',
            };
          })
          .filter(Boolean)
          .slice(0, 20);
      });

      console.log(`Found ${jobs.length} jobs on Wellfound`);
      return jobs;
    } catch (err) {
      console.error('Wellfound job search failed:', err.message);
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

      const applyClicked = await this.clickButtonByText(['apply now', 'apply']);
      await delay(1500);
      const submitted = await this.clickButtonByText(['submit', 'send application']);
      await delay(1000);

      return {
        success: applyClicked,
        message: submitted ? 'Application submitted' : 'Application started',
      };
    } catch (err) {
      console.error('Failed to apply to Wellfound job:', err.message);
      return { success: false, message: err.message };
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      console.log('Wellfound browser closed');
    }
  }
}

module.exports = WellfoundAutomation;
