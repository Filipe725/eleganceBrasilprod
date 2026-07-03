'use client';

import { useRouter } from 'next/navigation';
import { LogOut, Sparkles, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { STORE_NAME } from '@/lib/constants';

interface AdminHeaderProps {
  userEmail: string;
}

export function AdminHeader({ userEmail }: AdminHeaderProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <header className="border-b border-gold-500/20 bg-ink-900">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-gold-400" aria-hidden />
          <div>
            <p className="font-display leading-tight text-cream">
              {STORE_NAME} <span className="text-gold-400">Admin</span>
            </p>
            <p className="hidden text-xs text-cream/50 sm:block">{userEmail}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="tap-target flex items-center gap-1.5 rounded-lg px-3 text-sm text-cream/70 transition hover:text-gold-300"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Ver loja</span>
          </a>
          <button
            type="button"
            onClick={handleSignOut}
            className="tap-target flex items-center gap-1.5 rounded-lg px-3 text-sm text-cream/70 transition hover:text-red-400"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}
