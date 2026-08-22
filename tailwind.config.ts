import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Paleta "L'Essence Botanique": azul marinho profundo,
      // dourado acetinado e creme (ver DESIGN.md do guia de estilo)
      colors: {
        ink: {
          950: '#0b121c', // navy-black (superfícies mais escuras)
          900: '#111c2a', // primary — Deep Navy
          800: '#1e3049', // primary-container
          700: '#4a5a72', // surface-tint / texto secundário
        },
        gold: {
          300: '#fed488', // secondary-container
          400: '#e9c176', // satin gold (destaques sobre fundo escuro)
          500: '#d4af6a', // CTA dourado
          600: '#775a19', // secondary — texto dourado sobre fundo claro
        },
        cream: {
          DEFAULT: '#fcf9f8', // background
          low: '#f6f3f2',     // surface-container-low
          container: '#f0eded', // surface-container
          high: '#eae7e7',    // surface-container-high
        },
        charcoal: '#1b1c1c',  // on-surface
        muted: '#414846',     // on-surface-variant
        wine: '#9B3259',      // badges de desconto e preço promocional
      },
      fontFamily: {
        display: ['var(--font-display)', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'Montserrat', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        // "Ambient Softness": sombra difusa com tint de azul marinho
        card: '0 10px 30px -10px rgba(17, 28, 42, 0.08)',
      },
      keyframes: {
        'slide-in': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'slide-in': 'slide-in 0.25s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
