import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Client Supabase khusus server, pakai Service Role Key supaya bisa
// update data lintas-user (bypass RLS) - HANYA dipakai di sini, tidak pernah di frontend.
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function mapMidtransStatus(transactionStatus, fraudStatus) {
  if (transactionStatus === 'capture') {
    return fraudStatus === 'accept' ? 'paid' : 'pending'
  }
  if (transactionStatus === 'settlement') return 'paid'
  if (transactionStatus === 'pending') return 'pending'
  if (transactionStatus === 'deny') return 'failed'
  if (transactionStatus === 'cancel') return 'failed'
  if (transactionStatus === 'expire') return 'expired'
  if (transactionStatus === 'refund') return 'refunded'
  return 'pending'
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      order_id: orderNumber,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
      transaction_id,
    } = req.body

    // 1. Verifikasi keaslian notifikasi (wajib, supaya tidak bisa dipalsukan orang lain)
    const serverKey = process.env.MIDTRANS_SERVER_KEY
    const expectedSignature = crypto
      .createHash('sha512')
      .update(orderNumber + status_code + gross_amount + serverKey)
      .digest('hex')

    if (expectedSignature !== signature_key) {
      return res.status(403).json({ error: 'Signature tidak valid' })
    }

    // 2. Cari order berdasarkan order_number
    const { data: order, error: orderFindError } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('order_number', orderNumber)
      .single()

    if (orderFindError || !order) {
      return res.status(404).json({ error: 'Order tidak ditemukan' })
    }

    const newPaymentStatus = mapMidtransStatus(transaction_status, fraud_status)

    // 3. Update status pembayaran di orders
    await supabaseAdmin
      .from('orders')
      .update({ payment_status: newPaymentStatus, updated_at: new Date().toISOString() })
      .eq('id', order.id)

    // 4. Catat/perbarui record di tabel payments
    const { data: existingPayment } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('midtrans_order_id', orderNumber)
      .maybeSingle()

    if (existingPayment) {
      await supabaseAdmin
        .from('payments')
        .update({
          midtrans_transaction_id: transaction_id,
          payment_method: payment_type,
          gross_amount,
          status: newPaymentStatus,
          raw_notification: req.body,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPayment.id)
    } else {
      await supabaseAdmin.from('payments').insert({
        order_id: order.id,
        midtrans_order_id: orderNumber,
        midtrans_transaction_id: transaction_id,
        payment_method: payment_type,
        gross_amount,
        status: newPaymentStatus,
        raw_notification: req.body,
      })
    }

    // 5. Kalau sudah dibayar, majukan status sub_orders dari "awaiting_payment" ke "processing"
    if (newPaymentStatus === 'paid') {
      await supabaseAdmin
        .from('sub_orders')
        .update({ fulfillment_status: 'processing', updated_at: new Date().toISOString() })
        .eq('order_id', order.id)
        .eq('fulfillment_status', 'awaiting_payment')
    }

    return res.status(200).json({ received: true })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
