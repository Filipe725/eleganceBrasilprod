import { Flower2 } from 'lucide-react';

/** Seção de citação estética do guia de estilo. */
export function QuoteSection() {
  return (
    <section className="bg-cream-low px-5 py-16 text-center sm:py-20">
      <Flower2 className="mx-auto mb-4 h-6 w-6 text-gold-600" aria-hidden />
      <p className="mx-auto max-w-xl font-display text-2xl font-semibold italic leading-tight text-ink-900 sm:text-3xl">
        &ldquo;O perfume é a forma mais intensa da memória. — Jean-Paul Guerlain&rdquo;
      </p>
    </section>
  );
}
