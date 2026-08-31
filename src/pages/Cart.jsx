import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

function Cart() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetchCart() {
    setLoading(true)
    setError(null)

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
          stock,
          price_override,
          products (
            id,
            name,
            base_price,
            store_id,
            stores ( id, name ),
            product_images ( url, sort_order )
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error) {
      setError(error.message)
    } else {
      setItems(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchCart()
  }, [])

  async function updateQuantity(cartItemId, newQuantity) {
    if (newQuantity < 1) return
    await supabase.from('cart_items').update({ quantity: newQuantity }).eq('id', cartItemId)
    fetchCart()
  }

  async function removeItem(cartItemId) {
    await supabase.from('cart_items').delete().eq('id', cartItemId)
    fetchCart()
  }

  function priceOf(item) {
    const variant = item.product_variants
    return variant.price_override ?? variant.products.base_price
  }

  if (loading) return <p style={{ padding: '16px' }}>Memuat keranjang...</p>
  if (error) return <p style={{ padding: '16px', color: 'red' }}>Gagal memuat keranjang: {error}</p>

  if (items.length === 0) {
    return (
      <div style={{ padding: '16px' }}>
        <h2>Keranjang</h2>
        <p>Keranjang kamu masih kosong.</p>
        <Link to="/">Lihat produk</Link>
      </div>
    )
  }

  const total = items.reduce((sum, item) => sum + priceOf(item) * item.quantity, 0)

  return (
    <div style={{ padding: '16px', maxWidth: '700px' }}>
      <h2>Keranjang</h2>

      {items.map((item) => {
        const variant = item.product_variants
        const product = variant.products
        const images = [...(product.product_images || [])].sort(
          (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
        )
        const price = priceOf(item)

        return (
          <div
            key={item.id}
            style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #eee', padding: '12px 0' }}
          >
            {images[0]?.url && (
              <img
                src={images[0].url}
                alt={product.name}
                style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px' }}
              />
            )}

            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#888' }}>{product.stores?.name}</p>
              <p style={{ margin: '2px 0', fontWeight: 'bold' }}>{product.name}</p>
              <p style={{ margin: '2px 0', fontSize: '0.9rem', color: '#555' }}>
                {[variant.size, variant.color].filter(Boolean).join(' - ')}
              </p>
              <p style={{ margin: '2px 0' }}>Rp {Number(price).toLocaleString('id-ID')}</p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ cursor: 'pointer' }}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ cursor: 'pointer' }}>+</button>
                <button onClick={() => removeItem(item.id)} style={{ marginLeft: '12px', color: 'red', cursor: 'pointer' }}>
                  Hapus
                </button>
              </div>
            </div>

            <div style={{ fontWeight: 'bold' }}>
              Rp {Number(price * item.quantity).toLocaleString('id-ID')}
            </div>
          </div>
        )
      })}

      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem' }}>
        <span>Total</span>
        <span>Rp {Number(total).toLocaleString('id-ID')}</span>
      </div>

      <button
        onClick={() => navigate('/checkout')}
        style={{ marginTop: '16px', padding: '12px 20px', cursor: 'pointer', width: '100%' }}
      >
        Lanjut ke Checkout
      </button>
    </div>
  )
}

export default Cart
