import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { ImageOff, PackageX, RefreshCw, AlertTriangle } from 'lucide-react'

function ProductCardSkeleton() {
  return (
    <div className="rounded-xl border border-ink-900/[0.06] overflow-hidden animate-pulse">
      <div className="w-full h-40 bg-ink-900/[0.06]" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-3/4 rounded bg-ink-900/[0.08]" />
        <div className="h-4 w-1/2 rounded bg-ink-900/[0.08]" />
      </div>
    </div>
  )
}

function ProductCard({ product }) {
  const images = [...(product.product_images || [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  )
  const coverImage = images[0]?.url
  const hasDiscount =
    product.compare_at_price && Number(product.compare_at_price) > Number(product.base_price)
  const isOutOfStock = product.stock !== undefined && product.stock !== null && product.stock <= 0

  return (
    <Link
      to={`/produk/${product.id}`}
      className="group block rounded-xl border border-ink-900/[0.06] overflow-hidden bg-white shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-md"
    >
      <div className="relative w-full h-40 bg-ink-900/[0.04] overflow-hidden">
        {coverImage ? (
          <img
            src={coverImage}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-700/30">
            <ImageOff size={32} />
          </div>
        )}

        {hasDiscount && (
          <span className="absolute top-2 left-2 text-[11px] font-medium px-2 py-0.5 rounded-md bg-rose-500 text-white shadow-sm">
            Diskon
          </span>
        )}
        {isOutOfStock && (
          <span className="absolute inset-0 bg-white/70 flex items-center justify-center text-sm font-medium text-ink-700">
            Stok habis
          </span>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-display text-sm font-semibold text-ink-950 truncate">
          {product.name}
        </h3>
        <div className="flex items-baseline gap-2 mt-1">
          <p className="font-display font-bold text-ink-950">
            Rp {Number(product.base_price).toLocaleString('id-ID')}
          </p>
          {hasDiscount && (
            <p className="text-xs text-ink-700/40 line-through">
              Rp {Number(product.compare_at_price).toLocaleString('id-ID')}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('products')
      .select('*, product_images(url, sort_order)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setProducts(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return (
    <div className="p-4">
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center text-center py-16 gap-3">
          <AlertTriangle size={32} className="text-rose-500" />
          <p className="text-sm text-ink-700">Gagal memuat produk: {error}</p>
          <button
            onClick={fetchProducts}
            className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-ink-950 text-white hover:bg-ink-900 transition-colors"
          >
            <RefreshCw size={14} />
            Coba lagi
          </button>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center py-16 gap-3">
          <PackageX size={32} className="text-ink-700/30" />
          <p className="text-sm text-ink-700/60">Belum ada produk.</p>
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
