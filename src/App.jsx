import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import { AnimatePresence } from "framer-motion"
import useAuthStore from "./store/useAuthStore"

import SplashPage   from "./pages/SplashPage"
import LoginPage    from "./pages/LoginPage"
import HomePage     from "./pages/HomePage"
import InputPage    from "./pages/InputPage"
import LoadingPage  from "./pages/LoadingPage"
import ResultPage   from "./pages/ResultPage"
import ChatPage     from "./pages/ChatPage"
import HistoryPage  from "./pages/HistoryPage"
import SettingsPage from "./pages/SettingsPage"
import ExpensePage  from "./pages/ExpensePage"
import ExpenseReportPage from "./pages/ExpenseReportPage"

function Guard({ children }) {
  const isLogged = useAuthStore((s) => s.isLogged)
  return isLogged ? children : <Navigate to="/login" replace />
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/"        element={<SplashPage />} />
        <Route path="/login"   element={<LoginPage />} />
        <Route path="/home"    element={<Guard><HomePage /></Guard>} />
        <Route path="/input"   element={<Guard><InputPage /></Guard>} />
        <Route path="/loading" element={<Guard><LoadingPage /></Guard>} />
        <Route path="/result"  element={<Guard><ResultPage /></Guard>} />
        <Route path="/chat"    element={<Guard><ChatPage /></Guard>} />
        <Route path="/history" element={<Guard><HistoryPage /></Guard>} />
        <Route path="/settings" element={<Guard><SettingsPage /></Guard>} />
        <Route path="/expense" element={<Guard><ExpensePage /></Guard>} />
        <Route path="/expense/report/:id" element={<Guard><ExpenseReportPage /></Guard>} />
        <Route path="*"        element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center"
        toastOptions={{ duration: 3500,
          style: { borderRadius: "12px", fontFamily: "Inter, sans-serif", fontSize: "14px" } }} />
      <AnimatedRoutes />
    </BrowserRouter>
  )
}
