import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/Layout'
import { Plus, Trash2, X, Loader2 } from 'lucide-react'
export default function Pengumuman() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [judul, setJudul] = useState('')
  const [isi, setIsi] = useState('')
  const [saving, setSaving] = useState(false)
  async function loadData() {
    setLoading(true)
    const { data } = await supabase.from('pengumuman').select('*').order('dibuat_pada', { ascending: false })
    setData(data || [])
    setLoading(false)
  }
  useEffect(() => { loadData() }, [])
  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('pengumuman').insert({ judul, isi })
    setSaving(false)
    if (!error) { setShowForm(false); setJudul(''); setIsi(''); loadData() }
    else alert('Gagal menyimpan: ' + error.message)
  }
  async function handleDelete(id) {
    if (!confirm('Hapus pengumuman ini?')) return
    const { error } = await supabase.from('pengumuman').delete().eq('id', id)
    if (!error) loadData()
  }
  return (
    <Layout title="Pengumuman" subtitle="Informasi untuk seluruh warga sekolah" actions={
      <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#1E4429] text-white hover:bg-[#2B5936] transition-colors shadow-sm shadow-[#1E4429]/30" onClick={() => setShowForm(true)}><Plus size={16} /> Buat Pengumuman</button>
    }>
      <div className="min-h-screen bg-gradient-to-b from-[#F5F9F2] to-[#EAF3EA] -m-4 p-4 rounded-xl">
      <div className="space-y-4">
        {loading && <p className="text-sm text-[#1E4429]/50">Memuat data...</p>}
        {!loading && data.length === 0 && <p className="text-sm text-[#1E4429]/50">Belum ada pengumuman.</p>}
        {data.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-[#1E4429]/10 shadow-sm p-5 border-l-4 border-l-[#E8B33D]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-display text-lg font-semibold text-[#0F2318]">{p.judul}</p>
                <p className="text-xs text-[#1E4429]/40 mt-0.5">{new Date(p.dibuat_pada).toLocaleString('id-ID')}</p>
              </div>
              <button onClick={() => handleDelete(p.id)} className="p-2 hover:bg-[#1E4429]/10 rounded-lg text-[#B91C1C] shrink-0"><Trash2 size={15} /></button>
            </div>
            <p className="text-sm text-[#0F2318]/80 mt-3 whitespace-pre-wrap">{p.isi}</p>
          </div>
        ))}
      </div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F2318]/50 backdrop-blur-sm p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative border-t-4 border-[#1E4429]">
            <button type="button" onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-[#1E4429]/40 hover:text-[#1E4429]"><X size={20} /></button>
            <h2 className="font-display text-xl font-semibold mb-4 text-[#0F2318]">Buat Pengumuman</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#1E4429]/70 uppercase tracking-wide mb-1.5 block">Judul</label>
                <input required className="w-full px-3 py-2 rounded-lg border border-[#1E4429]/15 focus:border-[#1E4429] focus:ring-2 focus:ring-[#1E4429]/20 outline-none transition-colors" value={judul} onChange={(e) => setJudul(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-[#1E4429]/70 uppercase tracking-wide mb-1.5 block">Isi</label>
                <textarea required rows={5} className="w-full px-3 py-2 rounded-lg border border-[#1E4429]/15 focus:border-[#1E4429] focus:ring-2 focus:ring-[#1E4429]/20 outline-none transition-colors" value={isi} onChange={(e) => setIsi(e.target.value)} />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" className="px-4 py-2 rounded-lg text-sm font-medium bg-[#EAF3EA] text-[#1E4429] hover:bg-[#DBE9DB] transition-colors" onClick={() => setShowForm(false)}>Batal</button>
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#1E4429] text-white hover:bg-[#2B5936] transition-colors disabled:opacity-50">{saving && <Loader2 size={16} className="animate-spin" />} Terbitkan</button>
            </div>
          </form>
        </div>
      )}
      </div>
    </Layout>
  )
}
