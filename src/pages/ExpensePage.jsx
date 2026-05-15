import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Plus, Trash2, Save, Receipt } from "lucide-react"
import toast from "react-hot-toast"
import { AppLayout } from "../components/layout/AppLayout"
import { Button } from "../components/ui/Button"
import { formatRupiah } from "../lib/utils"

export default function ExpensePage() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("Lainnya")
  const [desc, setDesc] = useState("")

  const handleAddItem = (e) => {
    e.preventDefault()
    if (!amount || !desc) {
      toast.error("Nominal dan keterangan wajib diisi!")
      return
    }

    const newItem = {
      id: Date.now().toString(),
      date,
      amount: Number(amount),
      category,
      desc
    }
    
    setItems([...items, newItem])
    setAmount("")
    setDesc("")
    toast.success("Pengeluaran ditambahkan ke daftar sementara")
  }

  const handleRemoveItem = (id) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const handleSaveReport = () => {
    if (items.length === 0) {
      toast.error("Belum ada pengeluaran yang dicatat")
      return
    }

    const reportId = `EXP-${Date.now()}`
    const reportData = {
      id: reportId,
      createdAt: new Date().toISOString(),
      items: items,
      totalAmount: items.reduce((acc, curr) => acc + curr.amount, 0)
    }

    const existingReports = JSON.parse(localStorage.getItem("expense_reports") || "[]")
    localStorage.setItem("expense_reports", JSON.stringify([reportData, ...existingReports]))
    
    toast.success("Laporan pengeluaran berhasil disimpan!")
    navigate(`/expense/report/${reportId}`)
  }

  return (
    <AppLayout
      topbar={
        <div className="bg-primary px-4 py-4 text-white flex items-center gap-3 shadow-sm z-20 relative">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-poppins font-semibold text-lg leading-tight">Catat Pengeluaran</h1>
            <p className="text-xs text-white/80">Tanpa analisis AI</p>
          </div>
        </div>
      }
    >

      <div className="px-4 py-4 flex flex-col gap-6">
        {/* Form Input */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-border">
          <h2 className="font-poppins font-semibold text-base mb-3 flex items-center gap-2">
            <Receipt size={18} className="text-primary" /> Tambah Pengeluaran Baru
          </h2>
          <form onSubmit={handleAddItem} className="flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-primary">Tanggal</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-primary">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
                >
                  <option value="Bahan Baku">Bahan Baku</option>
                  <option value="Operasional">Operasional</option>
                  <option value="Gaji Karyawan">Gaji Karyawan</option>
                  <option value="Transportasi">Transportasi</option>
                  <option value="Sewa Tempat">Sewa Tempat</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-primary">Nominal (Rp)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Contoh: 50000"
                className="w-full h-10 px-3 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-primary">Keterangan</label>
              <input
                type="text"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Contoh: Beli gas elpiji"
                className="w-full h-10 px-3 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <Button type="submit" className="mt-1 h-10 text-sm">
              <Plus size={16} /> Tambah ke Daftar
            </Button>
          </form>
        </div>

        {/* Daftar Sementara */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-poppins font-semibold text-base">Daftar Sementara</h2>
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">
              {items.length} item
            </span>
          </div>

          {items.length === 0 ? (
            <div className="bg-white border border-dashed border-border rounded-xl p-6 text-center">
              <p className="text-sm text-text-muted">Belum ada pengeluaran yang ditambahkan.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {items.map((item) => (
                <div key={item.id} className="bg-white p-3 rounded-xl border border-border flex items-center justify-between shadow-sm">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-sm font-medium text-text-primary truncate">{item.desc}</p>
                    <div className="flex gap-2 text-xs text-text-secondary mt-1">
                      <span>{item.category}</span>
                      <span>•</span>
                      <span>{item.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm font-bold text-danger">{formatRupiah(item.amount)}</span>
                    <button onClick={() => handleRemoveItem(item.id)} className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Button */}
        {items.length > 0 && (
          <div className="sticky bottom-4 z-10 pt-2 pb-safe">
            <div className="bg-white p-4 rounded-xl shadow-lg border border-border flex flex-col gap-3">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-text-secondary">Total Pengeluaran:</span>
                <span className="font-bold text-lg text-danger">
                  {formatRupiah(items.reduce((acc, curr) => acc + curr.amount, 0))}
                </span>
              </div>
              <Button onClick={handleSaveReport} className="w-full">
                <Save size={18} /> Simpan Laporan ({items.length})
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
