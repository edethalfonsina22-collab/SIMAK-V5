import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { CheckCircle2, Loader2, PackageX } from 'lucide-react'

function OrderSuccess() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrder() {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()
      setOrder(data)
      setLoading(false)
    }
    fetchOrder()
  }, [orderId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="flex items-center gap-2 text-ink-700/70 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Memuat...
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-panel border border-ink-900/5 p-8 text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-ink-900 flex items-center justify-center">
            <PackageX className="h-6 w-6 text-brass-400" strokeWidth={2} />
          </div>
          <h2 className="font-display text-2xl text-ink-950">Pesanan tidak ditemukan</h2>
          <Link
            to="/"
            className="inline-block w-full mt-5 py-2.5 rounded-lg bg-ink-900 text-brass-400 font-medium hover:bg-ink-950 active:scale-[0.98] transition"
          >
            Kembali ke beranda
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-panel border border-ink-900/5 p-8 text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-sage-500 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-white" strokeWidth={2} />
          </div>
          <h2 className="font-display text-2xl text-ink-950">Pesanan berhasil dibuat</h2>

          <div className="mt-5 rounded-lg bg-paper/60 border border-ink-900/10 p-4 text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-700/70">Nomor pesanan</span>
              <span className="text-sm font-medium text-ink-950">{order.order_number}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-700/70">Total</span>
              <span className="text-sm font-medium text-ink-950">
                Rp {Number(order.total_amount).toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-700/70">Status pembayaran</span>
              <span className="text-sm font-medium text-brass-600">{order.payment_status}</span>
            </div>
          </div>

          <p className="text-xs text-ink-700/50 mt-4">
            Pembayaran online belum terhubung, jadi status masih "pending" untuk saat ini.
          </p>

          <Link
            to="/"
            className="inline-block w-full mt-5 py-2.5 rounded-lg bg-ink-900 text-brass-400 font-medium hover:bg-ink-950 active:scale-[0.98] transition"
          >
            Kembali ke beranda
          </Link>
        </div>
      </div>
    </div>
  )
}

export default OrderSuccess
