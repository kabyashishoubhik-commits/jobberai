const API_BASE = 'http://localhost:5000/api';

// Helper function for API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }

  return response.json();
}

// Auth API
export const authAPI = {
  signup: async (name: string, email: string, password: string, confirmPassword: string) => {
    const data = await apiCall('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, confirmPassword }),
    });
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }
    return data;
  },

  login: async (email: string, password: string) => {
    const data = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }
    return data;
  },

  getCurrentUser: async () => {
    return apiCall('/auth/me');
  },

  logout: () => {
    localStorage.removeItem('authToken');
  },
};

// Resume API
export const resumeAPI = {
  upload: async (file: File) => {
    const token = localStorage.getItem('authToken');
    const formData = new FormData();
    formData.append('resume', file);

    const response = await fetch(`${API_BASE}/resume/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Resume upload failed');
    }

    return response.json();
  },

  get: async () => {
    return apiCall('/resume');
  },
};

// Jobs API
export const jobsAPI = {
  getAll: async () => {
    return apiCall('/jobs');
  },

  search: async (filters: { title?: string; location?: string; minSalary?: string }) => {
    const params = new URLSearchParams();
    if (filters.title) params.append('title', filters.title);
    if (filters.location) params.append('location', filters.location);
    if (filters.minSalary) params.append('minSalary', filters.minSalary);
    
    return apiCall(`/jobs/search?${params.toString()}`);
  },

  getRecommended: async () => {
    return apiCall('/jobs/recommended');
  },
};

// Applications API
export const applicationsAPI = {
  apply: async (jobId: number) => {
    return apiCall('/applications', {
      method: 'POST',
      body: JSON.stringify({ jobId }),
    });
  },

  getMyApplications: async () => {
    return apiCall('/applications');
  },
};

// Auto-apply API
export const autoApplyAPI = {
  getRules: async () => {
    return apiCall('/auto-apply/rules');
  },

  createRule: async (rule: {
    titleKeywords: string;
    location: string;
    minSalary?: number;
    maxSalary?: number;
    remoteOnly?: boolean;
  }) => {
    return apiCall('/auto-apply/rules', {
      method: 'POST',
      body: JSON.stringify(rule),
    });
  },

  getSettings: async () => {
    return apiCall('/settings');
  },

  updateSettings: async (settings: { autoApplyEnabled: boolean; dailyLimit: number }) => {
    return apiCall('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },
};

// Analytics API
export const analyticsAPI = {
  getStats: async () => {
    return apiCall('/analytics/stats');
  },
};

// Seed API (for testing)
export const seedAPI = {
  seedJobs: async () => {
    const response = await fetch(`${API_BASE}/seed-jobs`, {
      method: 'POST',
    });
    return response.json();
  },
};

// Browser Automation API
export const automationAPI = {
  saveCredentials: async (credentials: {
    linkedinEmail?: string;
    linkedinPassword?: string;
    wellfoundEmail?: string;
    wellfoundPassword?: string;
    naukriEmail?: string;
    naukriPassword?: string;
  }) => {
    return apiCall('/automation/credentials', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  getCredentials: async () => {
    return apiCall('/automation/credentials');
  },

  scrapeJobs: async (keyword: string, location: string) => {
    return apiCall('/automation/scrape', {
      method: 'POST',
      body: JSON.stringify({ keyword, location }),
    });
  },

  autoApply: async (keyword: string, location: string, source: string = 'all') => {
    return apiCall('/automation/auto-apply', {
      method: 'POST',
      body: JSON.stringify({ keyword, location, source }),
    });
  },

  getExternalApplications: async () => {
    return apiCall('/automation/applications');
  },

  getScrapeHistory: async () => {
    return apiCall('/automation/scrape-history');
  },

  getAutomationStats: async () => {
    return apiCall('/automation/stats');
  },
};
