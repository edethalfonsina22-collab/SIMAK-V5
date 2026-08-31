import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

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

  if (loading) return <p style={{ padding: '16px' }}>Memuat...</p>
  if (!order) return <p style={{ padding: '16px' }}>Pesanan tidak ditemukan.</p>

  return (
    <div style={{ padding: '16px', maxWidth: '500px' }}>
      <h2>Pesanan Berhasil Dibuat 🎉</h2>
      <p>Nomor pesanan: <strong>{order.order_number}</strong></p>
      <p>Total: <strong>Rp {Number(order.total_amount).toLocaleString('id-ID')}</strong></p>
      <p>Status pembayaran: <strong>{order.payment_status}</strong></p>
      <p style={{ color: '#888', fontSize: '0.9rem' }}>
        Pembayaran online belum terhubung, jadi status masih "pending" untuk saat ini.
      </p>
      <Link to="/">Kembali ke beranda</Link>
    </div>
  )
}

export default OrderSuccess
