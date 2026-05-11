import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "react-hot-toast"
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

function Guard({ children }) {
  const isLogged = useAuthStore((s) => s.isLogged)
  return isLogged ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center"
        toastOptions={{ duration: 3500,
          style: { borderRadius: "12px", fontFamily: "Inter, sans-serif", fontSize: "14px" } }} />
      <Routes>
        <Route path="/"        element={<SplashPage />} />
        <Route path="/login"   element={<LoginPage />} />
        <Route path="/home"    element={<Guard><HomePage /></Guard>} />
        <Route path="/input"   element={<Guard><InputPage /></Guard>} />
        <Route path="/loading" element={<Guard><LoadingPage /></Guard>} />
        <Route path="/result"  element={<Guard><ResultPage /></Guard>} />
        <Route path="/chat"    element={<Guard><ChatPage /></Guard>} />
        <Route path="/history" element={<Guard><HistoryPage /></Guard>} />
        <Route path="/settings" element={<Guard><SettingsPage /></Guard>} />
        <Route path="*"        element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
