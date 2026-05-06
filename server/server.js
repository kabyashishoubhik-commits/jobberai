const express = require('express');
const cors = require('cors');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
require('dotenv').config();

const db = require('./db');
const AutomationManager = require('./automation/automationManager');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;
const GOOGLE_REDIRECT_URI = `${BACKEND_URL}/api/auth/google/callback`;

// Initialize Automation Manager
const automationManager = new AutomationManager(db);

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Auth Middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const issueAuthResponse = (res, user) => {
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
};

const ensureUserSettings = (userId) => {
  db.run(
    `INSERT OR IGNORE INTO settings (user_id, auto_apply_enabled, daily_limit) VALUES (?, 0, 5)`,
    [userId]
  );
};

const redirectToAuthCallback = (res, params) => {
  const search = new URLSearchParams(params);
  res.redirect(`${FRONTEND_URL}/auth/callback?${search.toString()}`);
};

// ============ AUTH ENDPOINTS ============

// Signup
app.post('/api/auth/signup', (req, res) => {
  const { name, password, confirmPassword } = req.body;
  const email = String(req.body.email || '').trim().toLowerCase();

  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const hashedPassword = bcryptjs.hashSync(password, 10);

  db.run(
    `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`,
    [name, email, hashedPassword],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Email already exists' });
        }
        return res.status(500).json({ error: 'Database error' });
      }

      ensureUserSettings(this.lastID);
      issueAuthResponse(res, { id: this.lastID, name, email });
    }
  );
});

// Login
app.post('/api/auth/login', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const { password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = bcryptjs.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    issueAuthResponse(res, user);
  });
});

// Forgot password
app.post('/api/auth/forgot-password', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const genericResponse = {
    message: 'If an account exists for that email, a reset link has been prepared.',
  };

  db.get('SELECT id FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.json(genericResponse);
    }

    const token = crypto.randomBytes(32).toString('hex');
    db.run(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES (?, ?, datetime('now', '+30 minutes'))`,
      [user.id, token],
      (insertErr) => {
        if (insertErr) {
          return res.status(500).json({ error: 'Could not create reset token' });
        }

        res.json({
          ...genericResponse,
          resetToken: process.env.NODE_ENV === 'development' ? token : undefined,
        });
      }
    );
  });
});

// Reset password
app.post('/api/auth/reset-password', (req, res) => {
  const { token, password, confirmPassword } = req.body;

  if (!token || !password || !confirmPassword) {
    return res.status(400).json({ error: 'Token, password, and confirmation are required' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  db.get(
    `SELECT * FROM password_reset_tokens
     WHERE token = ? AND used = 0 AND expires_at > datetime('now')`,
    [token],
    (err, resetToken) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!resetToken) {
        return res.status(400).json({ error: 'Reset link is invalid or expired' });
      }

      const hashedPassword = bcryptjs.hashSync(password, 10);
      db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, resetToken.user_id], (updateErr) => {
        if (updateErr) {
          return res.status(500).json({ error: 'Could not update password' });
        }

        db.run('UPDATE password_reset_tokens SET used = 1 WHERE id = ?', [resetToken.id]);
        res.json({ message: 'Password reset successfully' });
      });
    }
  );
});

// Google OAuth start
app.get('/api/auth/google/start', (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return redirectToAuthCallback(res, {
      error: 'Google OAuth is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local.',
    });
  }

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

// Google OAuth callback
app.get('/api/auth/google/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return redirectToAuthCallback(res, { error: String(error) });
  }

  if (!code) {
    return redirectToAuthCallback(res, { error: 'Google did not return an authorization code.' });
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: String(code),
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      return redirectToAuthCallback(res, { error: 'Google token exchange failed.' });
    }

    const tokenData = await tokenResponse.json();
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!profileResponse.ok) {
      return redirectToAuthCallback(res, { error: 'Could not fetch Google profile.' });
    }

    const profile = await profileResponse.json();
    const email = String(profile.email || '').trim().toLowerCase();
    const name = profile.name || email.split('@')[0] || 'Google User';

    if (!email) {
      return redirectToAuthCallback(res, { error: 'Google profile did not include an email address.' });
    }

    db.get('SELECT * FROM users WHERE email = ?', [email], (findErr, existingUser) => {
      if (findErr) {
        return redirectToAuthCallback(res, { error: 'Database error during Google sign-in.' });
      }

      if (existingUser) {
        const authToken = jwt.sign({ userId: existingUser.id }, JWT_SECRET, { expiresIn: '7d' });
        return redirectToAuthCallback(res, { token: authToken });
      }

      const randomPassword = bcryptjs.hashSync(crypto.randomBytes(32).toString('hex'), 10);
      db.run(
        `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`,
        [name, email, randomPassword],
        function(createErr) {
          if (createErr) {
            return redirectToAuthCallback(res, { error: 'Could not create Google user.' });
          }

          ensureUserSettings(this.lastID);
          const authToken = jwt.sign({ userId: this.lastID }, JWT_SECRET, { expiresIn: '7d' });
          return redirectToAuthCallback(res, { token: authToken });
        }
      );
    });
  } catch (err) {
    return redirectToAuthCallback(res, { error: `Google sign-in failed: ${err.message}` });
  }
});

// Get current user
app.get('/api/auth/me', authMiddleware, (req, res) => {
  db.get('SELECT id, name, email, resume_path FROM users WHERE id = ?', [req.userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(user);
  });
});

// ============ RESUME ENDPOINTS ============

// Upload resume
app.post('/api/resume/upload', authMiddleware, upload.single('resume'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const resumePath = `/uploads/${req.file.filename}`;

  db.run(
    'UPDATE users SET resume_path = ? WHERE id = ?',
    [resumePath, req.userId],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to save resume' });
      }
      res.json({
        message: 'Resume uploaded successfully',
        path: resumePath
      });
    }
  );
});

// Get user resume
app.get('/api/resume', authMiddleware, (req, res) => {
  db.get('SELECT resume_path FROM users WHERE id = ?', [req.userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ resumePath: user?.resume_path });
  });
});

// ============ JOBS ENDPOINTS ============

// Get all jobs
app.get('/api/jobs', (req, res) => {
  db.all('SELECT * FROM jobs LIMIT 20', (err, jobs) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(jobs);
  });
});

// Get jobs with filters
app.get('/api/jobs/search', (req, res) => {
  const { title, location, minSalary } = req.query;
  let query = 'SELECT * FROM jobs WHERE 1=1';
  let params = [];

  if (title) {
    query += ' AND title LIKE ?';
    params.push(`%${title}%`);
  }
  if (location) {
    query += ' AND location LIKE ?';
    params.push(`%${location}%`);
  }
  if (minSalary) {
    // Basic salary parsing - this is simplified
    query += ' AND salary LIKE ?';
    params.push(`%${minSalary}%`);
  }

  db.all(query + ' LIMIT 20', params, (err, jobs) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(jobs);
  });
});

// Get recommended jobs for user
app.get('/api/jobs/recommended', authMiddleware, (req, res) => {
  // Get latest jobs that user hasn't already applied to
  db.all(
    `SELECT j.* FROM jobs j
     WHERE j.id NOT IN (
       SELECT DISTINCT job_id FROM applications 
       WHERE user_id = ?
     )
     ORDER BY j.posted_date DESC 
     LIMIT 20`,
    [req.userId],
    (err, jobs) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(jobs);
    }
  );
});

// ============ APPLICATION ENDPOINTS ============

// Apply to job
app.post('/api/applications', authMiddleware, (req, res) => {
  const { jobId } = req.body;

  if (!jobId) {
    return res.status(400).json({ error: 'Job ID is required' });
  }

  db.run(
    'INSERT INTO applications (user_id, job_id, status) VALUES (?, ?, ?)',
    [req.userId, jobId, 'applied'],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Already applied to this job' });
        }
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Application submitted', applicationId: this.lastID });
    }
  );
});

// Get user applications
app.get('/api/applications', authMiddleware, (req, res) => {
  db.all(
    `SELECT a.*, j.title, j.company, j.location FROM applications a
     JOIN jobs j ON a.job_id = j.id
     WHERE a.user_id = ?
     ORDER BY a.applied_date DESC`,
    [req.userId],
    (err, applications) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(applications);
    }
  );
});

// ============ AUTO-APPLY SETTINGS ============

// Get auto-apply rules
app.get('/api/auto-apply/rules', authMiddleware, (req, res) => {
  db.all('SELECT * FROM auto_apply_rules WHERE user_id = ?', [req.userId], (err, rules) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rules);
  });
});

// Create auto-apply rule
app.post('/api/auto-apply/rules', authMiddleware, (req, res) => {
  const { titleKeywords, location, minSalary, maxSalary, remoteOnly } = req.body;

  db.run(
    `INSERT INTO auto_apply_rules (user_id, title_keywords, location, min_salary, max_salary, remote_only)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [req.userId, titleKeywords, location, minSalary, maxSalary, remoteOnly ? 1 : 0],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Rule created', ruleId: this.lastID });
    }
  );
});

// Get settings
app.get('/api/settings', authMiddleware, (req, res) => {
  db.get('SELECT * FROM settings WHERE user_id = ?', [req.userId], (err, settings) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!settings) {
      ensureUserSettings(req.userId);
      return res.json({ auto_apply_enabled: 0, daily_limit: 5 });
    }
    res.json(settings);
  });
});

// Update settings
app.put('/api/settings', authMiddleware, (req, res) => {
  const { autoApplyEnabled, dailyLimit } = req.body;

  db.run(
    'UPDATE settings SET auto_apply_enabled = ?, daily_limit = ? WHERE user_id = ?',
    [autoApplyEnabled ? 1 : 0, dailyLimit, req.userId],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Settings updated' });
    }
  );
});

// ============ ANALYTICS ENDPOINTS ============

// Get dashboard stats
app.get('/api/analytics/stats', authMiddleware, (req, res) => {
  db.get(
    `SELECT
      COUNT(CASE WHEN status = 'applied' THEN 1 END) as totalApplications,
      COUNT(CASE WHEN status = 'viewed' THEN 1 END) as viewedApplications,
      COUNT(CASE WHEN status = 'interview' THEN 1 END) as interviewCount,
      COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejectedCount
     FROM applications WHERE user_id = ?`,
    [req.userId],
    (err, stats) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(stats || { totalApplications: 0, viewedApplications: 0, interviewCount: 0, rejectedCount: 0 });
    }
  );
});

// ============ HELPER ENDPOINT ============

// Seed sample jobs (for testing)
app.post('/api/seed-jobs', (req, res) => {
  const sampleJobs = [
    {
      title: 'Senior Product Manager',
      company: 'Stripe',
      location: 'San Francisco, CA',
      salary: '$180K - $250K',
      description: 'Looking for an experienced Product Manager to lead our payment systems',
      url: 'https://stripe.com/careers/1'
    },
    {
      title: 'Full Stack Engineer',
      company: 'Vercel',
      location: 'Remote',
      salary: '$150K - $200K',
      description: 'Build scalable web applications with Next.js and Node.js',
      url: 'https://vercel.com/careers/2'
    },
    {
      title: 'Design System Lead',
      company: 'Figma',
      location: 'San Francisco, CA',
      salary: '$160K - $220K',
      description: 'Lead design system initiatives and mentorship',
      url: 'https://figma.com/careers/3'
    },
    {
      title: 'DevOps Engineer',
      company: 'AWS',
      location: 'Seattle, WA',
      salary: '$140K - $190K',
      description: 'Manage cloud infrastructure and CI/CD pipelines',
      url: 'https://aws.amazon.com/careers/4'
    },
    {
      title: 'Machine Learning Engineer',
      company: 'Google',
      location: 'Mountain View, CA',
      salary: '$170K - $230K',
      description: 'Work on cutting-edge AI/ML projects',
      url: 'https://google.com/careers/5'
    }
  ];

  sampleJobs.forEach(job => {
    db.run(
      `INSERT OR IGNORE INTO jobs (title, company, location, salary, description, url, posted_date)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      [job.title, job.company, job.location, job.salary, job.description, job.url]
    );
  });

  res.json({ message: 'Sample jobs seeded' });
});

// ============ BROWSER AUTOMATION ENDPOINTS ============

// Store user credentials for external sites
app.post('/api/automation/credentials', authMiddleware, (req, res) => {
  const { 
    linkedinEmail, linkedinPassword, wellfoundEmail, wellfoundPassword, naukriEmail, naukriPassword,
    fullName, contactEmail, phoneNumber 
  } = req.body;

  db.run(
    `INSERT INTO user_credentials 
     (user_id, linkedin_email, linkedin_password, wellfound_email, wellfound_password, naukri_email, naukri_password, full_name, contact_email, phone_number)
     VALUES (?, NULLIF(?, ''), NULLIF(?, ''), NULLIF(?, ''), NULLIF(?, ''), NULLIF(?, ''), NULLIF(?, ''), NULLIF(?, ''), NULLIF(?, ''), NULLIF(?, ''))
     ON CONFLICT(user_id) DO UPDATE SET
       linkedin_email = COALESCE(NULLIF(excluded.linkedin_email, ''), user_credentials.linkedin_email),
       linkedin_password = COALESCE(NULLIF(excluded.linkedin_password, ''), user_credentials.linkedin_password),
       wellfound_email = COALESCE(NULLIF(excluded.wellfound_email, ''), user_credentials.wellfound_email),
       wellfound_password = COALESCE(NULLIF(excluded.wellfound_password, ''), user_credentials.wellfound_password),
       naukri_email = COALESCE(NULLIF(excluded.naukri_email, ''), user_credentials.naukri_email),
       naukri_password = COALESCE(NULLIF(excluded.naukri_password, ''), user_credentials.naukri_password),
       full_name = COALESCE(NULLIF(excluded.full_name, ''), user_credentials.full_name),
       contact_email = COALESCE(NULLIF(excluded.contact_email, ''), user_credentials.contact_email),
       phone_number = COALESCE(NULLIF(excluded.phone_number, ''), user_credentials.phone_number)`,
    [req.userId, linkedinEmail, linkedinPassword, wellfoundEmail, wellfoundPassword, naukriEmail, naukriPassword, fullName, contactEmail, phoneNumber],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to save credentials' });
      }
      res.json({ message: 'Credentials saved securely' });
    }
  );
});

// Get stored credentials (masked)
app.get('/api/automation/credentials', authMiddleware, (req, res) => {
  db.get('SELECT * FROM user_credentials WHERE user_id = ?', [req.userId], (err, creds) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!creds) {
      return res.json({});
    }
    // Return personal info but not passwords
    res.json({
      linkedinConnected: !!creds.linkedin_email,
      wellfoundConnected: !!creds.wellfound_email,
      naukriConnected: !!creds.naukri_email,
      fullName: creds.full_name || '',
      contactEmail: creds.contact_email || '',
      phoneNumber: creds.phone_number || ''
    });
  });
});

// Scrape jobs from external sources
app.post('/api/automation/scrape', authMiddleware, async (req, res) => {
  const { keyword, location } = req.body;

  if (!keyword || !location) {
    return res.status(400).json({ error: 'Keyword and location are required' });
  }

  try {
    res.json({ message: 'Scraping started in background', status: 'processing' });

    // Run scraping in background
    automationManager.scrapeJobs(keyword, location).then(result => {
      // Log scrape history
      db.run(
        `INSERT INTO scrape_history (user_id, keyword, location, source, jobs_found)
         VALUES (?, ?, ?, ?, ?)`,
        [req.userId, keyword, location, 'all', result.total]
      );
      console.log(`✅ Scraped ${result.total} jobs`);
    });
  } catch (err) {
    return res.status(500).json({ error: 'Scraping failed: ' + err.message });
  }
});

// Trigger auto-apply to external websites
app.post('/api/automation/auto-apply', authMiddleware, async (req, res) => {
  const { keyword, location, source } = req.body;

  if (!keyword || !location) {
    return res.status(400).json({ error: 'Keyword and location are required' });
  }

  try {
    res.json({ message: 'Auto-apply started in background', status: 'processing' });

    // Run auto-apply in background
    automationManager.autoApplyToJobs(req.userId, keyword, location, source || 'all').then(() => {
      console.log(`✅ Auto-apply completed for user ${req.userId}`);
    });
  } catch (err) {
    return res.status(500).json({ error: 'Auto-apply failed: ' + err.message });
  }
});

// Get external applications
app.get('/api/automation/applications', authMiddleware, (req, res) => {
  db.all(
    `SELECT * FROM external_applications WHERE user_id = ? ORDER BY applied_date DESC`,
    [req.userId],
    (err, applications) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(applications || []);
    }
  );
});

// Get scrape history
app.get('/api/automation/scrape-history', authMiddleware, (req, res) => {
  db.all(
    `SELECT * FROM scrape_history WHERE user_id = ? ORDER BY scraped_at DESC LIMIT 20`,
    [req.userId],
    (err, history) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(history || []);
    }
  );
});

// Get automation stats
app.get('/api/automation/stats', authMiddleware, (req, res) => {
  db.all(
    `SELECT COUNT(*) as total FROM applications WHERE user_id = ?`,
    [req.userId],
    (err, countResult) => {
      if (err) {
        console.error('Error fetching stats:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      const totalApps = countResult?.[0]?.total || 0;
      
      db.all(
        `SELECT j.url, a.id FROM applications a
         JOIN jobs j ON a.job_id = j.id
         WHERE a.user_id = ?
         LIMIT 5`,
        [req.userId],
        (err, sampleApps) => {
          console.log(`[Stats] User ${req.userId}: Total applications: ${totalApps}, Sample URLs:`, sampleApps?.map(a => a.url));
          res.json({ 
            total_apps: totalApps, 
            linkedin_apps: 0, 
            wellfound_apps: 0, 
            naukri_apps: 0,
            sampleApplications: sampleApps
          });
        }
      );
    }
  );
});

// Open a visible browser so the user can complete Google/2FA login manually
app.post('/api/automation/browser/open', authMiddleware, async (req, res) => {
  const { source } = req.body;

  try {
    const startUrl =
      String(source || '').toLowerCase() === 'naukri'
        ? 'https://www.naukri.com/myapply/historypage?src=gnbOpportunities'
        : req.body.startUrl;
    const result = await automationManager.openBrowserSession(req.userId, source, { startUrl });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Continue automation in the visible browser after manual login is done
app.post('/api/automation/browser/takeover', authMiddleware, async (req, res) => {
  const { source, keyword, location } = req.body;

  try {
    const result = await automationManager.takeOverBrowserSession(req.userId, source, keyword, location);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/automation/browser/status', authMiddleware, (req, res) => {
  try {
    const result = automationManager.getBrowserSessionStatus(req.userId, req.query.source);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/automation/browser/close', authMiddleware, async (req, res) => {
  try {
    const result = await automationManager.closeBrowserSession(req.userId, req.body.source);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Sync Naukri applications
app.post('/api/automation/sync-naukri', authMiddleware, async (req, res) => {
  try {
    const { naukriEmail, naukriPassword } = req.body;
    
    if (!naukriEmail || !naukriPassword) {
      return res.status(400).json({ error: 'Naukri email and password required' });
    }

    console.log(`Syncing Naukri applications for user ${req.userId}...`);
    const result = await automationManager.syncNaukriApplications(req.userId, naukriEmail, naukriPassword);
    res.json(result);
  } catch (err) {
    console.error('Sync error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============ ERROR HANDLING ============
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
});
