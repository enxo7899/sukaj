'use client';

import { usePathname } from 'next/navigation';
import { MobileSidebar } from './mobile-sidebar';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-background">
      <MobileSidebar />
      <main className="flex-1 overflow-hidden pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
