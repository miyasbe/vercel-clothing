import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Stitch Studio — Custom Embroidery', description: 'Stitched, never printed. Heavyweight custom embroidered garments.' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body>{children}</body></html>);
}
