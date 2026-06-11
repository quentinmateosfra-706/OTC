import { requireAdmin } from '@/lib/auth-guard';
import Link from 'next/link';
import SignOutButton from '@/components/SignOutButton';

const NAV = [
  { href: '/courses', label: 'Courses' },
  { href: '/utilisateurs', label: 'Utilisateurs' },
  { href: '/tentatives', label: 'Tentatives' },
  { href: '/revenus', label: 'Revenus' },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="flex min-h-screen">
      <aside className="w-52 bg-surface flex flex-col py-6 px-4 shrink-0">
        <span className="text-accent font-bold text-lg mb-8">OTC Admin</span>
        <nav className="flex flex-col gap-1 flex-1">
          {NAV.map(n => (
            <Link
              key={n.href}
              href={n.href}
              className="px-3 py-2 rounded-lg text-sm hover:bg-background transition-colors"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <SignOutButton />
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
