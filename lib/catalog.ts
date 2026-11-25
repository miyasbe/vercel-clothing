export const GARMENTS = {
  hoodie: { name: 'Heavyweight Hoodie', gsm: '450 GSM Heavyweight French Terry', base: 6800 },
  tee: { name: 'Boxy Tee', gsm: '260 GSM Combed Cotton Jersey', base: 3800 },
  cap: { name: 'Dad Cap', gsm: '6-Panel Brushed Cotton Twill', base: 3200 },
  crew: { name: 'Crewneck Sweatshirt', gsm: '400 GSM Loopback Fleece', base: 5800 },
} as const;
export const COLORS = {
  black: { name: 'Vintage Black', hex: '#27272a' },
  bone: { name: 'Washed Bone', hex: '#e7e0d0' },
  green: { name: 'Forest Green', hex: '#2f4a33' },
  navy: { name: 'Navy', hex: '#1e2a44' },
  grey: { name: 'Heather Grey', hex: '#9ca3af' },
} as const;
export const PLACEMENTS = {
  left_chest: { name: 'Left Chest', add: 0 },
  center_chest: { name: 'Center Chest', add: 600 },
  sleeve_cuff: { name: 'Sleeve Cuff', add: 500 },
  back_neck: { name: 'Back Neck', add: 400 },
} as const;
export const THREADS = {
  ivory: { name: 'Ivory', hex: '#f5f0e1' }, black: { name: 'Black', hex: '#111111' },
  ochre: { name: 'Ochre', hex: '#d97706' }, sage: { name: 'Sage', hex: '#6b8f3a' },
  red: { name: 'Brick Red', hex: '#a3322a' }, navy: { name: 'Navy', hex: '#1f3a73' },
  gold: { name: 'Metallic Gold', hex: '#c9a227' }, grey: { name: 'Slate', hex: '#6b7280' },
} as const;
export const FONTS = {
  varsity: { name: 'Varsity', css: 'Georgia, serif' },
  script: { name: 'Script', css: '"Brush Script MT", cursive' },
  block: { name: 'Block', css: 'Impact, sans-serif' },
  mono: { name: 'Typewriter', css: '"Courier New", monospace' },
} as const;
export const TIERS = [
  { min: 50, off: 0.25 }, { min: 25, off: 0.18 }, { min: 10, off: 0.1 }, { min: 1, off: 0 },
] as const;

export type GarmentId = keyof typeof GARMENTS;
export type ColorId = keyof typeof COLORS;
export type PlacementId = keyof typeof PLACEMENTS;
export type ThreadId = keyof typeof THREADS;
export type FontId = keyof typeof FONTS;

export interface CartItem {
  id: string; garment: GarmentId; color: ColorId; placement: PlacementId;
  text: string; font: FontId; thread: ThreadId;
  artworkPath: string | null; artworkName: string | null; qty: number;
}

export function tierDiscount(qty: number): number {
  return TIERS.find((t) => qty >= t.min)?.off ?? 0;
}
/** Unit price in cents. Used by BOTH client preview and server checkout. */
export function unitPrice(i: Pick<CartItem, 'garment' | 'placement' | 'text' | 'artworkPath' | 'qty'>): number {
  const stitch = (i.text ? 300 + i.text.length * 20 : 0) + (i.artworkPath ? 1200 : 0);
  const gross = GARMENTS[i.garment].base + PLACEMENTS[i.placement].add + stitch;
  return Math.round(gross * (1 - tierDiscount(i.qty)));
}
export const eur = (c: number) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(c / 100);
