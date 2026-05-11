import { useState, useRef, useEffect } from "react"
import { Send } from "lucide-react"
import { chatApi } from "../lib/api"
import { TopBar } from "../components/layout/TopBar"
import toast from "react-hot-toast"

const QUICK_CHIPS = [
  "Berapa uang aku tahan?",
  "Pengeluaran apa yang boros?",
  "Kondisi keuanganku gimana?",
  "Apa yang harus dilakukan sekarang?",
  "Kapan aku bisa bayar gaji?",
]

const INITIAL_MSG = {
  role: "ai",
  text: "Halo! Saya CFO Sentinel, asisten keuangan bisnis kamu. 🛡️\n\nAda yang ingin kamu tanyakan tentang kondisi keuangan bisnismu?",
  time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
}

export default function ChatPage() {
  const [messages, setMessages] = useState([INITIAL_MSG])
  const [inputText, setInputText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  async function sendMessage(text) {
    if (!text.trim() || isTyping) return
    const userMsg = {
      role: "user", text: text.trim(),
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    }
    setMessages((prev) => [...prev, userMsg])
    setInputText("")
    setIsTyping(true)

    try {
      const res = await chatApi.ask(text.trim(), sessionId)
      const { answer, session_id } = res.data
      if (session_id) setSessionId(session_id)
      setMessages((prev) => [...prev, {
        role: "ai", text: answer,
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      }])
    } catch (err) {
      toast.error("Gagal mendapat jawaban. Coba lagi.")
      setMessages((prev) => [...prev, {
        role: "ai", text: "Maaf, saya sedang mengalami gangguan. Coba tanya lagi ya! 🙏",
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      }])
    } finally {
      setIsTyping(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    sendMessage(inputText)
  }

  return (
    <div className="min-h-screen bg-bgwarm flex flex-col">
      <TopBar title="💬 Tanya CFO Sentinel" subtitle="Online" showBack={true} />

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 pb-36">
        {messages.map((msg, i) => (
          <ChatBubble key={i} message={msg} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Quick chips */}
      <div className="fixed bottom-[72px] left-1/2 -translate-x-1/2 w-full max-w-[480px] z-10">
        {messages.length <= 1 && (
          <div className="px-4 pb-2">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {QUICK_CHIPS.map((chip) => (
                <button key={chip} onClick={() => sendMessage(chip)}
                  className="flex-shrink-0 px-3 py-2 bg-white border border-border rounded-full text-xs
                             text-text-secondary hover:border-primary hover:text-primary transition-all
                             active:scale-95 whitespace-nowrap shadow-sm">
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input bar */}
        <div className="bg-white border-t border-border px-4 py-3">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Tanya tentang keuanganmu..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isTyping}
              className="flex-1 h-11 px-4 bg-bgwarm border border-border rounded-full text-sm text-text-primary
                         focus:outline-none focus:border-primary transition-all placeholder:text-text-muted"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="w-11 h-11 bg-primary rounded-full flex items-center justify-center
                         disabled:opacity-40 active:scale-90 transition-all flex-shrink-0"
            >
              <Send size={18} className="text-white ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function ChatBubble({ message }) {
  const isUser = message.role === "user"
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}>
      <div className={`flex items-end gap-1.5 max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        {!isUser && (
          <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mb-4">
            <span className="text-xs">🛡️</span>
          </div>
        )}
        <div>
          <div className={`px-4 py-3 ${
            isUser
              ? "bg-primary text-white rounded-2xl rounded-tr-sm"
              : "bg-white text-text-primary rounded-2xl rounded-tl-sm border border-border"
          }`}>
            <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
          </div>
          <p className={`text-[10px] text-text-muted mt-1 ${isUser ? "text-right" : "text-left"}`}>
            {message.time}
          </p>
        </div>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-1.5">
      <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-xs">🛡️</span>
      </div>
      <div className="bg-white rounded-2xl rounded-tl-sm border border-border px-4 py-3 flex gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-2 h-2 bg-text-muted rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  )
}
