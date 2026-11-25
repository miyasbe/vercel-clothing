'use client';
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingBag, X, Upload, Plus, Minus, Scissors, Layers, Search } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import {
  GARMENTS, COLORS, PLACEMENTS, THREADS, FONTS, TIERS, unitPrice, tierDiscount, eur,
  type CartItem, type GarmentId, type ColorId, type PlacementId, type ThreadId, type FontId,
} from '@/lib/catalog';

const SHAPES: Record<GarmentId, string> = {
  hoodie: 'M60 30 L85 20 Q100 34 115 20 L140 30 L180 80 L158 98 L145 82 L145 180 L55 180 L55 82 L42 98 L20 80 Z',
  tee: 'M65 28 Q100 44 135 28 L180 55 L165 85 L145 75 L145 175 L55 175 L55 75 L35 85 L20 55 Z',
  cap: 'M30 120 Q30 50 100 50 Q170 50 170 120 L190 128 Q100 150 10 128 Z',
  crew: 'M65 28 Q100 40 135 28 L185 90 L162 108 L145 90 L145 180 L55 180 L55 90 L38 108 L15 90 Z',
};
const POS: Record<PlacementId, [number, number]> = { left_chest: [130, 78], center_chest: [100, 105], sleeve_cuff: [168, 92], back_neck: [100, 50] };
const EXT = ['png', 'svg', 'ai', 'dst'];
const Emblem = () => (
  <svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="3 2"><circle cx="16" cy="16" r="13" /><path d="M9 20 L16 8 L23 20 M11.5 16 H20.5" /></svg>
);

export default function Storefront() {
  const [garment, setGarment] = useState<GarmentId>('hoodie');
  const [color, setColor] = useState<ColorId>('black');
  const [placement, setPlacement] = useState<PlacementId>('left_chest');
  const [text, setText] = useState('STITCH CO');
  const [font, setFont] = useState<FontId>('varsity');
  const [thread, setThread] = useState<ThreadId>('ivory');
  const [qty, setQty] = useState(1);
  const [art, setArt] = useState<{ path: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [cust, setCust] = useState({ name: '', email: '', notes: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => { try { setCart(JSON.parse(localStorage.getItem('stitch-cart') || '[]')); } catch { /* ignore */ } }, []);
  useEffect(() => { localStorage.setItem('stitch-cart', JSON.stringify(cart)); }, [cart]);

  const price = useMemo(() => unitPrice({ garment, placement, text, artworkPath: art?.path ?? null, qty }), [garment, placement, text, art, qty]);
  const count = cart.reduce((n, i) => n + i.qty, 0);
  const subtotal = cart.reduce((n, i) => n + unitPrice({ ...i, artworkPath: i.artworkPath }) * i.qty, 0);
  const [px, py] = garment === 'cap' ? [100, 95] : POS[placement];

  async function upload(file: File) {
    setErr('');
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!EXT.includes(ext)) return setErr('Use .PNG, .SVG, .AI or .DST files.');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return setErr('Uploads are not configured yet (Supabase env missing).');
    setUploading(true);
    const path = `uploads/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, '_')}`;
    const { error } = await createBrowserClient(url, key).storage.from('embroidery-artwork').upload(path, file);
    setUploading(false);
    if (error) return setErr(error.message);
    setArt({ path, name: file.name });
  }
  function add() {
    setCart((c) => [...c, { id: crypto.randomUUID(), garment, color, placement, text: text.slice(0, 20), font, thread, artworkPath: art?.path ?? null, artworkName: art?.name ?? null, qty }]);
    setOpen(true);
  }
  const setQ = (id: string, d: number) => setCart((c) => c.map((i) => (i.id === id ? { ...i, qty: Math.max(1, i.qty + d) } : i)));
  async function checkout() {
    setErr(''); setBusy(true);
    try {
      const r = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: cart, customer: cust }) });
      const j = (await r.json()) as { url?: string; error?: string };
      if (!r.ok || !j.url) throw new Error(j.error || 'Checkout failed');
      window.location.href = j.url;
    } catch (e) { setErr(e instanceof Error ? e.message : 'Checkout failed'); setBusy(false); }
  }
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const chip = (on: boolean) => `sans text-sm px-3 py-1.5 border ${on ? 'bg-thread text-cotton border-thread' : 'border-weave hover:border-thread'}`;

  return (
    <div>
      <nav className="sticky top-0 z-30 bg-cotton/90 backdrop-blur border-b border-dashed border-weave">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2"><Emblem /><span className="tracking-[0.25em] text-sm font-semibold">STITCH STUDIO</span></div>
          <div className="hidden md:flex gap-7 sans text-sm">
            {[['Studio', 'studio'], ['Garments', 'garments'], ['Bulk & Corporate', 'bulk'], ['Process', 'process']].map(([l, id]) => <button key={id} onClick={() => go(id)} className="hover:text-ochre">{l}</button>)}
          </div>
          <button onClick={() => setOpen(true)} className="sans relative flex items-center gap-2 text-sm border border-thread px-3 py-1.5"><ShoppingBag size={16} />Order<span className="bg-ochre text-white text-xs rounded-full px-1.5">{count}</span></button>
        </div>
      </nav>

      <header className="max-w-6xl mx-auto px-5 py-20 md:py-28">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-5xl md:text-7xl leading-[1.05] max-w-4xl">Stitched, Never Printed. Heavyweight Garments Built to Last.</motion.h1>
        <div className="flex flex-wrap gap-3 mt-9 sans">
          <button onClick={() => go('studio')} className="bg-thread text-cotton px-6 py-3">Launch Stitch Customizer</button>
          <button onClick={() => go('bulk')} className="border border-thread px-6 py-3">Bulk Orders</button>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-2 mt-10 pt-6 border-t border-dashed border-weave sans text-sm text-thread/70">
          <span>✦ No Minimums</span><span>✦ 15-Color Pantone Thread Matching</span><span>✦ High-Density Satin Stitch</span>
        </div>
      </header>

      <section id="studio" className="border-y border-dashed border-weave bg-white/50">
        <div className="max-w-6xl mx-auto px-5 py-16 grid md:grid-cols-2 gap-10">
          <div className="border border-weave bg-cotton flex flex-col items-center justify-center p-6">
            <svg viewBox="0 0 200 200" className="w-full max-w-md">
              <path d={SHAPES[garment]} fill={COLORS[color].hex} stroke="#00000030" strokeWidth="1.5" strokeDasharray="4 3" />
              {text && <text x={px} y={py} textAnchor="middle" fontSize={garment === 'cap' ? 12 : 11} fontFamily={FONTS[font].css} fill={THREADS[thread].hex} stroke="#00000040" strokeWidth=".4" style={{ letterSpacing: 1 }}>{text}</text>}
              {art && <rect x={px - 12} y={py + 6} width="24" height="14" fill="none" stroke={THREADS[thread].hex} strokeDasharray="2 1.5" />}
            </svg>
            <p className="sans text-xs mt-3 bg-ochre/10 text-ochre px-2 py-1">{GARMENTS[garment].gsm}</p>
          </div>
          <div className="sans space-y-5">
            <h2 className="text-3xl" style={{ fontFamily: 'Georgia, serif' }}>Live Embroidery Customizer</h2>
            <div className="flex flex-wrap gap-2">{(Object.keys(GARMENTS) as GarmentId[]).map((g) => <button key={g} className={chip(g === garment)} onClick={() => setGarment(g)}>{GARMENTS[g].name}</button>)}</div>
            <div className="flex gap-2">{(Object.keys(COLORS) as ColorId[]).map((c) => <button key={c} title={COLORS[c].name} onClick={() => setColor(c)} className={`w-8 h-8 rounded-full border-2 ${c === color ? 'border-ochre' : 'border-weave'}`} style={{ background: COLORS[c].hex }} />)}</div>
            <div className="flex flex-wrap gap-2">{(Object.keys(PLACEMENTS) as PlacementId[]).map((p) => <button key={p} className={chip(p === placement)} onClick={() => setPlacement(p)}>{PLACEMENTS[p].name}</button>)}</div>
            <input value={text} maxLength={20} onChange={(e) => setText(e.target.value)} placeholder="Custom text (max 20)" className="w-full border border-weave bg-white px-3 py-2" />
            <div className="flex flex-wrap gap-2">{(Object.keys(FONTS) as FontId[]).map((f) => <button key={f} className={chip(f === font)} onClick={() => setFont(f)} style={{ fontFamily: FONTS[f].css }}>{FONTS[f].name}</button>)}</div>
            <div className="flex gap-2 items-center">{(Object.keys(THREADS) as ThreadId[]).map((t) => <button key={t} title={THREADS[t].name} onClick={() => setThread(t)} className={`w-6 h-6 rounded-full border-2 ${t === thread ? 'border-ochre scale-110' : 'border-weave'}`} style={{ background: THREADS[t].hex }} />)}</div>
            <label onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) void upload(f); }} className="flex flex-col items-center gap-1 border border-dashed border-thread/40 p-5 text-sm cursor-pointer hover:bg-white">
              <Upload size={18} />{uploading ? 'Uploading…' : art ? `✓ ${art.name}` : 'Drop artwork (.PNG .SVG .AI .DST) or click'}
              <input type="file" accept=".png,.svg,.ai,.dst" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} />
            </label>
            {err && <p className="text-red-700 text-sm">{err}</p>}
            <div className="flex items-center gap-3">
              <span className="text-sm">Qty</span>
              {TIERS.slice().reverse().map((t) => <button key={t.min} className={chip(qty === t.min)} onClick={() => setQty(t.min)}>{t.min === 1 ? '1' : `${t.min}+`}</button>)}
            </div>
            <div className="flex items-end justify-between border-t border-dashed border-weave pt-4">
              <div><div className="text-3xl" style={{ fontFamily: 'Georgia, serif' }}>{eur(price)} <span className="text-sm text-thread/60">/ unit</span></div>
                <div className="text-xs text-sage">{tierDiscount(qty) ? `${tierDiscount(qty) * 100}% bulk discount applied` : 'Order 10+ to save 10%'} · total {eur(price * qty)}</div></div>
              <button onClick={add} className="bg-ochre text-white px-6 py-3">Add to Order</button>
            </div>
          </div>
        </div>
      </section>

      <section id="garments" className="max-w-6xl mx-auto px-5 py-16">
        <h2 className="text-3xl mb-8">Garment Blanks</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {(Object.keys(GARMENTS) as GarmentId[]).map((g) => (
            <button key={g} onClick={() => { setGarment(g); go('studio'); }} className="text-left border border-weave bg-white p-4 hover:border-thread">
              <svg viewBox="0 0 200 200" className="w-full h-32"><path d={SHAPES[g]} fill={COLORS.bone.hex} stroke="#00000030" strokeDasharray="4 3" /></svg>
              <div className="mt-2">{GARMENTS[g].name}</div><div className="sans text-xs text-thread/60">{GARMENTS[g].gsm}</div><div className="sans text-sm mt-1">from {eur(GARMENTS[g].base)}</div>
            </button>))}
        </div>
      </section>

      <section id="process" className="max-w-6xl mx-auto px-5 pb-16">
        <div className="grid md:grid-cols-3 gap-6 border-t border-dashed border-weave pt-12">
          {[[Scissors, 'Digitizing', 'Your artwork is mapped into a stitch file by hand.'], [Layers, 'High-Density Threading', 'Satin and fill stitches at premium density.'], [Search, 'Inspection & Pressing', 'Every piece trimmed, checked and pressed.']].map(([I, t, d], n) => {
            const Icon = I as typeof Scissors;
            return <div key={n as number}><Icon className="text-ochre" /><div className="text-xl mt-2">{n as number + 1}. {t as string}</div><p className="sans text-sm text-thread/70">{d as string}</p></div>;
          })}
        </div>
      </section>

      <section id="bulk" className="bg-thread text-cotton">
        <div className="max-w-6xl mx-auto px-5 py-14 sans">
          <h2 className="text-3xl" style={{ fontFamily: 'Georgia, serif' }}>Bulk & Corporate</h2>
          <p className="mt-2 text-cotton/70">Automatic discounts: 10+ save 10%, 25+ save 18%, 50+ save 25%. Larger runs? Add a note at checkout with your deadline.</p>
        </div>
      </section>

      <AnimatePresence>
        {open && (<>
          <motion.div className="fixed inset-0 bg-black/40 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
          <motion.aside className="sans fixed right-0 top-0 h-full w-full max-w-md bg-cotton z-50 flex flex-col" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween' }}>
            <div className="flex justify-between items-center p-5 border-b border-dashed border-weave"><h3 className="text-lg">Your Order</h3><button onClick={() => setOpen(false)}><X /></button></div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {!cart.length && <p className="text-sm text-thread/60">Nothing here yet.</p>}
              {cart.map((i) => (
                <div key={i.id} className="flex gap-3 border border-weave bg-white p-3">
                  <svg viewBox="0 0 200 200" className="w-16 h-16 shrink-0"><path d={SHAPES[i.garment]} fill={COLORS[i.color].hex} /></svg>
                  <div className="flex-1 text-sm">
                    <div>{GARMENTS[i.garment].name} · {COLORS[i.color].name}</div>
                    <div className="text-xs text-thread/60">{PLACEMENTS[i.placement].name}{i.text && ` · “${i.text}” (${FONTS[i.font].name}, ${THREADS[i.thread].name})`}{i.artworkName && ` · ${i.artworkName}`}</div>
                    <div className="flex items-center gap-2 mt-1"><button onClick={() => setQ(i.id, -1)}><Minus size={14} /></button>{i.qty}<button onClick={() => setQ(i.id, 1)}><Plus size={14} /></button>
                      <span className="ml-auto">{eur(unitPrice(i) * i.qty)}</span><button onClick={() => setCart((c) => c.filter((x) => x.id !== i.id))}><X size={14} /></button></div>
                  </div>
                </div>))}
            </div>
            <div className="p-5 border-t border-dashed border-weave space-y-2">
              <input placeholder="Full name" value={cust.name} onChange={(e) => setCust({ ...cust, name: e.target.value })} className="w-full border border-weave px-3 py-2 bg-white text-sm" />
              <input type="email" placeholder="Email" value={cust.email} onChange={(e) => setCust({ ...cust, email: e.target.value })} className="w-full border border-weave px-3 py-2 bg-white text-sm" />
              <textarea placeholder="Shipping notes / deadline" value={cust.notes} onChange={(e) => setCust({ ...cust, notes: e.target.value })} className="w-full border border-weave px-3 py-2 bg-white text-sm" rows={2} />
              {err && <p className="text-red-700 text-xs">{err}</p>}
              <div className="flex justify-between"><span>Subtotal</span><span>{eur(subtotal)}</span></div>
              <button disabled={!cart.length || !cust.name || !cust.email || busy} onClick={checkout} className="w-full bg-thread text-cotton py-3 disabled:opacity-40">{busy ? 'Redirecting…' : 'Proceed to Secure Checkout'}</button>
            </div>
          </motion.aside>
        </>)}
      </AnimatePresence>
    </div>
  );
}
