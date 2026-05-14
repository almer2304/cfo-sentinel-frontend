import axios from "axios"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 180000, // 3 menit untuk pipeline AI yang panjang
  headers: { "Content-Type": "application/json" },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("cfo_token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("cfo_token")
      localStorage.removeItem("cfo_user")
      window.location.href = "/login"
    }
    return Promise.reject(err)
  }
)

// ── AUTH ──────────────────────────────────────────────────
export const authApi = {
  login:    (email, password) =>
    api.post("/auth/login", { email, password }),
  register: (business_name, email, password, business_type) =>
    api.post("/auth/register", { business_name, email, password, business_type }),
  logout:   () => api.post("/auth/logout"),
  me:       () => api.get("/auth/me"),
}

// ── ANALYSIS ──────────────────────────────────────────────
export const analysisApi = {
  run: (raw_input, business_type, current_cash_balance) =>
    api.post("/analysis/run", { raw_input, business_type, current_cash_balance }),
}

// ── HISTORY ───────────────────────────────────────────────
export const historyApi = {
  list:  (limit = 10) => api.get(`/history/list?limit=${limit}`),
  stats: ()           => api.get("/history/stats"),
}

// ── CHAT ──────────────────────────────────────────────────
export const chatApi = {
  ask: (message, session_key = null) =>
    api.post("/chat/ask", { message, session_key }),
  getHistory: (session_key) =>
    api.get(`/chat/history/${session_key}`),
  getSessions: () => api.get("/chat/sessions"),
}

export default api
