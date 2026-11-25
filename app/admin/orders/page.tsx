import { getAdmin } from '@/lib/server';
import { eur } from '@/lib/catalog';
export const dynamic = 'force-dynamic';

interface Item { garment: string; color: string; placement: string; custom_text: string; thread_color: string; font: string; artwork_url: string | null; artwork_name: string | null; quantity: number; unit_price: number }
interface Order { id: string; created_at: string; customer_name: string; customer_email: string; shipping_address: unknown; items: Item[]; total_amount: number; status: string; notes: string | null }

export default async function Orders({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const { key } = await searchParams;
  if (!process.env.ADMIN_SECRET_KEY || key !== process.env.ADMIN_SECRET_KEY)
    return <main className="p-10 sans">Unauthorized. Use /admin/orders?key=YOUR_ADMIN_SECRET_KEY</main>;
  const db = getAdmin();
  const { data } = await db.from('orders').select('*').eq('status', 'paid').order('created_at', { ascending: false });
  const orders = (data ?? []) as Order[];
  const signed = new Map<string, string>();
  for (const o of orders) for (const i of o.items) if (i.artwork_url) {
    const { data: s } = await db.storage.from('embroidery-artwork').createSignedUrl(i.artwork_url, 3600);
    if (s?.signedUrl) signed.set(i.artwork_url, s.signedUrl);
  }
  return (
    <main className="max-w-5xl mx-auto p-6 sans">
      <h1 className="text-2xl mb-6" style={{ fontFamily: 'Georgia, serif' }}>Paid Orders ({orders.length})</h1>
      {orders.map((o) => (
        <section key={o.id} className="border border-dashed border-weave bg-white p-4 mb-4">
          <div className="flex justify-between text-sm"><b>{o.customer_name}</b><span>{eur(o.total_amount)} · {new Date(o.created_at).toLocaleString('en-GB')}</span></div>
          <div className="text-xs text-thread/60">{o.customer_email}{o.notes && ` · Note: ${o.notes}`}</div>
          <pre className="text-xs bg-cotton p-2 my-2 overflow-x-auto">{JSON.stringify(o.shipping_address, null, 1)}</pre>
          {o.items.map((i, n) => (
            <div key={n} className="text-sm border-t border-dashed border-weave py-2">
              {i.quantity}× {i.garment} / {i.color} / {i.placement} — “{i.custom_text}” {i.font}, thread {i.thread_color} @ {eur(i.unit_price)}
              {i.artwork_url && signed.get(i.artwork_url) && <> · <a className="text-ochre underline" href={signed.get(i.artwork_url)}>Download {i.artwork_name}</a></>}
            </div>))}
        </section>))}
    </main>
  );
}
