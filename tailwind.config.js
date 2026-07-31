/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Couleur principale : indigo/violet énergique ──
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        // ── Sport/fitness : vert emeraude ──
        sport: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        // ── Pastel (backward compat – pages existantes) ──
        pastel: {
          blue: {
            50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe',
            300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1',
            600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81',
          },
          green: {
            50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0',
            300: '#6ee7b7', 400: '#34d399', 500: '#10b981',
            600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b',
          },
          rose: {
            50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3',
            300: '#fda4af', 400: '#fb7185', 500: '#f43f5e',
            600: '#e11d48', 700: '#be123c', 800: '#9f1239', 900: '#881337',
          },
          purple: {
            50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff',
            300: '#d8b4fe', 400: '#c084fc', 500: '#a855f7',
            600: '#9333ea', 700: '#7c3aed', 800: '#6b21a8', 900: '#581c87',
          },
          orange: {
            50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa',
            300: '#fdba74', 400: '#fb923c', 500: '#f97316',
            600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12',
          },
          neutral: {
            50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb',
            300: '#d1d5db', 400: '#9ca3af', 500: '#6b7280',
            600: '#4b5563', 700: '#374151', 800: '#1f2937', 900: '#111827',
          },
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs':   ['0.75rem',  { lineHeight: '1rem' }],
        'sm':   ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem',     { lineHeight: '1.5rem' }],
        'lg':   ['1.125rem', { lineHeight: '1.75rem' }],
        'xl':   ['1.25rem',  { lineHeight: '1.75rem' }],
        '2xl':  ['1.5rem',   { lineHeight: '2rem' }],
        '3xl':  ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl':  ['2.25rem',  { lineHeight: '2.5rem' }],
        '5xl':  ['3rem',     { lineHeight: '1.1' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        // ── Legacy (conservés pour les pages existantes) ──
        'soft':      '0 1px 3px rgba(0,0,0,.05), 0 4px 16px rgba(0,0,0,.04)',
        'soft-lg':   '0 4px 12px rgba(0,0,0,.08), 0 16px 32px rgba(0,0,0,.05)',
        'pastel':    '0 2px 8px rgba(79,70,229,.2)',
        'pastel-lg': '0 8px 24px rgba(79,70,229,.15)',
        // ── Nouvelles ombres ──
        'card':        '0 1px 2px rgba(0,0,0,.04), 0 4px 20px rgba(0,0,0,.05)',
        'card-hover':  '0 4px 12px rgba(0,0,0,.06), 0 16px 40px rgba(0,0,0,.08)',
        'btn':         '0 2px 8px rgba(79,70,229,.3), 0 1px 2px rgba(0,0,0,.06)',
        'btn-success': '0 2px 8px rgba(16,185,129,.3)',
        'btn-danger':  '0 2px 8px rgba(239,68,68,.25)',
        'glow-brand':  '0 0 24px rgba(99,102,241,.35)',
        'glow-sport':  '0 0 24px rgba(16,185,129,.3)',
      },
      animation: {
        'fade-in':       'fadeIn 0.4s ease-out both',
        'slide-up':      'slideUp 0.35s ease-out both',
        'scale-in':      'scaleIn 0.2s ease-out both',
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
        'pulse-brand':   'pulseBrand 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        pulseBrand: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(99,102,241,.4)' },
          '50%':      { boxShadow: '0 0 0 8px rgba(99,102,241,0)' },
        },
      },
    },
  },
  plugins: [],
};
