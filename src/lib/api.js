import axios from "axios"

const BASE_URL    = "https://cfosentinel.my.id/api/v1"
const BASE_URL_V2 = "https://cfosentinel.my.id/api/v2"

// ── v1 client (analisis lama) ─────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 180000,
  headers: { "Content-Type": "application/json" },
})

// ── v2 client (kasir digital) ─────────────────────────────
const apiV2 = axios.create({
  baseURL: BASE_URL_V2,
  timeout: 15000,   // v2 cepat karena hanya DB query
  headers: { "Content-Type": "application/json" },
})

// Interceptor: inject token
function attachToken(config) {
  const token = localStorage.getItem("cfo_token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
}

api.interceptors.request.use(attachToken)
apiV2.interceptors.request.use(attachToken)

// Interceptor: handle 401
function handle401(err) {
  if (err.response?.status === 401){
    localStorage.removeItem("cfo_token")
    localStorage.removeItem("cfo_user")
    window.location.href = "/login"
  }
  return Promise.reject(err)
}

api.interceptors.response.use((r) => r, handle401)
apiV2.interceptors.response.use((r) => r, handle401)


// ── AUTH ──────────────────────────────────────────────────
export const authApi = {
  login:    (email, password) =>
    api.post("/auth/login", { email, password }),
  register: (business_name, email, password, business_type) =>
    api.post("/auth/register", { business_name, email, password, business_type }),
  logout:   () => api.post("/auth/logout"),
  me:       () => api.get("/auth/me"),
}

// ── ANALYSIS (v1 — legacy) ────────────────────────────────
export const analysisApi = {
  run: (raw_input, business_type, current_cash_balance) =>
    api.post("/analysis/run", { raw_input, business_type, current_cash_balance }),
}

// ── HISTORY (v1) ──────────────────────────────────────────
export const historyApi = {
  list:  (limit = 10) => api.get(`/history/list?limit=${limit}`),
  stats: ()           => api.get("/history/stats"),
}

// ── CHAT (v1) ─────────────────────────────────────────────
export const chatApi = {
  ask: (message, session_key = null) =>
    api.post("/chat/ask", { message, session_key }),
  getHistory: (session_key) =>
    api.get(`/chat/history/${session_key}`),
  getSessions: () => api.get("/chat/sessions"),
}

// ── TRANSACTIONS v2 (kasir digital) ──────────────────────
export const txApi = {
  /**
   * Simpan satu transaksi.
   * @param {{ type, amount, description, category?, notes? }} data
   */
  create: (data) =>
    apiV2.post("/transactions", data),

  /** List transaksi. Filter opsional: date_from, date_to, type, limit, offset */
  list: (params = {}) =>
    apiV2.get("/transactions", { params }),

  /** Detail satu transaksi berdasarkan kode */
  get: (code) =>
    apiV2.get(`/transactions/${code}`),

  /** Edit sebagian field transaksi */
  update: (code, data) =>
    apiV2.patch(`/transactions/${code}`, data),

  /** Hapus (soft delete) transaksi */
  delete: (code) =>
    apiV2.delete(`/transactions/${code}`),
}

// ── DASHBOARD v2 (otomatis dari pipeline) ────────────────
export const dashboardApi = {
  /** Data ringkasan utama homepage */
  get: () =>
    apiV2.get("/dashboard"),

  /** Pengeluaran per kategori untuk chart */
  spending: (params = {}) =>
    apiV2.get("/dashboard/spending", { params }),

  /** Riwayat health score untuk chart tren */
  healthHistory: (days = 30) =>
    apiV2.get("/dashboard/health-history", { params: { days } }),

  /** Daftar anomali yang belum resolved */
  anomalies: (limit = 10) =>
    apiV2.get("/dashboard/anomalies", { params: { limit } }),
}

export default api
