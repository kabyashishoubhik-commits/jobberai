const puppeteer = require('puppeteer');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class JobScraper {
  constructor() {
    this.browser = null;
  }

  async launch() {
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
  }

  async scrapeLinkedInJobs(keyword, location, limit = 10) {
    try {
      const page = await this.browser.newPage();
      const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}`;
      
      await page.goto(searchUrl, { waitUntil: 'networkidle2' });

      // Scroll to load more jobs
      for (let i = 0; i < 5; i++) {
        await page.evaluate(() => {
          window.scrollBy(0, window.innerHeight);
        });
        await delay(500);
      }

      const jobs = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.base-card')).slice(0, 10).map(job => ({
          title: job.querySelector('.base-search-card__title')?.textContent?.trim(),
          company: job.querySelector('.base-search-card__subtitle')?.textContent?.trim(),
          location: job.querySelector('.job-search-card__location')?.textContent?.trim(),
          link: job.querySelector('a')?.href,
          source: 'LinkedIn'
        }));
      });

      await page.close();
      return jobs;
    } catch (err) {
      console.error('Error scraping LinkedIn:', err);
      return [];
    }
  }

  async scrapeWellfoundJobs(keyword, location, limit = 10) {
    try {
      const page = await this.browser.newPage();
      const searchUrl = `https://wellfound.com/jobs?query=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}`;
      
      await page.goto(searchUrl, { waitUntil: 'networkidle2' });

      // Scroll to load more
      for (let i = 0; i < 5; i++) {
        await page.evaluate(() => {
          window.scrollBy(0, window.innerHeight);
        });
        await delay(500);
      }

      const jobs = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('[data-testid="job-card"]')).slice(0, 10).map(job => ({
          title: job.querySelector('[data-testid="job-title"]')?.textContent?.trim(),
          company: job.querySelector('[data-testid="company-name"]')?.textContent?.trim(),
          location: job.querySelector('[data-testid="job-location"]')?.textContent?.trim(),
          link: job.querySelector('a')?.href,
          source: 'Wellfound'
        }));
      });

      await page.close();
      return jobs;
    } catch (err) {
      console.error('Error scraping Wellfound:', err);
      return [];
    }
  }

  async scrapeNaukriJobs(keyword, location, limit = 10) {
    try {
      const page = await this.browser.newPage();
      const slug = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const searchUrl = `https://www.naukri.com/${slug(keyword)}-jobs-in-${slug(location)}`;
      
      await page.goto(searchUrl, { waitUntil: 'networkidle2' });

      // Scroll to load more
      for (let i = 0; i < 5; i++) {
        await page.evaluate(() => {
          window.scrollBy(0, window.innerHeight);
        });
        await delay(500);
      }

      const jobs = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.sjw__job-card')).slice(0, 10).map(job => ({
          title: job.querySelector('.jd-card-head-title')?.textContent?.trim(),
          company: job.querySelector('.companyName')?.textContent?.trim(),
          location: job.querySelector('.jobCardLocation')?.textContent?.trim(),
          link: job.querySelector('a')?.href,
          source: 'Naukri'
        }));
      });

      await page.close();
      return jobs;
    } catch (err) {
      console.error('Error scraping Naukri:', err);
      return [];
    }
  }

  async scrapeAllSources(keyword, location) {
    try {
      const [linkedinJobs, wellfoundJobs, naukriJobs] = await Promise.all([
        this.scrapeLinkedInJobs(keyword, location),
        this.scrapeWellfoundJobs(keyword, location),
        this.scrapeNaukriJobs(keyword, location),
      ]);

      return {
        linkedIn: linkedinJobs,
        wellfound: wellfoundJobs,
        naukri: naukriJobs,
        total: linkedinJobs.length + wellfoundJobs.length + naukriJobs.length
      };
    } catch (err) {
      console.error('Error scraping all sources:', err);
      return { linkedIn: [], wellfound: [], naukri: [], total: 0 };
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

module.exports = JobScraper;
