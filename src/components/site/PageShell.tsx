import { Header } from './Header';
import { Footer } from './Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';

interface PageShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

/**
 * Layout compartilhado das páginas institucionais: header, cabeçalho
 * editorial da página, conteúdo em coluna de leitura e footer.
 */
export function PageShell({ title, subtitle, children }: PageShellProps) {
  return (
    <>
      <Header />
      <main className="pt-16">
        <div className="bg-cream-low">
          <div className="mx-auto max-w-3xl px-5 py-12 text-center sm:px-6 sm:py-16">
            <h1 className="font-display text-3xl font-bold text-ink-900 sm:text-4xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="mx-auto max-w-3xl px-5 py-10 sm:px-6 sm:py-14">
          {children}
        </div>
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}
