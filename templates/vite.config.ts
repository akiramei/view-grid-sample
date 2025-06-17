import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // パスエイリアス設定
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/core': path.resolve(__dirname, './src/core'),
      '@/infrastructure': path.resolve(__dirname, './src/infrastructure'),
      '@/application': path.resolve(__dirname, './src/application'),
      '@/presentation': path.resolve(__dirname, './src/presentation'),
      '@/shared': path.resolve(__dirname, './src/shared'),
    },
  },
  
  // ビルド設定
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: true,
    
    // チャンク分割最適化
    rollupOptions: {
      output: {
        manualChunks: {
          // React関連
          'react-vendor': ['react', 'react-dom'],
          
          // 状態管理
          'state-vendor': ['zustand', 'immer'],
          
          // UI関連
          'ui-vendor': ['@headlessui/react', 'lucide-react'],
          
          // 画像処理
          'canvas-vendor': ['konva', 'react-konva'],
          
          // DnD
          'dnd-vendor': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          
          // データベース
          'db-vendor': ['dexie'],
        },
      },
    },
  },
  
  // 開発サーバー設定
  server: {
    port: 3000,
    host: true,
    open: true,
  },
  
  // プレビューサーバー設定
  preview: {
    port: 4173,
    host: true,
  },
  
  // テスト設定（Vitest）
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    
    // カバレッジ設定
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
      ],
    },
  },
  
  // 依存関係最適化
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'zustand',
      'immer',
      'dexie',
      'konva',
      'react-konva',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@headlessui/react',
      'lucide-react',
      'react-hot-toast',
      'zod',
    ],
  },
  
  // 環境変数設定
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
});