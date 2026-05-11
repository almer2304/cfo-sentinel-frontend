import { create } from "zustand"
import { persist } from "zustand/middleware"

const useAuthStore = create(
  persist(
    (set) => ({
      user:     null,
      token:    null,
      isLogged: false,

      setAuth: (user, token) => {
        localStorage.setItem("cfo_token", token)
        set({ user, token, isLogged: true })
      },
      logout: () => {
        localStorage.removeItem("cfo_token")
        set({ user: null, token: null, isLogged: false })
      },
      updateUser: (data) =>
        set((s) => ({ user: { ...s.user, ...data } })),
    }),
    {
      name: "cfo_auth",
      partialize: (s) => ({ user: s.user, token: s.token, isLogged: s.isLogged }),
    }
  )
)

export default useAuthStore
