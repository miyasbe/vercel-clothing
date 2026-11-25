import Link from 'next/link';
import ClearCart from '@/components/ClearCart';
import { getStripe } from '@/lib/server';
import { eur } from '@/lib/catalog';
export const dynamic = 'force-dynamic';

export default async function Success({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  let paid = false, total = 0, email = '', id = '';
  try {
    if (session_id) {
      const s = await getStripe().checkout.sessions.retrieve(session_id);
      paid = s.payment_status === 'paid'; total = s.amount_total ?? 0; email = s.customer_details?.email ?? ''; id = s.metadata?.order_id ?? '';
    }
  } catch { /* fall through to unverified state */ }
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      {paid && <ClearCart />}
      <div className="max-w-md w-full border border-dashed border-thread/40 bg-white p-8 text-center">
        <h1 className="text-3xl">{paid ? 'Order Stitched In.' : 'Payment Not Verified'}</h1>
        {paid ? (
          <div className="sans text-sm mt-5 space-y-1 border-t border-dashed border-weave pt-4">
            <p>Receipt no. <span className="font-mono">{id.slice(0, 8).toUpperCase()}</span></p>
            <p>Total paid: <b>{eur(total)}</b></p>
            <p>Confirmation sent to {email}</p>
          </div>
        ) : <p className="sans text-sm mt-4">We couldn&apos;t confirm this payment. If you were charged, contact us.</p>}
        <Link href="/" className="sans inline-block mt-6 bg-thread text-cotton px-5 py-2 text-sm">Back to Studio</Link>
      </div>
    </main>
  );
}
