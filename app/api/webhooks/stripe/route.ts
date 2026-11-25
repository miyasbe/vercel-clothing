import type Stripe from 'stripe';
import { getAdmin, getStripe } from '@/lib/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ship = { shipping_details?: unknown; collected_information?: { shipping_details?: unknown } };

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) return new Response('Missing signature or secret', { status: 400 });
  const raw = await req.text();
  let event: Stripe.Event;
  try { event = getStripe().webhooks.constructEvent(raw, sig, secret); }
  catch { return new Response('Invalid signature', { status: 400 }); }

  if (event.type === 'checkout.session.completed') {
    const s = event.data.object as Stripe.Checkout.Session;
    const orderId = s.metadata?.order_id;
    if (orderId) {
      const x = s as unknown as Ship;
      const shipping = x.collected_information?.shipping_details ?? x.shipping_details ?? null;
      const { error } = await getAdmin().from('orders').update({ status: 'paid', shipping_address: shipping, stripe_session_id: s.id }).eq('id', orderId);
      if (error) return new Response(error.message, { status: 500 });
    }
  }
  return Response.json({ received: true });
}
