// File ini berjalan di server (Vercel Serverless Function), bukan di browser.
// Aman menggunakan Server Key di sini karena tidak pernah dikirim ke client.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { order_id, gross_amount, customer_name, customer_email, items } = req.body

    if (!order_id || !gross_amount) {
      return res.status(400).json({ error: 'order_id dan gross_amount wajib diisi' })
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY
    if (!serverKey) {
      return res.status(500).json({ error: 'MIDTRANS_SERVER_KEY belum di-set di server' })
    }

    const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64')

    // Sandbox endpoint. Ganti ke https://app.midtrans.com/snap/v1/transactions saat sudah production.
    const midtransResponse = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        transaction_details: {
          order_id,
          gross_amount,
        },
        customer_details: {
          first_name: customer_name || 'Pembeli',
          email: customer_email,
        },
        item_details: items,
      }),
    })

    const data = await midtransResponse.json()

    if (!midtransResponse.ok) {
      return res.status(midtransResponse.status).json({
        error: data.error_messages ? data.error_messages.join(', ') : 'Gagal membuat transaksi',
      })
    }

    return res.status(200).json({ token: data.token, redirect_url: data.redirect_url })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
