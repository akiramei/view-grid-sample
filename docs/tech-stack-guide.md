# 技術スタック詳細ガイド

## 🎯 技術選定の全体方針

**ブラウザ完結型**での実装を前提とし、**画像連結に特化**した高性能なWebアプリケーションを構築します。各技術は以下の基準で選定されています：

- **確実性**: 安定したライブラリで技術的リスクを最小化
- **性能**: 4K画像・リアルタイム処理に対応
- **保守性**: TypeScript対応・活発なメンテナンス
- **将来性**: モダンな技術・拡張可能性

## 🏗️ コア技術スタック

### 1. 開発基盤

#### Vite + React + TypeScript
```json
{
  "vite": "^5.0.0",
  "react": "^18.2.0", 
  "@types/react": "^18.2.37",
  "typescript": "^5.2.2"
}
```

**選定理由**:
- **Vite**: 高速HMR、優秀なビルド最適化
- **React**: 豊富なエコシステム、安定した開発体験
- **TypeScript**: 型安全性、リファクタリング支援

**基本設定例**:
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
  },
});
```

### 2. 状態管理

#### Zustand + Immer
```json
{
  "zustand": "^4.4.7",
  "immer": "^10.0.3"
}
```

**選定理由**:
- **Zustand**: Redux比べて軽量、学習コストが低い
- **Immer**: 複雑な状態更新を簡潔に記述

**使用パターン**:
```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface AppState {
  imageAssets: ImageAsset[];
  addImageAsset: (asset: ImageAsset) => void;
}

export const useAppStore = create<AppState>()(
  immer((set, get) => ({
    imageAssets: [],
    
    addImageAsset: (asset) =>
      set((state) => {
        state.imageAssets.push(asset); // Immerで不変更新
      }),
  }))
);
```

**他の選択肢との比較**:
| 技術 | 学習コスト | 性能 | TypeScript対応 | 判定 |
|------|-----------|------|---------------|------|
| Redux Toolkit | 高 | ○ | ◎ | ❌ |
| Zustand | 低 | ◎ | ◎ | ✅ |
| Jotai | 中 | ◎ | ◎ | △ |

### 3. データベース

#### Dexie.js (IndexedDB)
```json
{
  "dexie": "^3.2.4"
}
```

**選定理由**:
- **IndexedDBラッパー**: ブラウザネイティブで高性能
- **TypeScript対応**: 優秀な型定義
- **sql.js比較**: より軽量、メモリ効率が良い

**基本使用パターン**:
```typescript
import Dexie, { type Table } from 'dexie';

class ImageConcatDB extends Dexie {
  imageAssets!: Table<ImageAsset>;

  constructor() {
    super('ImageConcatDB');
    this.version(1).stores({
      imageAssets: 'id, fileHash, createdAt',
    });
  }
}

export const db = new ImageConcatDB();

// 使用例
const assets = await db.imageAssets.where('fileHash').equals(hash).toArray();
```

**容量制限と対策**:
```typescript
// ストレージ使用量監視
async function checkStorageUsage() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const usedMB = (estimate.usage || 0) / (1024 * 1024);
    console.log(`Storage used: ${usedMB.toFixed(2)}MB`);
    
    if (usedMB > 500) { // 500MB制限
      // 古いデータの削除等
    }
  }
}
```

### 4. ドラッグ&ドロップ

#### @dnd-kit
```json
{
  "@dnd-kit/core": "^6.0.8",
  "@dnd-kit/sortable": "^7.0.2", 
  "@dnd-kit/utilities": "^3.2.1"
}
```

**選定理由**:
- **現代的**: react-dndの後継、アクセシビリティ対応
- **占有セル対応**: 複雑なドロップゾーンを実装可能
- **高性能**: 60FPS維持可能

**基本実装パターン**:
```typescript
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay,
  closestCenter 
} from '@dnd-kit/core';

function GridCanvas() {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over) {
      // 配置ロジック
      placementService.placeImage(active.id, over.id);
    }
  };

  return (
    <DndContext 
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <GridCells />
      <DragOverlay>
        {/* ドラッグ中のプレビュー */}
      </DragOverlay>
    </DndContext>
  );
}
```

**占有セル対応**:
```typescript
// 複数セルにまたがるドロップゾーン
function MultiCellDropZone({ occupyWidth, occupyHeight }: OccupySize) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'multi-cell-zone',
    data: { occupyWidth, occupyHeight }
  });

  return (
    <div 
      ref={setNodeRef}
      className={`
        grid-cell-group 
        ${isOver ? 'border-blue-500' : 'border-gray-300'}
      `}
      style={{
        gridColumn: `span ${occupyWidth}`,
        gridRow: `span ${occupyHeight}`,
      }}
    />
  );
}
```

### 5. 画像処理

#### Konva.js + React-Konva
```json
{
  "konva": "^9.2.0",
  "react-konva": "^18.2.10"
}
```

**選定理由**:
- **高性能Canvas操作**: WebGLアクセラレーション
- **React統合**: コンポーネントベースで扱いやすい
- **変形処理**: 回転・スケーリング・フィルターが簡単

**基本使用パターン**:
```typescript
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';

function ImageRenderer({ imageCopy, placement }: Props) {
  const [image] = useImage(imageCopy.asset.source);
  
  return (
    <Stage width={800} height={600}>
      <Layer>
        <KonvaImage
          image={image}
          x={placement.gridX * cellWidth}
          y={placement.gridY * cellHeight}
          scaleX={imageCopy.characteristics.scaleX}
          scaleY={imageCopy.characteristics.scaleY}
          rotation={imageCopy.transform.rotation}
          listening={false} // パフォーマンス向上
        />
      </Layer>
    </Stage>
  );
}
```

**高解像度出力**:
```typescript
async function exportToHighResolution(layout: GridLayout): Promise<Blob> {
  // 出力専用の高解像度Stage作成
  const outputStage = new Konva.Stage({
    container: document.createElement('div'),
    width: layout.canvasWidth,
    height: layout.canvasHeight,
  });

  const layer = new Konva.Layer();
  
  // 高解像度画像を配置
  for (const placement of layout.placements) {
    const image = await loadHighResImage(placement.imageId);
    layer.add(new Konva.Image({ image, ...placement }));
  }
  
  outputStage.add(layer);
  
  // PNG出力
  return new Promise((resolve) => {
    outputStage.toCanvas().toBlob(resolve, 'image/png', 1.0);
  });
}
```

### 6. UI コンポーネント

#### Headless UI + Tailwind CSS
```json
{
  "@headlessui/react": "^1.7.17",
  "tailwindcss": "^3.3.5"
}
```

**選定理由**:
- **Headless UI**: アクセシビリティ対応済み
- **Tailwind**: 高速開発、一貫したデザイン
- **カスタマイズ性**: 自由度が高い

**コンポーネント例**:
```typescript
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

function ImagePropertiesDialog({ open, onClose, imageCopy }: Props) {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
              <Dialog.Title className="text-lg font-medium text-gray-900">
                画像特性設定
              </Dialog.Title>
              
              {/* 特性設定UI */}
              <ImageCharacteristicsForm imageCopy={imageCopy} />
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
```

## 🔧 サポートライブラリ

### ファイル処理
```json
{
  "browser-image-compression": "^2.0.2"
}
```

**使用例**:
```typescript
import imageCompression from 'browser-image-compression';

async function optimizeImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 10,
    maxWidthOrHeight: 4096,
    useWebWorker: true, // Web Worker使用で非ブロッキング
  };
  
  return await imageCompression(file, options);
}
```

### ユーティリティ
```json
{
  "lucide-react": "^0.294.0",
  "react-hot-toast": "^2.4.1",
  "zod": "^3.22.4",
  "uuid": "^9.0.1"
}
```

**Zod使用例**:
```typescript
import { z } from 'zod';

const ImageCopySchema = z.object({
  id: z.string().uuid(),
  assetId: z.string().uuid(),
  transform: z.object({
    rotation: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]),
    flipX: z.boolean(),
    flipY: z.boolean(),
  }),
  characteristics: z.object({
    scalingPolicy: z.object({
      allowEnlarge: z.boolean(),
      allowShrink: z.boolean(),
    }),
  }),
});

// ランタイム型チェック
const validatedCopy = ImageCopySchema.parse(rawData);
```

## 🚫 避けるべきライブラリ

### 非推奨技術とその理由

| ライブラリ | 理由 | 代替案 |
|-----------|------|-------|
| **react-dnd** | 古い、パフォーマンス問題 | @dnd-kit |
| **Redux** | 複雑すぎる、学習コスト高 | Zustand |
| **Fabric.js** | 重い、React統合困難 | Konva.js |
| **sql.js** | メモリ使用量多、重い | Dexie.js |
| **Electron** | ブラウザ完結方針に反する | PWA |

## 📊 性能最適化指針

### 画像処理最適化
```typescript
// プレビュー用低解像度キャッシュ
class ImageCache {
  private previewCache = new Map<string, string>();
  private readonly PREVIEW_SIZE = 800;

  async getPreviewUrl(asset: ImageAsset): Promise<string> {
    if (this.previewCache.has(asset.id)) {
      return this.previewCache.get(asset.id)!;
    }

    const previewUrl = await this.createPreview(asset.source, this.PREVIEW_SIZE);
    this.previewCache.set(asset.id, previewUrl);
    return previewUrl;
  }

  private async createPreview(originalUrl: string, maxSize: number): Promise<string> {
    const img = new Image();
    img.src = originalUrl;
    await new Promise(resolve => img.onload = resolve);

    const canvas = new OffscreenCanvas(maxSize, maxSize);
    const ctx = canvas.getContext('2d')!;
    
    // アスペクト比維持でリサイズ
    const scale = Math.min(maxSize / img.width, maxSize / img.height);
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;
    
    canvas.width = scaledWidth;
    canvas.height = scaledHeight;
    ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
    
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.8 });
    return URL.createObjectURL(blob);
  }
}
```

### メモリ管理
```typescript
// メモリ使用量監視
function useMemoryMonitor() {
  useEffect(() => {
    const interval = setInterval(async () => {
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        const usedMB = memInfo.usedJSHeapSize / 1024 / 1024;
        
        if (usedMB > 500) { // 500MB制限
          console.warn('High memory usage detected:', usedMB);
          // ガベージコレクション促進、キャッシュクリア等
        }
      }
    }, 10000); // 10秒ごと

    return () => clearInterval(interval);
  }, []);
}
```

## 🧪 テスト戦略

### Vitest + Testing Library
```json
{
  "vitest": "^1.0.0",
  "@testing-library/react": "^13.4.0",
  "@testing-library/jest-dom": "^6.1.4"
}
```

**テストの書き方**:
```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ImageUpload } from '@/presentation/components/ImageUpload';

describe('ImageUpload', () => {
  it('should display upload area', () => {
    render(<ImageUpload />);
    expect(screen.getByText(/drop images here/i)).toBeInTheDocument();
  });
});
```

## 🔄 開発ワークフロー

### 推奨開発環境
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build", 
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "lint": "eslint . --ext ts,tsx",
    "type-check": "tsc --noEmit"
  }
}
```

### VS Code設定
```json
// .vscode/settings.json
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

この技術スタックにより、**高性能で保守性の高い画像連結ソフトウェア**を確実に実現できます。各ライブラリの詳細な使用方法は、実装を進めながら段階的に習得してください。