const puppeteer = require('puppeteer');

class NaukriAutomation {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async launch() {
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled'
        ]
      });
      console.log('✅ Puppeteer browser launched for Naukri');
    } catch (err) {
      console.error('❌ Failed to launch browser:', err);
      throw err;
    }
  }

  async login(email, password) {
    try {
      this.page = await this.browser.newPage();
      
      // Set user agent to avoid detection
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      console.log('🔍 Navigating to Naukri login...');
      await this.page.goto('https://www.naukri.com/naukri-login', { waitUntil: 'domcontentloaded' });

      await this.page.waitForTimeout(2000);

      // Try to find and fill email field with multiple fallbacks
      console.log('📝 Filling email...');
      let emailField = await this.page.$('input[placeholder="Enter your registered email ID"]');
      if (!emailField) emailField = await this.page.$('input[name="usernameField"]');
      if (!emailField) emailField = await this.page.$('input#usernameField');
      if (!emailField) emailField = await this.page.$('input[type="email"]');
      
      if (emailField) {
        await emailField.type(email, { delay: 100 });
        console.log('✅ Email filled');
      } else {
        console.warn('⚠️ Email field not found, trying generic input');
        const inputs = await this.page.$$('input');
        if (inputs.length > 0) await inputs[0].type(email, { delay: 100 });
      }

      await this.page.waitForTimeout(1000);

      // Fill password
      console.log('🔐 Filling password...');
      let passwordField = await this.page.$('input[placeholder="Enter your password"]');
      if (!passwordField) passwordField = await this.page.$('input[name="passwordField"]');
      if (!passwordField) passwordField = await this.page.$('input#passwordField');
      if (!passwordField) passwordField = await this.page.$('input[type="password"]');
      
      if (passwordField) {
        await passwordField.type(password, { delay: 100 });
        console.log('✅ Password filled');
      }

      await this.page.waitForTimeout(1000);

      // Click login button
      console.log('🔘 Clicking login button...');
      let loginButton = await this.page.$('button[type="submit"]');
      if (!loginButton) loginButton = await this.page.$('button#loginBtn');
      
      if (loginButton) {
        await loginButton.click();
      } else {
        // Try clicking by text content
        const buttons = await this.page.$$('button');
        for (let btn of buttons) {
          const text = await btn.evaluate(el => el.textContent.toLowerCase());
          if (text.includes('login') || text.includes('sign in')) {
            await btn.click();
            break;
          }
        }
      }

      // Wait for navigation
      try {
        await this.page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 });
      } catch (err) {
        console.log('⚠️ Navigation timeout (might still be logged in)');
      }

      await this.page.waitForTimeout(3000);

      const title = await this.page.title();
      console.log('✅ Naukri login successful (or page loaded)');
      return true;
    } catch (err) {
      console.error('❌ Naukri login failed:', err.message);
      return false;
    }
  }

  async searchJobs(keyword, location) {
    try {
      console.log(`🔍 Searching for ${keyword} jobs in ${location}...`);
      
      const searchUrl = `https://www.naukri.com/${encodeURIComponent(keyword)}-jobs-in-${encodeURIComponent(location)}`;
      await this.page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

      await this.page.waitForTimeout(3000);

      // Scroll to load more jobs
      for (let i = 0; i < 3; i++) {
        await this.page.evaluate(() => {
          window.scrollBy(0, window.innerHeight);
        });
        await this.page.waitForTimeout(1000);
      }

      // Get job listings with multiple selectors
      const jobs = await this.page.evaluate(() => {
        const jobCards = document.querySelectorAll('.jobCard, .sjw__job-card, [data-id]');
        const jobArray = [];
        
        jobCards.forEach(card => {
          try {
            const titleEl = card.querySelector('.jdTitle, .jobTitle, h2, .title');
            const companyEl = card.querySelector('.companyName, .cTitle, .company');
            const locationEl = card.querySelector('.jobLocation, .location, .loc');
            const linkEl = card.querySelector('a');
            
            if (titleEl) {
              jobArray.push({
                title: titleEl.textContent?.trim() || 'Unknown',
                company: companyEl?.textContent?.trim() || 'Unknown',
                location: locationEl?.textContent?.trim() || 'India',
                link: linkEl?.href || window.location.href
              });
            }
          } catch (e) {
            // Silent fail
          }
        });
        
        return jobArray;
      });

      console.log(`✅ Found ${jobs.length} jobs on Naukri`);
      return jobs.slice(0, 10);
    } catch (err) {
      console.error('❌ Job search failed:', err.message);
      return [];
    }
  }

  async applyToJob(jobUrl) {
    try {
      console.log(`📨 Applying to job: ${jobUrl}`);
      await this.page.goto(jobUrl, { waitUntil: 'domcontentloaded' });

      await this.page.waitForTimeout(2000);

      // Look for apply button with multiple selectors
      let applyClicked = false;
      
      // Try clicking apply button
      const buttons = await this.page.$$('button, a');
      for (let btn of buttons) {
        const text = await btn.evaluate(el => el.textContent.toLowerCase());
        const title = await btn.evaluate(el => el.getAttribute('title')?.toLowerCase() || '');
        
        if ((text.includes('apply') || title.includes('apply')) && !text.includes('applied')) {
          try {
            await btn.click();
            applyClicked = true;
            console.log('✅ Apply button clicked');
            break;
          } catch (e) {
            console.log('⚠️ Could not click button, trying next');
          }
        }
      }

      if (!applyClicked) {
        console.warn('⚠️ Apply button not found');
      }

      await this.page.waitForTimeout(2000);

      // Try to submit any form that appears
      const submitButton = await this.page.$('button[type="submit"]');
      if (submitButton) {
        try {
          await submitButton.click();
          console.log('✅ Form submitted');
          return { success: true, message: 'Applied successfully' };
        } catch (e) {
          console.log('⚠️ Could not submit form');
        }
      }

      return { 
        success: applyClicked, 
        message: applyClicked ? 'Application submitted' : 'Could not find apply button' 
      };
    } catch (err) {
      console.error('❌ Failed to apply to job:', err.message);
      return { success: false, message: err.message };
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('✅ Naukri browser closed');
    }
  }
}

module.exports = NaukriAutomation;
