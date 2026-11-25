import { NextResponse } from 'next/server';
import { getAdmin, getStripe } from '@/lib/server';
import { GARMENTS, COLORS, PLACEMENTS, THREADS, FONTS, unitPrice, type CartItem } from '@/lib/catalog';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Body { items?: unknown; customer?: { name?: string; email?: string; notes?: string } }

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const c = body.customer;
    if (!c?.name?.trim() || !c.email?.includes('@')) return NextResponse.json({ error: 'Name and valid email required' }, { status: 400 });
    if (!Array.isArray(body.items) || !body.items.length || body.items.length > 25) return NextResponse.json({ error: 'Invalid cart' }, { status: 400 });

    const items = (body.items as Partial<CartItem>[]).map((i) => {
      if (!i.garment || !(i.garment in GARMENTS) || !i.color || !(i.color in COLORS) || !i.placement || !(i.placement in PLACEMENTS)
        || !i.thread || !(i.thread in THREADS) || !i.font || !(i.font in FONTS)) throw new Error('Invalid item');
      const qty = Number(i.qty);
      if (!Number.isInteger(qty) || qty < 1 || qty > 500) throw new Error('Invalid quantity');
      const text = String(i.text ?? '').slice(0, 20);
      const artworkPath = typeof i.artworkPath === 'string' && i.artworkPath.startsWith('uploads/') ? i.artworkPath : null;
      const unit = unitPrice({ garment: i.garment, placement: i.placement, text, artworkPath, qty });
      return { garment: i.garment, color: i.color, placement: i.placement, custom_text: text, font: i.font, thread_color: i.thread,
        artwork_url: artworkPath, artwork_name: i.artworkName ?? null, quantity: qty, unit_price: unit };
    });
    const total = items.reduce((n, i) => n + i.unit_price * i.quantity, 0);

    const db = getAdmin();
    const { data: order, error } = await db.from('orders').insert({
      customer_name: c.name.trim(), customer_email: c.email.trim(), items, total_amount: total, currency: 'eur', status: 'pending', notes: c.notes ?? null,
    }).select('id').single();
    if (error || !order) throw new Error(error?.message ?? 'Could not create order');

    const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      customer_email: c.email.trim(),
      shipping_address_collection: { allowed_countries: ['BE', 'NL', 'DE', 'FR', 'LU', 'GB', 'IE', 'ES', 'IT', 'AT', 'US', 'CA'] },
      line_items: items.map((i) => ({
        quantity: i.quantity,
        price_data: {
          currency: 'eur', unit_amount: i.unit_price,
          product_data: {
            name: `${GARMENTS[i.garment].name} — ${COLORS[i.color].name}`,
            description: `${PLACEMENTS[i.placement].name}${i.custom_text ? ` · "${i.custom_text}" in ${THREADS[i.thread_color].name} thread` : ''}${i.artwork_name ? ` · Artwork: ${i.artwork_name}` : ''}`.slice(0, 500),
          },
        },
      })),
      metadata: { order_id: order.id },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#studio`,
    });
    await db.from('orders').update({ stripe_session_id: session.id }).eq('id', order.id);
    return NextResponse.json({ url: session.url });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Checkout error' }, { status: 500 });
  }
}
