/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  
  theme: {
    extend: {
      // カラーパレット
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',  // メインブランドカラー
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
        },
        
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        },
        
        // アプリ固有カラー
        grid: {
          border: '#e5e7eb',
          cell: '#f9fafb',
          'cell-hover': '#f3f4f6',
          'cell-active': '#dbeafe',
          'cell-occupied': '#fef3c7',
          'cell-conflict': '#fee2e2',
        },
        
        canvas: {
          background: '#ffffff',
          border: '#d1d5db',
          guide: '#9ca3af',
        },
      },
      
      // フォントファミリー
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'Monaco',
          'Consolas',
          'Liberation Mono',
          'Courier New',
          'monospace',
        ],
      },
      
      // アニメーション
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'fade-out': 'fadeOut 0.2s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-out': 'slideOut 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-soft': 'bounceSoft 0.6s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideOut: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(-10px)', opacity: '0' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceSoft: {
          '0%, 20%, 53%, 80%, 100%': { transform: 'translate3d(0,0,0)' },
          '40%, 43%': { transform: 'translate3d(0, -5px, 0)' },
          '70%': { transform: 'translate3d(0, -3px, 0)' },
          '90%': { transform: 'translate3d(0, -1px, 0)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      
      // グリッドテンプレート
      gridTemplateColumns: {
        'auto-fit': 'repeat(auto-fit, minmax(250px, 1fr))',
        'auto-fill': 'repeat(auto-fill, minmax(200px, 1fr))',
      },
      
      // 影
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'strong': '0 10px 40px -10px rgba(0, 0, 0, 0.15)',
        'grid-cell': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'grid-cell-hover': '0 2px 8px rgba(0, 0, 0, 0.15)',
        'floating': '0 8px 30px rgba(0, 0, 0, 0.12)',
      },
      
      // ボーダー半径
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      
      // スペーシング
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // Z-index
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      
      // 画面サイズ
      screens: {
        'xs': '475px',
        '3xl': '1600px',
      },
      
      // 最大幅
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
    },
  },
  
  plugins: [
    // フォーム要素のスタイリング
    require('@tailwindcss/forms'),
    
    // タイポグラフィ
    require('@tailwindcss/typography'),
    
    // アスペクト比
    require('@tailwindcss/aspect-ratio'),
    
    // カスタムユーティリティ
    function({ addUtilities, addComponents, theme }) {
      // グリッド関連ユーティリティ
      const gridUtilities = {
        '.grid-center': {
          'place-items': 'center',
        },
        '.grid-stretch': {
          'place-items': 'stretch',
        },
      };
      
      // ボタンコンポーネント
      const buttonComponents = {
        '.btn': {
          '@apply px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2': {},
        },
        '.btn-primary': {
          '@apply bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500': {},
        },
        '.btn-secondary': {
          '@apply bg-secondary-200 text-secondary-800 hover:bg-secondary-300 focus:ring-secondary-500': {},
        },
        '.btn-success': {
          '@apply bg-success-500 text-white hover:bg-success-600 focus:ring-success-500': {},
        },
        '.btn-warning': {
          '@apply bg-warning-500 text-white hover:bg-warning-600 focus:ring-warning-500': {},
        },
        '.btn-error': {
          '@apply bg-error-500 text-white hover:bg-error-600 focus:ring-error-500': {},
        },
      };
      
      // カード関連
      const cardComponents = {
        '.card': {
          '@apply bg-white rounded-xl shadow-soft border border-gray-200': {},
        },
        '.card-hover': {
          '@apply hover:shadow-medium transition-shadow duration-200': {},
        },
      };
      
      addUtilities(gridUtilities);
      addComponents(buttonComponents);
      addComponents(cardComponents);
    },
  ],
  
  // ダークモード対応（将来拡張用）
  darkMode: 'class',
};