import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Download, FileText, Calendar, DollarSign } from "lucide-react"
import toast from "react-hot-toast"
import { AppLayout } from "../components/layout/AppLayout"
import { Button } from "../components/ui/Button"
import { formatRupiah, formatDate } from "../lib/utils"

export default function ExpenseReportPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [report, setReport] = useState(null)

  useEffect(() => {
    const reports = JSON.parse(localStorage.getItem("expense_reports") || "[]")
    const found = reports.find(r => r.id === id)
    if (found) {
      setReport(found)
    } else {
      toast.error("Laporan tidak ditemukan")
      navigate("/home")
    }
  }, [id, navigate])

  if (!report) return null

  return (
    <AppLayout>
      <div className="bg-primary px-4 py-4 text-white flex items-center justify-between shadow-sm z-20 relative">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/home")} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-poppins font-semibold text-lg leading-tight">Detail Laporan</h1>
            <p className="text-xs text-white/80">{report.id}</p>
          </div>
        </div>
        <button 
          onClick={() => {
            toast.success("Fitur unduh PDF akan segera hadir!")
          }}
          className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
        >
          <Download size={18} />
        </button>
      </div>

      <div className="px-4 py-4 flex flex-col gap-5">
        {/* Summary Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-border flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-danger/10 text-danger rounded-full flex items-center justify-center mb-3">
            <DollarSign size={24} />
          </div>
          <p className="text-sm font-medium text-text-secondary">Total Pengeluaran</p>
          <p className="text-3xl font-poppins font-bold text-danger mt-1">
            {formatRupiah(report.totalAmount, true)}
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border/50 w-full">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Calendar size={14} /> {formatDate(report.createdAt)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <FileText size={14} /> {report.items.length} Item
            </div>
          </div>
        </div>

        {/* Table/List View */}
        <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border bg-bgwarm/50 flex items-center justify-between">
            <h2 className="font-poppins font-semibold text-text-primary text-sm">Rincian Pengeluaran</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-bgwarm text-text-secondary text-xs uppercase font-medium">
                <tr>
                  <th className="px-4 py-3 border-b border-border">Tanggal</th>
                  <th className="px-4 py-3 border-b border-border">Keterangan</th>
                  <th className="px-4 py-3 border-b border-border">Kategori</th>
                  <th className="px-4 py-3 border-b border-border text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {report.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-bgwarm/30 transition-colors">
                    <td className="px-4 py-3 text-text-secondary text-xs">{item.date}</td>
                    <td className="px-4 py-3 font-medium text-text-primary">{item.desc}</td>
                    <td className="px-4 py-3">
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-medium">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-danger">
                      {formatRupiah(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Button onClick={() => navigate("/home")} className="mt-2" variant="secondary">
          Kembali ke Beranda
        </Button>
      </div>
    </AppLayout>
  )
}
