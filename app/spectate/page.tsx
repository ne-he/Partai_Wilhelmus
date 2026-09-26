import type { Metadata } from 'next';
import SpectateApp from './SpectateApp';

// Halaman publik tanpa login. Datanya contoh dari ./sampleData, bukan dari Supabase.
export const metadata: Metadata = {
  title: 'Mode Spectate | Partai Wilhelmus',
  description: 'Lihat-lihat Partai Wilhelmus pakai data contoh, tanpa akun dan tanpa menyimpan apa pun.',
};

export default function SpectatePage() {
  return <SpectateApp />;
}
