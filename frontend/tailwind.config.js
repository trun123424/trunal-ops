/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Raycast-inspired dark theme
        dark: {
          bg: '#0d0d0f',
          surface: '#18181b',
          card: '#1f1f23',
          border: '#27272a',
          hover: '#2d2d31',
        },
        accent: {
          primary: '#6366f1',
          hover: '#818cf8',
          muted: '#4f46e5',
        },
        status: {
          created: '#6b7280',
          assigned: '#3b82f6',
          progress: '#f59e0b',
          review: '#8b5cf6',
          done: '#22c55e',
        },
        priority: {
          low: '#6b7280',
          medium: '#3b82f6',
          high: '#f59e0b',
          urgent: '#ef4444',
        },
        team: {
          personal: '#6366f1',
          dev: '#22c55e',
          data: '#f59e0b',
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in': 'slideIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
