const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"
const BACKEND_BASE = API_BASE.replace(/\/api\/?$/, "")

async function readError(response: Response) {
  try {
    const data = await response.json()
    return data.error || data.message || "API request failed"
  } catch {
    return response.statusText || "API request failed"
  }
}

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (options.headers) {
    Object.assign(headers, options.headers as Record<string, string>)
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    })
  } catch {
    throw new Error("Cannot reach the backend server. Start it with `npm run server` or `npm run dev-full`.")
  }

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  return response.json()
}

export const authAPI = {
  signup: async (name: string, email: string, password: string, confirmPassword: string) => {
    const data = await apiCall("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password, confirmPassword }),
    })
    if (data.token) {
      localStorage.setItem("authToken", data.token)
    }
    return data
  },

  login: async (email: string, password: string) => {
    const data = await apiCall("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
    if (data.token) {
      localStorage.setItem("authToken", data.token)
    }
    return data
  },

  forgotPassword: async (email: string) => {
    return apiCall("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    })
  },

  resetPassword: async (token: string, password: string, confirmPassword: string) => {
    return apiCall("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password, confirmPassword }),
    })
  },

  startGoogleLogin: () => {
    window.location.href = `${BACKEND_BASE}/api/auth/google/start`
  },

  getCurrentUser: async () => {
    return apiCall("/auth/me")
  },

  logout: () => {
    localStorage.removeItem("authToken")
  },
}

export const resumeAPI = {
  upload: async (file: File) => {
    const token = localStorage.getItem("authToken")
    const formData = new FormData()
    formData.append("resume", file)

    let response: Response
    try {
      response = await fetch(`${API_BASE}/resume/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })
    } catch {
      throw new Error("Cannot reach the backend server. Start it with `npm run server` or `npm run dev-full`.")
    }

    if (!response.ok) {
      throw new Error(await readError(response))
    }

    return response.json()
  },

  get: async () => {
    return apiCall("/resume")
  },
}

export const jobsAPI = {
  getAll: async () => {
    return apiCall("/jobs")
  },

  search: async (filters: { title?: string; location?: string; minSalary?: string }) => {
    const params = new URLSearchParams()
    if (filters.title) params.append("title", filters.title)
    if (filters.location) params.append("location", filters.location)
    if (filters.minSalary) params.append("minSalary", filters.minSalary)

    return apiCall(`/jobs/search?${params.toString()}`)
  },

  getRecommended: async () => {
    return apiCall("/jobs/recommended")
  },
}

export const applicationsAPI = {
  apply: async (jobId: number) => {
    return apiCall("/applications", {
      method: "POST",
      body: JSON.stringify({ jobId }),
    })
  },

  getMyApplications: async () => {
    return apiCall("/applications")
  },
}

export const autoApplyAPI = {
  getRules: async () => {
    return apiCall("/auto-apply/rules")
  },

  createRule: async (rule: {
    titleKeywords: string
    location: string
    minSalary?: number
    maxSalary?: number
    remoteOnly?: boolean
  }) => {
    return apiCall("/auto-apply/rules", {
      method: "POST",
      body: JSON.stringify(rule),
    })
  },

  getSettings: async () => {
    return apiCall("/settings")
  },

  updateSettings: async (settings: { autoApplyEnabled: boolean; dailyLimit: number }) => {
    return apiCall("/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    })
  },
}

export const analyticsAPI = {
  getStats: async () => {
    return apiCall("/analytics/stats")
  },
}

export const seedAPI = {
  seedJobs: async () => {
    const response = await fetch(`${API_BASE}/seed-jobs`, {
      method: "POST",
    })
    return response.json()
  },
}

export const automationAPI = {
  saveCredentials: async (credentials: {
    linkedinEmail?: string
    linkedinPassword?: string
    wellfoundEmail?: string
    wellfoundPassword?: string
    naukriEmail?: string
    naukriPassword?: string
  }) => {
    return apiCall("/automation/credentials", {
      method: "POST",
      body: JSON.stringify(credentials),
    })
  },

  getCredentials: async () => {
    return apiCall("/automation/credentials")
  },

  scrapeJobs: async (keyword: string, location: string) => {
    return apiCall("/automation/scrape", {
      method: "POST",
      body: JSON.stringify({ keyword, location }),
    })
  },

  autoApply: async (keyword: string, location: string, source: string = "all") => {
    return apiCall("/automation/auto-apply", {
      method: "POST",
      body: JSON.stringify({ keyword, location, source }),
    })
  },

  openBrowser: async (source: string) => {
    return apiCall("/automation/browser/open", {
      method: "POST",
      body: JSON.stringify({ source }),
    })
  },

  takeOverBrowser: async (source: string, keyword: string, location: string) => {
    return apiCall("/automation/browser/takeover", {
      method: "POST",
      body: JSON.stringify({ source, keyword, location }),
    })
  },

  closeBrowser: async (source: string) => {
    return apiCall("/automation/browser/close", {
      method: "POST",
      body: JSON.stringify({ source }),
    })
  },

  getBrowserStatus: async (source: string) => {
    return apiCall(`/automation/browser/status?source=${encodeURIComponent(source)}`)
  },

  getExternalApplications: async () => {
    return apiCall("/automation/applications")
  },

  getScrapeHistory: async () => {
    return apiCall("/automation/scrape-history")
  },

  getAutomationStats: async () => {
    return apiCall("/automation/stats")
  },

  syncNaukri: async (naukriEmail: string, naukriPassword: string) => {
    return apiCall("/automation/sync-naukri", {
      method: "POST",
      body: JSON.stringify({ naukriEmail, naukriPassword }),
    })
  },
}
