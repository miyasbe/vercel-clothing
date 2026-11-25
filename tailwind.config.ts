import type { Config } from 'tailwindcss';
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: { colors: { cotton: '#FAF9F6', thread: '#18181B', weave: '#E4E4E7', ochre: '#D97706', sage: '#3F6212' } } },
  plugins: [],
} satisfies Config;
