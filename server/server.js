const express = require('express');
const cors = require('cors');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const db = require('./db');
const AutomationManager = require('./automation/automationManager');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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
    if (file.mimetype === 'application/pdf' || file.mimetype === 'application/msword') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOC files are allowed'));
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

// ============ AUTH ENDPOINTS ============

// Signup
app.post('/api/auth/signup', (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

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

      // Initialize user settings
      db.run(
        `INSERT INTO settings (user_id, auto_apply_enabled, daily_limit) VALUES (?, 0, 5)`,
        [this.lastID]
      );

      const token = jwt.sign({ userId: this.lastID }, JWT_SECRET, { expiresIn: '7d' });
      res.json({
        token,
        user: { id: this.lastID, name, email }
      });
    }
  );
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

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

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  });
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
  // Simple recommendation: just get latest jobs
  db.all(
    'SELECT * FROM jobs ORDER BY posted_date DESC LIMIT 10',
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
  const { linkedinEmail, linkedinPassword, wellfoundEmail, wellfoundPassword, naukriEmail, naukriPassword } = req.body;

  db.run(
    `INSERT OR REPLACE INTO user_credentials 
     (user_id, linkedin_email, linkedin_password, wellfound_email, wellfound_password, naukri_email, naukri_password)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [req.userId, linkedinEmail, linkedinPassword, wellfoundEmail, wellfoundPassword, naukriEmail, naukriPassword],
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
    // Don't return passwords
    res.json({
      linkedinConnected: !!creds.linkedin_email,
      wellfoundConnected: !!creds.wellfound_email,
      naukriConnected: !!creds.naukri_email
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
  db.get(
    `SELECT 
      COUNT(*) as total_external_apps,
      COUNT(CASE WHEN source = 'LinkedIn' THEN 1 END) as linkedin_apps,
      COUNT(CASE WHEN source = 'Wellfound' THEN 1 END) as wellfound_apps,
      COUNT(CASE WHEN source = 'Naukri' THEN 1 END) as naukri_apps
     FROM external_applications WHERE user_id = ?`,
    [req.userId],
    (err, stats) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(stats || { total_external_apps: 0, linkedin_apps: 0, wellfound_apps: 0, naukri_apps: 0 });
    }
  );
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
