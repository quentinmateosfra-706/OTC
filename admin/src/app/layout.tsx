import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = { title: 'OTC Admin' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-background text-text-primary">{children}</body>
    </html>
  );
}
