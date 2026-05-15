import { useState, useRef, useEffect } from "react"
import { Send, Plus, Trash2 } from "lucide-react"
import { chatApi } from "../lib/api"
import { AppLayout } from "../components/layout/AppLayout"
import { TopBar } from "../components/layout/TopBar"
import toast from "react-hot-toast"
import useAuthStore from "../store/useAuthStore"

const QUICK_CHIPS = [
  "Berapa hari lagi uang aku tahan?",
  "Pengeluaran apa yang paling boros?",
  "Kondisi keuanganku gimana?",
  "Apa yang harus dilakukan sekarang?",
  "Apa yang bisa aku hemat?",
  "Apakah bisnisku dalam bahaya?",
]

const INITIAL_MSG = {
  role: "ai",
  text: "Halo! Saya CFO Sentinel, asisten keuangan bisnis kamu. 🛡️\n\nAda yang ingin kamu tanyakan tentang kondisi keuangan bisnismu? Saya ingat semua percakapan kita sebelumnya.",
  time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
}

export default function ChatPage() {
  const user = useAuthStore((s) => s.user)
  const [messages, setMessages] = useState([INITIAL_MSG])
  const [inputText, setInputText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [sessionKey, setSessionKey] = useState(null)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  // Load session key dari localStorage agar persisten
  useEffect(() => {
    const stored = localStorage.getItem(`chat_session_${user?.id}`)
    if (stored) {
      setSessionKey(stored)
      // Load history dari server
      loadHistory(stored)
    } else {
      const newKey = crypto.randomUUID()
      setSessionKey(newKey)
      localStorage.setItem(`chat_session_${user?.id}`, newKey)
    }
  }, [user?.id])

  async function loadHistory(key) {
    try {
      const res = await chatApi.getHistory(key)
      if (res.data?.messages?.length > 0) {
        const loaded = res.data.messages.map((m) => ({
          role: m.role === "assistant" ? "ai" : "user",
          text: m.content,
          time: new Date(m.created_at).toLocaleTimeString("id-ID", {
            hour: "2-digit", minute: "2-digit"
          }),
        }))
        setMessages([INITIAL_MSG, ...loaded])
      }
    } catch {
      // Gagal load history — tidak apa, mulai baru
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  async function sendMessage(text) {
    if (!text.trim() || isTyping) return
    const userMsg = {
      role: "user", text: text.trim(),
      time: new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit", minute: "2-digit"
      }),
    }
    setMessages((prev) => [...prev, userMsg])
    setInputText("")
    setIsTyping(true)

    try {
      const res = await chatApi.ask(text.trim(), sessionKey)
      const { answer, session_key } = res.data
      // Update session key jika baru
      if (session_key && session_key !== sessionKey) {
        setSessionKey(session_key)
        localStorage.setItem(`chat_session_${user?.id}`, session_key)
      }
      setMessages((prev) => [...prev, {
        role: "ai", text: answer,
        time: new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit", minute: "2-digit"
        }),
      }])
    } catch {
      toast.error("Gagal mendapat jawaban. Coba lagi.")
      setMessages((prev) => [...prev, {
        role: "ai",
        text: "Maaf, saya sedang mengalami gangguan. Coba tanya lagi ya! 🙏",
        time: new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit", minute: "2-digit"
        }),
      }])
    } finally {
      setIsTyping(false)
    }
  }

  function handleNewChat() {
    if (!window.confirm("Mulai percakapan baru? Riwayat chat ini akan tetap tersimpan.")) return
    const newKey = crypto.randomUUID()
    setSessionKey(newKey)
    localStorage.setItem(`chat_session_${user?.id}`, newKey)
    setMessages([INITIAL_MSG])
  }

  return (
    <AppLayout
      topbar={
        <TopBar
          title="💬 Tanya CFO Sentinel"
          subtitle="Online • Mengingat percakapan kamu"
          showBack={false}
          right={
            <button
              onClick={handleNewChat}
              className="p-2 rounded-xl hover:bg-bgwarm active:scale-95 transition-all"
              title="Mulai percakapan baru"
            >
              <Plus size={20} className="text-text-secondary" />
            </button>
          }
        />
      }
    >

      {/* Quick chips — selalu tampil */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => sendMessage(chip)}
              disabled={isTyping}
              className="flex-shrink-0 px-3 py-2 bg-white border border-border rounded-full
                         text-xs text-text-secondary hover:border-primary hover:text-primary
                         transition-all active:scale-95 whitespace-nowrap shadow-sm
                         disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-3 pb-24">
        {messages.map((msg, i) => (
          <ChatBubble key={i} message={msg} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input bar — fixed di atas bottom nav */}
      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-10 bg-white border-t border-border px-4 py-3">
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(inputText) }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isTyping}
            placeholder="Tanya tentang keuanganmu..."
            className="flex-1 h-11 px-4 bg-bgwarm border border-border rounded-full
                       text-sm text-text-primary focus:outline-none focus:border-primary
                       transition-all disabled:opacity-60 placeholder:text-text-muted"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="w-11 h-11 bg-primary rounded-full flex items-center justify-center
                       active:scale-90 transition-all disabled:opacity-40 flex-shrink-0"
          >
            <Send size={16} className="text-white" />
          </button>
        </form>
      </div>
    </AppLayout>
  )
}

function ChatBubble({ message }) {
  const isAI = message.role === "ai"
  return (
    <div className={`flex items-end gap-2 ${isAI ? "justify-start" : "justify-end"}`}>
      {isAI && (
        <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mb-1">
          <span className="text-xs">🛡️</span>
        </div>
      )}
      <div className={`max-w-[80%] flex flex-col ${isAI ? "items-start" : "items-end"}`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isAI
            ? "bg-white border border-border text-text-primary rounded-tl-sm shadow-sm"
            : "bg-primary text-white rounded-tr-sm"
        }`}>
          {message.text}
        </div>
        <span className="text-[10px] text-text-muted mt-1 px-1">{message.time}</span>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-xs">🛡️</span>
      </div>
      <div className="bg-white border border-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1.5 items-center">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 bg-text-muted rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  )
}
