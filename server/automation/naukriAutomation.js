const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class NaukriAutomation {
  constructor(resumePath = null) {
    this.browser = null;
    this.page = null;
    this.resumePath = resumePath;
    this.resumeData = null;
  }

  // Extract text data from resume file
  async loadResumeData() {
    try {
      if (!this.resumePath || !fs.existsSync(this.resumePath)) {
        console.warn('⚠️ Resume file not found');
        return null;
      }

      const resumeText = fs.readFileSync(this.resumePath, 'utf-8');
      
      // Extract name (first line usually contains name)
      const nameMatch = resumeText.match(/^(.+?)(?:\n|$)/);
      const name = nameMatch ? nameMatch[1].trim() : 'Job Seeker';

      // Extract email
      const emailMatch = resumeText.match(/[\w\.-]+@[\w\.-]+\.\w+/);
      const email = emailMatch ? emailMatch[0] : '';

      // Extract phone
      const phoneMatch = resumeText.match(/(?:\+91|\+\d{1,3}|0)?[\s-]?\d{10}/);
      const phone = phoneMatch ? phoneMatch[0].replace(/\s/g, '') : '';

      this.resumeData = {
        name,
        email,
        phone,
        filePath: this.resumePath,
        fileName: path.basename(this.resumePath)
      };

      console.log(`✅ Resume data loaded:`, this.resumeData);
      return this.resumeData;
    } catch (err) {
      console.error('❌ Failed to load resume data:', err.message);
      return null;
    }
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
      
      // Load resume data on launch
      await this.loadResumeData();
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

      // First, try to fill any visible forms with resume data
      if (this.resumeData) {
        await this.fillApplicationForm();
      }

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
            
            // Wait for modal or form to appear
            await this.page.waitForTimeout(1500);

            // Fill any forms that appear in modal
            if (this.resumeData) {
              await this.fillApplicationForm();
            }

            break;
          } catch (e) {
            console.log('⚠️ Could not click button, trying next');
          }
        }
      }

      if (!applyClicked) {
        console.warn('⚠️ Apply button not found');
      }

      await this.page.waitForTimeout(1500);

      // Try to upload resume if file input exists
      if (this.resumeData && this.resumeData.filePath) {
        const fileInputs = await this.page.$$('input[type="file"]');
        if (fileInputs.length > 0) {
          console.log('📄 Uploading resume...');
          try {
            // Set file input value
            await fileInputs[0].uploadFile(this.resumeData.filePath);
            console.log('✅ Resume uploaded');
            await this.page.waitForTimeout(1000);
          } catch (err) {
            console.warn('⚠️ Could not upload resume:', err.message);
          }
        }
      }

      // Try to submit any form that appears
      const submitButton = await this.page.$('button[type="submit"]');
      if (submitButton) {
        try {
          await submitButton.click();
          console.log('✅ Form submitted');
          await this.page.waitForTimeout(2000);
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

  // Fill application form with resume data
  async fillApplicationForm() {
    try {
      console.log('📝 Filling application form with resume data...');
      
      const formFilled = await this.page.evaluate((resumeData) => {
        let fieldsFilled = 0;

        // Fill name field
        const nameFields = document.querySelectorAll(
          'input[placeholder*="Name" i], input[placeholder*="Full Name" i], ' +
          'input[name*="name" i], input[name*="fullName" i], ' +
          'input[aria-label*="name" i]'
        );
        nameFields.forEach(field => {
          if (field.value === '') {
            field.value = resumeData.name;
            field.dispatchEvent(new Event('input', { bubbles: true }));
            field.dispatchEvent(new Event('change', { bubbles: true }));
            fieldsFilled++;
          }
        });

        // Fill email field
        const emailFields = document.querySelectorAll(
          'input[type="email"], input[placeholder*="Email" i], ' +
          'input[name*="email" i], input[aria-label*="email" i]'
        );
        emailFields.forEach(field => {
          if (field.value === '') {
            field.value = resumeData.email;
            field.dispatchEvent(new Event('input', { bubbles: true }));
            field.dispatchEvent(new Event('change', { bubbles: true }));
            fieldsFilled++;
          }
        });

        // Fill phone field
        const phoneFields = document.querySelectorAll(
          'input[placeholder*="Phone" i], input[placeholder*="Mobile" i], ' +
          'input[name*="phone" i], input[name*="mobile" i], ' +
          'input[aria-label*="phone" i], input[aria-label*="mobile" i]'
        );
        phoneFields.forEach(field => {
          if (field.value === '') {
            field.value = resumeData.phone;
            field.dispatchEvent(new Event('input', { bubbles: true }));
            field.dispatchEvent(new Event('change', { bubbles: true }));
            fieldsFilled++;
          }
        });

        return fieldsFilled;
      }, this.resumeData);

      console.log(`✅ Filled ${formFilled} form fields`);
    } catch (err) {
      console.warn('⚠️ Could not fill form:', err.message);
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
