import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

function generateOrderNumber() {
  const now = new Date()
  const stamp = now.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)
  const random = Math.floor(Math.random() * 900 + 100)
  return `ORD-${stamp}-${random}`
}

function Checkout() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [placingOrder, setPlacingOrder] = useState(false)

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

    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData.session.user.id

    const total = items.reduce((sum, item) => sum + priceOf(item) * item.quantity, 0)

    // 1. Buat order utama
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id: userId,
        order_number: generateOrderNumber(),
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

    setPlacingOrder(false)
    navigate(`/pesanan-berhasil/${order.id}`)
  }

  if (loading) return <p style={{ padding: '16px' }}>Memuat checkout...</p>

  const total = items.reduce((sum, item) => sum + priceOf(item) * item.quantity, 0)

  return (
    <div style={{ padding: '16px', maxWidth: '600px' }}>
      <h2>Checkout</h2>

      {items.map((item) => {
        const variant = item.product_variants
        const product = variant.products
        return (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
            <span>
              {product.name} ({[variant.size, variant.color].filter(Boolean).join(' - ')}) x{item.quantity}
            </span>
            <span>Rp {Number(priceOf(item) * item.quantity).toLocaleString('id-ID')}</span>
          </div>
        )
      })}

      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem' }}>
        <span>Total</span>
        <span>Rp {Number(total).toLocaleString('id-ID')}</span>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <p style={{ color: '#888', fontSize: '0.9rem', marginTop: '12px' }}>
        Pembayaran online (Midtrans) belum terhubung — order akan dibuat dengan status "pending" dulu.
      </p>

      <button
        onClick={handlePlaceOrder}
        disabled={placingOrder}
        style={{ marginTop: '12px', padding: '12px 20px', cursor: 'pointer', width: '100%' }}
      >
        {placingOrder ? 'Memproses...' : 'Buat Pesanan'}
      </button>
    </div>
  )
}

export default Checkout
