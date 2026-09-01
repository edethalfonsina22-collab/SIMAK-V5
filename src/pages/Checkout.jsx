import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { ShoppingBag, Loader2, AlertTriangle } from 'lucide-react'

function generateOrderNumber() {
  const now = new Date()
  const stamp = now.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)
  const random = Math.floor(Math.random() * 900 + 100)
  return `ORD-${stamp}-${random}`
}

// Muat script Snap.js Midtrans sekali saja, lalu buka popup pembayaran.
function loadSnapScript() {
  return new Promise((resolve, reject) => {
    if (window.snap) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js' // sandbox
    script.setAttribute('data-client-key', import.meta.env.VITE_MIDTRANS_CLIENT_KEY)
    script.onload = resolve
    script.onerror = reject
    document.body.appendChild(script)
  })
}

function Checkout() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [statusText, setStatusText] = useState('')

  useEffect(() => {
    async function fetchCart() {
      setLoading(true)

      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        navigate('/login')
        return
      }

      const userId = sessionData.session.user.id

      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          quantity,
          product_variants (
            id,
            size,
            color,
            price_override,
            products ( id, name, base_price, store_id )
          )
        `)
        .eq('user_id', userId)

      if (error) {
        setError(error.message)
      } else if (!data || data.length === 0) {
        navigate('/keranjang')
        return
      } else {
        setItems(data)
      }
      setLoading(false)
    }

    fetchCart()
  }, [navigate])

  function priceOf(item) {
    const variant = item.product_variants
    return variant.price_override ?? variant.products.base_price
  }

  async function handlePlaceOrder() {
    setPlacingOrder(true)
    setError(null)
    setStatusText('Membuat pesanan...')

    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData.session.user.id
    const userEmail = sessionData.session.user.email

    const total = items.reduce((sum, item) => sum + priceOf(item) * item.quantity, 0)
    const orderNumber = generateOrderNumber()

    // 1. Buat order utama
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id: userId,
        order_number: orderNumber,
        total_amount: total,
      })
      .select()
      .single()

    if (orderError) {
      setError(orderError.message)
      setPlacingOrder(false)
      return
    }

    // 2. Kelompokkan item keranjang per toko (store_id)
    const groupedByStore = {}
    for (const item of items) {
      const storeId = item.product_variants.products.store_id
      if (!groupedByStore[storeId]) groupedByStore[storeId] = []
      groupedByStore[storeId].push(item)
    }

    // 3. Buat sub_order + order_items untuk tiap toko
    for (const storeId of Object.keys(groupedByStore)) {
      const storeItems = groupedByStore[storeId]
      const subtotal = storeItems.reduce((sum, item) => sum + priceOf(item) * item.quantity, 0)

      const { data: subOrder, error: subOrderError } = await supabase
        .from('sub_orders')
        .insert({
          order_id: order.id,
          store_id: storeId,
          subtotal,
          shipping_cost: 0,
        })
        .select()
        .single()

      if (subOrderError) {
        setError(subOrderError.message)
        setPlacingOrder(false)
        return
      }

      const orderItemsPayload = storeItems.map((item) => ({
        sub_order_id: subOrder.id,
        variant_id: item.product_variants.id,
        product_name: item.product_variants.products.name,
        variant_label: [item.product_variants.size, item.product_variants.color]
          .filter(Boolean)
          .join(' - '),
        unit_price: priceOf(item),
        quantity: item.quantity,
      }))

      const { error: itemsError } = await supabase.from('order_items').insert(orderItemsPayload)

      if (itemsError) {
        setError(itemsError.message)
        setPlacingOrder(false)
        return
      }
    }

    // 4. Kosongkan keranjang
    const cartItemIds = items.map((item) => item.id)
    await supabase.from('cart_items').delete().in('id', cartItemIds)

    // 5. Minta Snap token dari serverless function, lalu buka popup pembayaran
    setStatusText('Menyiapkan pembayaran...')

    try {
      await loadSnapScript()

      const response = await fetch('/api/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderNumber,
          gross_amount: total,
          customer_name: userEmail,
          customer_email: userEmail,
          items: items.map((item) => ({
            id: item.product_variants.id,
            price: priceOf(item),
            quantity: item.quantity,
            name: item.product_variants.products.name.slice(0, 50),
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Gagal menyiapkan pembayaran.')
        setPlacingOrder(false)
        // Order tetap dibuat dengan status pending, jadi tetap arahkan ke halaman pesanan
        navigate(`/pesanan-berhasil/${order.id}`)
        return
      }

      setPlacingOrder(false)

      window.snap.pay(data.token, {
        onSuccess: () => navigate(`/pesanan-berhasil/${order.id}`),
        onPending: () => navigate(`/pesanan-berhasil/${order.id}`),
        onError: () => {
          setError('Pembayaran gagal. Kamu bisa coba bayar lagi nanti dari halaman pesanan.')
          navigate(`/pesanan-berhasil/${order.id}`)
        },
        onClose: () => navigate(`/pesanan-berhasil/${order.id}`),
      })
    } catch (err) {
      setError('Gagal memuat sistem pembayaran: ' + err.message)
      setPlacingOrder(false)
      navigate(`/pesanan-berhasil/${order.id}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="flex items-center gap-2 text-ink-700/70 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Memuat checkout...
        </div>
      </div>
    )
  }

  const total = items.reduce((sum, item) => sum + priceOf(item) * item.quantity, 0)

  return (
    <div className="min-h-screen bg-paper px-4 py-10">
      <div className="w-full max-w-xl mx-auto">
        <div className="bg-white rounded-2xl shadow-panel border border-ink-900/5 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-ink-900 flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="h-5 w-5 text-brass-400" strokeWidth={2} />
            </div>
            <div>
              <h2 className="font-display text-2xl text-ink-950">Checkout</h2>
              <p className="text-sm text-ink-700/70">Tinjau pesanan Anda sebelum membayar</p>
            </div>
          </div>

          <div className="divide-y divide-ink-900/10 border-t border-b border-ink-900/10">
            {items.map((item) => {
              const variant = item.product_variants
              const product = variant.products
              const variantLabel = [variant.size, variant.color].filter(Boolean).join(' - ')
              return (
                <div key={item.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-950 truncate">{product.name}</p>
                    <p className="text-xs text-ink-700/60 mt-0.5">
                      {variantLabel && `${variantLabel} · `}x{item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-ink-950 whitespace-nowrap">
                    Rp {Number(priceOf(item) * item.quantity).toLocaleString('id-ID')}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between mt-5">
            <span className="font-display text-base text-ink-950">Total</span>
            <span className="font-display text-xl font-bold text-ink-950">
              Rp {Number(total).toLocaleString('id-ID')}
            </span>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2 mt-4">
              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 m-0">{error}</p>
            </div>
          )}

          {statusText && placingOrder && (
            <p className="text-sm text-ink-700/60 mt-4">{statusText}</p>
          )}

          <button
            onClick={handlePlaceOrder}
            disabled={placingOrder}
            className="mt-6 w-full py-2.5 rounded-lg bg-ink-900 text-brass-400 font-medium hover:bg-ink-950 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {placingOrder && <Loader2 className="h-4 w-4 animate-spin" />}
            {placingOrder ? 'Memproses...' : 'Buat pesanan dan bayar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Checkout
