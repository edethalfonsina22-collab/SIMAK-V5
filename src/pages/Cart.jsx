import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { ShoppingCart, ImageOff, Minus, Plus, Trash2, Loader2, AlertTriangle } from 'lucide-react'

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="flex items-center gap-2 text-ink-700/70 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Memuat keranjang...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper px-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <AlertTriangle className="h-6 w-6 text-red-500" />
          <p className="text-sm text-ink-700">Gagal memuat keranjang: {error}</p>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-panel border border-ink-900/5 p-8 text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-ink-900 flex items-center justify-center">
            <ShoppingCart className="h-6 w-6 text-brass-400" strokeWidth={2} />
          </div>
          <h2 className="font-display text-2xl text-ink-950">Keranjang</h2>
          <p className="text-sm text-ink-700/70 mt-1 mb-5">Keranjang kamu masih kosong.</p>
          <Link
            to="/"
            className="inline-block w-full py-2.5 rounded-lg bg-ink-900 text-brass-400 font-medium hover:bg-ink-950 active:scale-[0.98] transition"
          >
            Lihat produk
          </Link>
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
              <ShoppingCart className="h-5 w-5 text-brass-400" strokeWidth={2} />
            </div>
            <div>
              <h2 className="font-display text-2xl text-ink-950">Keranjang</h2>
              <p className="text-sm text-ink-700/70">{items.length} produk di keranjang Anda</p>
            </div>
          </div>

          <div className="divide-y divide-ink-900/10 border-t border-b border-ink-900/10">
            {items.map((item) => {
              const variant = item.product_variants
              const product = variant.products
              const images = [...(product.product_images || [])].sort(
                (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
              )
              const price = priceOf(item)
              const variantLabel = [variant.size, variant.color].filter(Boolean).join(' - ')

              return (
                <div key={item.id} className="flex gap-3 py-4">
                  <div className="h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-ink-900/[0.04]">
                    {images[0]?.url ? (
                      <img
                        src={images[0].url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ink-700/30">
                        <ImageOff size={20} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {product.stores?.name && (
                      <p className="text-xs text-ink-700/60 m-0">{product.stores.name}</p>
                    )}
                    <p className="text-sm font-medium text-ink-950 truncate mt-0.5">
                      {product.name}
                    </p>
                    {variantLabel && (
                      <p className="text-xs text-ink-700/60 mt-0.5">{variantLabel}</p>
                    )}
                    <p className="text-sm font-medium text-ink-950 mt-1">
                      Rp {Number(price).toLocaleString('id-ID')}
                    </p>

                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-ink-900/15 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="h-7 w-7 flex items-center justify-center text-ink-700 hover:bg-ink-900/5 transition-colors"
                          aria-label="Kurangi jumlah"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-8 text-center text-sm text-ink-950">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="h-7 w-7 flex items-center justify-center text-ink-700 hover:bg-ink-900/5 transition-colors"
                          aria-label="Tambah jumlah"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 size={13} />
                        Hapus
                      </button>
                    </div>
                  </div>

                  <div className="text-sm font-semibold text-ink-950 whitespace-nowrap">
                    Rp {Number(price * item.quantity).toLocaleString('id-ID')}
                  </div>
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

          <button
            onClick={() => navigate('/checkout')}
            className="mt-6 w-full py-2.5 rounded-lg bg-ink-900 text-brass-400 font-medium hover:bg-ink-950 active:scale-[0.98] transition"
          >
            Lanjut ke checkout
          </button>
        </div>
      </div>
    </div>
  )
}

export default Cart
