const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const DEFAULT_START_URL = 'https://www.naukri.com/myapply/historypage?src=gnbOpportunities';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class NaukriAutomation {
  constructor(resumePath = null, options = {}) {
    this.browser = null;
    this.page = null;
    this.resumePath = resumePath;
    this.resumeData = null;
    this.personalDetails = options.personalDetails || {};
    this.options = options;
  }

  static get DEFAULT_START_URL() {
    return DEFAULT_START_URL;
  }

  readResumeText() {
    if (!this.resumePath || !fs.existsSync(this.resumePath)) {
      return '';
    }

    const buffer = fs.readFileSync(this.resumePath);
    const text = buffer.toString('utf8');
    const printableText = text.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ');

    return printableText
      .replace(/\s+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .trim();
  }

  async extractResumeWithGroq(resumeText) {
    if (!process.env.GROQ_API_KEY || !resumeText) return null;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
          temperature: 0.1,
          messages: [
            {
              role: 'system',
              content:
                'Extract job application fields from resume text. Return only compact JSON with keys: name, email, phone, summary.',
            },
            {
              role: 'user',
              content: resumeText.slice(0, 6000),
            },
          ],
        }),
      });

      if (!response.ok) {
        console.warn('Groq resume extraction failed:', response.status);
        return null;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (err) {
      console.warn('Groq resume extraction skipped:', err.message);
      return null;
    }
  }

  async loadResumeData() {
    try {
      if (!this.resumePath || !fs.existsSync(this.resumePath)) {
        console.warn('Resume file not found. Form filling will use safe defaults.');
      }

      const resumeText = this.readResumeText();
      const groqData = await this.extractResumeWithGroq(resumeText);
      const emailMatch = resumeText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
      const phoneMatch = resumeText.match(/(?:\+91[-\s]?)?(?:\d[-\s]?){10,12}/);
      const firstUsefulLine = resumeText
        .split(/[.|]/)
        .map((line) => line.trim())
        .find((line) => line.length >= 3 && line.length <= 60 && !line.includes('@') && !/\d{6,}/.test(line));

      this.resumeData = {
        name: groqData?.name || firstUsefulLine || 'Job Seeker',
        email: groqData?.email || (emailMatch ? emailMatch[0] : ''),
        phone: groqData?.phone || (phoneMatch ? phoneMatch[0].replace(/[^\d+]/g, '') : ''),
        summary: groqData?.summary || resumeText.slice(0, 600),
        filePath: this.resumePath,
        fileName: this.resumePath ? path.basename(this.resumePath) : '',
      };

      console.log('Resume data loaded for browser automation');
      return this.resumeData;
    } catch (err) {
      console.error('Failed to load resume data:', err.message);
      return null;
    }
  }

  async launch() {
    try {
      this.browser = await puppeteer.launch({
        headless: this.options.headless ?? 'new',
        defaultViewport: this.options.headless === false ? null : undefined,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled',
          '--start-maximized',
        ],
      });
      console.log('Puppeteer browser launched for Naukri');
      await this.loadResumeData();
    } catch (err) {
      console.error('Failed to launch browser:', err);
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

  async openManualLogin(startUrl = DEFAULT_START_URL) {
    const page = await this.ensurePage();
    const targetUrl = startUrl || DEFAULT_START_URL;
    console.log(`Opening Naukri browser at ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(1000);
    return true;
  }

  async login(email, password) {
    try {
      const page = await this.ensurePage();
      console.log('Navigating to Naukri login...');
      await page.goto('https://www.naukri.com/naukri-login', { waitUntil: 'domcontentloaded', timeout: 60000 });

      await delay(1500);

      const emailSelector = await this.firstExistingSelector([
        'input[placeholder="Enter your registered email ID"]',
        'input[name="usernameField"]',
        'input#usernameField',
        'input[type="email"]',
        'input[type="text"]',
      ]);
      if (emailSelector) {
        await page.click(emailSelector, { clickCount: 3 });
        await page.type(emailSelector, email, { delay: 80 });
      }

      const passwordSelector = await this.firstExistingSelector([
        'input[placeholder="Enter your password"]',
        'input[name="passwordField"]',
        'input#passwordField',
        'input[type="password"]',
      ]);
      if (passwordSelector) {
        await page.click(passwordSelector, { clickCount: 3 });
        await page.type(passwordSelector, password, { delay: 80 });
      }

      await delay(500);
      const clicked = await this.clickButtonByText(['login', 'sign in']);
      if (!clicked) {
        const submit = await page.$('button[type="submit"]');
        if (submit) await submit.click();
      }

      await delay(5000);
      console.log('Naukri login submitted');
      return !(await this.isOnLoginPage());
    } catch (err) {
      console.error('Naukri login failed:', err.message);
      return false;
    }
  }

  async isOnLoginPage() {
    const url = this.page?.url() || '';
    return /login/i.test(url);
  }

  async firstExistingSelector(selectors) {
    for (const selector of selectors) {
      const element = await this.page.$(selector);
      if (element) return selector;
    }
    return null;
  }

  buildSearchUrl(keyword, location) {
    const slug = (value) =>
      String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return `https://www.naukri.com/${slug(keyword)}-jobs-in-${slug(location)}`;
  }

  async searchJobs(keyword, location) {
    try {
      const page = await this.ensurePage();
      const searchUrl = this.buildSearchUrl(keyword, location);
      console.log(`[SearchJobs] Searching Naukri: ${searchUrl}`);
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await delay(3000);

      for (let i = 0; i < 4; i += 1) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await delay(800);
      }

      const jobs = await page.evaluate(() => {
        const selectors = [
          '.srp-jobtuple-wrapper',
          '.cust-job-tuple',
          '.jobTuple',
          '.sjw__job-card',
          'article',
          '[data-job-id]',
        ];
        const cards = selectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)));
        const uniqueCards = Array.from(new Set(cards));

        return uniqueCards
          .map((card) => {
            const titleEl = card.querySelector('a.title, .title, .jd-card-head-title, h2 a, h2');
            const companyEl = card.querySelector('.comp-name, .companyName, .company, .cTitle');
            const locationEl = card.querySelector('.locWdth, .jobCardLocation, .location, .loc');
            
            // Try multiple selectors for link to ensure we get a valid URL
            let linkEl = card.querySelector('a[href*="/job-listings"], a[href*="naukri.com"]');
            if (!linkEl) {
              linkEl = card.querySelector('a[href^="https://"]');
            }
            if (!linkEl) {
              linkEl = card.querySelector('a');
            }
            
            const title = titleEl?.textContent?.trim();
            let link = linkEl?.href;
            
            // Only include if link is valid Naukri URL
            if (!title || !link) return null;
            
            // Ensure link is properly formatted
            if (!link.startsWith('http')) {
              link = 'https://www.naukri.com' + link;
            }

            if (!link.includes('naukri.com')) return null;

            return {
              title,
              company: companyEl?.textContent?.trim() || 'Company',
              location: locationEl?.textContent?.trim() || 'India',
              link,
              source: 'Naukri',
            };
          })
          .filter(Boolean)
          .slice(0, 30);
      });

      console.log(`[SearchJobs] Found ${jobs?.length || 0} job cards extracted`);
      
      if (!Array.isArray(jobs) || jobs.length === 0) {
        console.warn('[SearchJobs] No jobs found with current selectors');
        return [];
      }

      return jobs;
    } catch (err) {
      console.error('Naukri job search failed:', err.message);
      return [];
    }
  }

  async checkHasDirectApply(jobUrl) {
    try {
      const tempPage = await this.browser.newPage();
      await tempPage.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121 Safari/537.36'
      );
      
      console.log(`[CheckDirectApply] Checking: ${jobUrl}`);
      
      await tempPage.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await delay(1000);

      // Check if there's a direct apply button on Naukri
      const hasApplyButton = await tempPage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a, input[type="button"]'));
        return buttons.some((btn) => {
          const text = `${btn.textContent || ''} ${btn.value || ''} ${btn.getAttribute('aria-label') || ''}`.toLowerCase();
          return text.includes('apply') || text.includes('interested');
        });
      });

      // Check if URL is still on Naukri (not redirected to external)
      const currentUrl = tempPage.url();
      const isStillOnNaukri = currentUrl.includes('naukri.com');

      console.log(`[CheckDirectApply] Has button: ${hasApplyButton}, On Naukri: ${isStillOnNaukri}, URL: ${currentUrl}`);

      await tempPage.close();

      // Return true if we have an apply button (whether on Naukri or external redirect)
      // External redirects are handled by fillExternalCompanyForm()
      return hasApplyButton;
    } catch (err) {
      console.warn(`[CheckDirectApply] Error checking ${jobUrl}:`, err.message);
      // Default to true to not filter out jobs on error
      return true;
    }
  }

  async clickButtonByText(keywords, retries = 1) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      const clicked = await this.page.evaluate((buttonKeywords) => {
        const elements = Array.from(document.querySelectorAll('button, a, input[type="button"], input[type="submit"], [role="button"]'));
        
        // Try exact matches first
        let target = elements.find((element) => {
          const text = `${element.textContent || ''} ${element.value || ''} ${element.getAttribute('aria-label') || ''} ${
            element.getAttribute('title') || ''
          }`.toLowerCase().trim();
          return buttonKeywords.some((keyword) => text === keyword);
        });

        // If no exact match, try partial matches
        if (!target) {
          target = elements.find((element) => {
            const text = `${element.textContent || ''} ${element.value || ''} ${element.getAttribute('aria-label') || ''} ${
              element.getAttribute('title') || ''
            }`.toLowerCase();
            return buttonKeywords.some((keyword) => text.includes(keyword));
          });
        }

        if (target) {
          // Check if element is visible and enabled
          const rect = target.getBoundingClientRect();
          const isVisible = rect.width > 0 && rect.height > 0;
          
          if (isVisible) {
            target.click();
            return true;
          }
        }
        return false;
      }, keywords);

      if (clicked) {
        console.log(`Successfully clicked button with keywords: ${keywords.join(', ')}`);
        return true;
      }

      if (attempt < retries) {
        console.log(`Retry ${attempt}/${retries} for clicking button: ${keywords.join(', ')}`);
        await delay(500);
      }
    }
    
    console.warn(`Failed to click button after ${retries} attempts: ${keywords.join(', ')}`);
    return false;
  }

  async applyToJob(jobUrl) {
    try {
      const page = await this.ensurePage();
      console.log(`[ApplyToJob] Navigating to: ${jobUrl}`);
      
      // Use 'domcontentloaded' instead of 'networkidle2' to avoid hanging on heavy JS sites like Naukri
      try {
        await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      } catch (navErr) {
        console.warn('[ApplyToJob] Navigation timeout, attempting with load event:', navErr.message);
        try {
          await page.goto(jobUrl, { waitUntil: 'load', timeout: 20000 });
        } catch (retryErr) {
          console.warn('[ApplyToJob] Navigation failed even with load event:', retryErr.message);
          return { success: false, message: 'Failed to navigate to job page' };
        }
      }
      
      await delay(1500);

      // Wait for the page to fully load - check for apply button with timeout
      let applyButtonFound = false;
      try {
        await page.waitForFunction(
          () => {
            const buttons = Array.from(document.querySelectorAll('button, a, input[type="button"]'));
            return buttons.some((btn) => {
              const text = `${btn.textContent || ''} ${btn.value || ''} ${btn.getAttribute('aria-label') || ''}`.toLowerCase();
              return text.includes('apply') || text.includes('interested');
            });
          },
          { timeout: 3000 }
        );
        applyButtonFound = true;
      } catch (err) {
        console.warn('[ApplyToJob] Apply button not found within timeout, continuing with form fill');
      }

      // Fill form if resume data exists
      if (this.resumeData) {
        console.log('[ApplyToJob] Filling application form with resume data');
        await this.fillApplicationForm();
      }

      // Verify page is still connected before clicking
      if (!this.page) {
        return { success: false, message: 'Page connection lost' };
      }

      // Click apply button with retry
      console.log('[ApplyToJob] Attempting to click apply button');
      const applyClicked = await this.clickButtonByText(['apply', 'i am interested'], 2);
      if (!applyClicked) {
        console.warn('[ApplyToJob] Apply button not found on this job page');
        return { success: false, message: 'Apply button not found on this job page' };
      }

      console.log('[ApplyToJob] Apply button clicked successfully');
      await delay(2000);

      // Check for error messages
      const errorMessage = await page.evaluate(() => {
        const errorElements = document.querySelectorAll(
          '[class*="error"], [class*="warning"], .alert, [role="alert"], .toast, [class*="toast"]'
        );
        for (const el of errorElements) {
          const text = el.textContent?.toLowerCase() || '';
          if (text.includes('cannot') || text.includes('error') || text.includes('failed') || text.includes('try later')) {
            return el.textContent?.trim();
          }
        }
        return null;
      });

      if (errorMessage) {
        console.error('[ApplyToJob] Error after apply click:', errorMessage);
        return { success: false, message: `Error: ${errorMessage}` };
      }

      // Fill form again if needed
      if (this.resumeData) {
        console.log('[ApplyToJob] Filling form again if needed');
        await this.fillApplicationForm();
        await this.uploadResumeIfRequested();
      }

      // Try to submit the form with retry
      console.log('[ApplyToJob] Attempting to submit the form');
      const submitted = await this.clickButtonByText(['submit', 'send', 'apply now', 'continue'], 2);
      await delay(2000);

      // Final check for success or error
      const finalStatus = await page.evaluate(() => {
        // Check for success message
        const successElements = document.querySelectorAll('[class*="success"], [class*="confirm"], .toast, [class*="toast"]');
        for (const el of successElements) {
          const text = el.textContent?.toLowerCase() || '';
          if (text.includes('success') || text.includes('applied') || text.includes('submitted')) {
            return { type: 'success', message: el.textContent?.trim() };
          }
        }

        // Check for error message
        const errorElements = document.querySelectorAll('[class*="error"], [class*="warning"], .alert, [role="alert"]');
        for (const el of errorElements) {
          const text = el.textContent?.toLowerCase() || '';
          if (text.includes('cannot') || text.includes('error') || text.includes('failed') || text.includes('try later')) {
            return { type: 'error', message: el.textContent?.trim() };
          }
        }

        return { type: 'unknown' };
      });

      if (finalStatus.type === 'error') {
        console.error('[ApplyToJob] Final status error:', finalStatus.message);
        return { success: false, message: finalStatus.message || 'Application failed' };
      }

      // Consider it success if we clicked the apply button (either with or without success confirmation)
      const isSuccess = applyClicked;
      console.log(`✅ [ApplyToJob] Application processed - Success: ${isSuccess}, FormSubmitted: ${submitted}`);
      
      return {
        success: isSuccess,
        message: submitted ? 'Application submitted successfully' : 'Application initiated',
      };
    } catch (err) {
      console.error('[ApplyToJob] Exception:', err.message);
      return { success: false, message: `Error: ${err.message}` };
    }
  }

  async fillExternalCompanyForm() {
    try {
      const personalData = this.personalDetails;
      if (!personalData || !personalData.fullName) return;

      const fieldsFilled = await this.page.evaluate((data) => {
        let count = 0;
        const setValue = (field, value) => {
          if (!field || !value) return;
          
          // Try different methods to set value
          field.focus();
          field.value = value;
          field.dispatchEvent(new Event('input', { bubbles: true }));
          field.dispatchEvent(new Event('change', { bubbles: true }));
          field.dispatchEvent(new Event('blur', { bubbles: true }));
          count += 1;
        };

        // Fill name fields
        document
          .querySelectorAll(
            'input[type="text"][placeholder*="name" i], input[type="text"][name*="name" i], ' +
            'input[type="text"][id*="name" i], input[placeholder*="full name" i]'
          )
          .forEach((field) => {
            if (!field.value) setValue(field, data.fullName);
          });

        // Fill email fields
        document
          .querySelectorAll(
            'input[type="email"], input[type="text"][placeholder*="email" i], ' +
            'input[type="text"][name*="email" i], input[placeholder*="e-mail" i]'
          )
          .forEach((field) => {
            if (!field.value) setValue(field, data.email);
          });

        // Fill phone fields
        document
          .querySelectorAll(
            'input[type="tel"], input[type="text"][placeholder*="phone" i], ' +
            'input[type="text"][placeholder*="mobile" i], input[name*="phone" i], ' +
            'input[name*="mobile" i]'
          )
          .forEach((field) => {
            if (!field.value) setValue(field, data.phone);
          });

        // Try to find and fill textarea for cover letter/message
        document.querySelectorAll('textarea').forEach((field) => {
          if (!field.value) {
            setValue(field, 'I am interested in this opportunity and believe my experience aligns well with your requirements.');
          }
        });

        return count;
      }, personalData);

      if (fieldsFilled > 0) {
        console.log(`Filled ${fieldsFilled} fields on external company form`);
      }
    } catch (err) {
      console.warn('Could not fill external company form:', err.message);
    }
  }

  async uploadResumeIfRequested() {
    if (!this.resumeData?.filePath || !fs.existsSync(this.resumeData.filePath)) return;

    const fileInputs = await this.page.$$('input[type="file"]');
    if (fileInputs.length === 0) return;

    try {
      await fileInputs[0].uploadFile(this.resumeData.filePath);
      console.log('Resume uploaded to Naukri form');
      await delay(1000);
    } catch (err) {
      console.warn('Could not upload resume:', err.message);
    }
  }

  async fillApplicationForm() {
    try {
      const resumeData = this.resumeData;
      if (!resumeData) return;

      // Wait a bit for the form to fully render
      await delay(800);

      const fieldsFilled = await this.page.evaluate((data) => {
        let count = 0;
        const setValue = (field, value) => {
          if (!field || !value) return;
          
          // Skip if field already has value (user data might be pre-filled)
          if (field.value && field.value.length > 0) return;
          
          try {
            field.focus();
            field.value = value;
            field.dispatchEvent(new Event('input', { bubbles: true }));
            field.dispatchEvent(new Event('change', { bubbles: true }));
            field.dispatchEvent(new Event('blur', { bubbles: true }));
            count += 1;
          } catch (e) {
            // Field might be readonly or have issues, skip it
          }
        };

        document
          .querySelectorAll('input[placeholder*="name" i], input[name*="name" i], input[aria-label*="name" i]')
          .forEach((field) => setValue(field, data.name));

        document
          .querySelectorAll('input[type="email"], input[placeholder*="email" i], input[name*="email" i]')
          .forEach((field) => setValue(field, data.email));

        document
          .querySelectorAll(
            'input[placeholder*="phone" i], input[placeholder*="mobile" i], input[name*="phone" i], input[name*="mobile" i]'
          )
          .forEach((field) => setValue(field, data.phone));

        document
          .querySelectorAll('textarea[placeholder*="cover" i], textarea[name*="cover" i], textarea')
          .forEach((field) =>
            setValue(
              field,
              data.summary ||
                'I am interested in this opportunity and believe my experience is aligned with the role requirements.'
            )
          );

        return count;
      }, resumeData);

      if (fieldsFilled > 0) {
        console.log(`Filled ${fieldsFilled} Naukri form fields`);
      }
    } catch (err) {
      console.warn('Could not fill Naukri form:', err.message);
    }
  }

  async getAppliedJobs() {
    try {
      const page = await this.ensurePage();
      console.log('Fetching applied jobs from Naukri history...');
      
      await page.goto(DEFAULT_START_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await delay(3000);

      // Scroll to load all jobs
      for (let i = 0; i < 5; i += 1) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await delay(800);
      }

      const appliedJobs = await page.evaluate(() => {
        const jobs = [];
        const cards = document.querySelectorAll('[data-job-id], .app-card, .appliedCard, article, .job-row');
        
        cards.forEach((card) => {
          // Try various selectors for job title
          const titleEl = card.querySelector(
            'a.title, .title, .jd-card-head-title, h2 a, h2, .job-title, [class*="title"]'
          );
          
          // Try various selectors for company name
          const companyEl = card.querySelector(
            '.comp-name, .companyName, .company, .cTitle, .org-name, [class*="company"], [class*="org"]'
          );
          
          // Try various selectors for location
          const locationEl = card.querySelector(
            '.locWdth, .jobCardLocation, .location, .loc, [class*="location"]'
          );
          
          // Get job link
          const linkEl = card.querySelector('a[href*="/job-listings"], a[href*="naukri.com"]');
          
          const title = titleEl?.textContent?.trim();
          const company = companyEl?.textContent?.trim() || 'Company';
          const location = locationEl?.textContent?.trim() || 'India';
          const link = linkEl?.href;
          
          if (title && link) {
            jobs.push({ title, company, location, link });
          }
        });
        
        return jobs;
      });

      console.log(`Found ${appliedJobs.length} applied jobs from Naukri history`);
      return appliedJobs;
    } catch (err) {
      console.error('Failed to fetch applied jobs:', err.message);
      return [];
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      console.log('Naukri browser closed');
    }
  }
}

module.exports = NaukriAutomation;
