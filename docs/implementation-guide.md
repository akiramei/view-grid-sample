# 実装ガイド

## 🎯 実装戦略概要

このガイドは**段階的実装アプローチ**に基づいています。MVPから始めて、段階的に高度な機能を追加することで、技術的リスクを最小化しつつ確実に完成に導きます。

## 🏗️ Phase 1: 基盤構築（Week 1-2）

### 目標
開発環境とプロジェクト構造の確立

### 1.1 環境セットアップ

```bash
# 1. プロジェクト作成
npm create vite@latest image-concat-app -- --template react-ts
cd image-concat-app

# 2. 必須パッケージインストール
npm install zustand immer
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities  
npm install dexie
npm install konva react-konva
npm install @headlessui/react lucide-react zod react-hot-toast
npm install browser-image-compression

# 3. 開発用パッケージ
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D autoprefixer postcss tailwindcss
npm install -D @types/uuid
npm install uuid

# 4. Tailwind初期化
npx tailwindcss init -p
```

### 1.2 ディレクトリ構造作成

```bash
mkdir -p src/{core,infrastructure,application,presentation,shared}
mkdir -p src/core/{entities,use-cases,interfaces}  
mkdir -p src/infrastructure/{repositories,services,adapters}
mkdir -p src/application/{hooks,stores}
mkdir -p src/presentation/{components,pages,layouts}
mkdir -p src/shared/{types,utils,constants}
```

### 1.3 基本型定義の実装

**src/shared/types/index.ts**
```typescript
// 基本エンティティ型
export interface ImageAsset {
  id: string;
  sourceType: 'upload' | 'url';
  source: string;
  originalFilename?: string;
  width: number;
  height: number;
  fileHash: string;
  createdAt: string;
}

export interface ImageCopy {
  id: string;
  assetId: string;
  copyName?: string;
  transform: ImageTransform;
  characteristics: ImageCharacteristics;
  occupySize: OccupySize;
  createdAt: string;
  updatedAt: string;
}

export interface ImageTransform {
  rotation: 0 | 90 | 180 | 270;
  flipX: boolean;
  flipY: boolean;
}

export interface ImageCharacteristics {
  scalingPolicy: ScalingPolicy;
  trimmingAnchor: TrimmingAnchor;
  alignment: Alignment;
}

export interface ScalingPolicy {
  allowEnlarge: boolean;
  allowShrink: boolean;
}

export interface TrimmingAnchor {
  x: 'left' | 'center' | 'right';
  y: 'top' | 'center' | 'bottom';
}

export interface Alignment {
  x: 'left' | 'center' | 'right';
  y: 'top' | 'center' | 'bottom';
}

export interface OccupySize {
  width: number;
  height: number;
}

export interface GridCanvas {
  id: string;
  name: string;
  gridRows: number;
  gridCols: number;
  canvasWidth: number;
  canvasHeight: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GridPlacement {
  id: string;
  gridId: string;
  copyId: string;
  gridX: number;
  gridY: number;
  offsetX: number;
  offsetY: number;
  placementOrder: number;
  createdAt: string;
}
```

### 1.4 データベース層の骨格実装

**src/infrastructure/repositories/database.ts**
```typescript
import Dexie, { type Table } from 'dexie';
import type { ImageAsset, ImageCopy, GridCanvas, GridPlacement } from '@/shared/types';

export class ImageConcatDB extends Dexie {
  imageAssets!: Table<ImageAsset>;
  imageCopies!: Table<ImageCopy>;
  gridCanvases!: Table<GridCanvas>;
  gridPlacements!: Table<GridPlacement>;

  constructor() {
    super('ImageConcatDB');
    this.version(1).stores({
      imageAssets: 'id, fileHash, createdAt',
      imageCopies: 'id, assetId, updatedAt',
      gridCanvases: 'id, isActive, updatedAt',
      gridPlacements: 'id, gridId, copyId, [gridX+gridY]',
    });
  }
}

export const db = new ImageConcatDB();
```

### 1.5 Repository インターフェース定義

**src/core/interfaces/repositories.ts**
```typescript
export interface ImageAssetRepository {
  findAll(): Promise<ImageAsset[]>;
  findById(id: string): Promise<ImageAsset | null>;
  findByHash(hash: string): Promise<ImageAsset[]>;
  create(asset: Omit<ImageAsset, 'id' | 'createdAt'>): Promise<ImageAsset>;
  update(id: string, updates: Partial<ImageAsset>): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface ImageCopyRepository {
  findAll(): Promise<ImageCopy[]>;
  findByAssetId(assetId: string): Promise<ImageCopy[]>;
  create(copy: Omit<ImageCopy, 'id' | 'createdAt' | 'updatedAt'>): Promise<ImageCopy>;
  update(id: string, updates: Partial<ImageCopy>): Promise<void>;
  delete(id: string): Promise<void>;
}
```

### 成功基準（Week 2終了時）
- [ ] `npm run dev` でアプリが起動
- [ ] 基本的なページが表示される
- [ ] データベース接続が確認できる
- [ ] 型定義が完全に整備されている

---

## 📸 Phase 2: 画像管理（Week 3-4）

### 目標
画像アップロード・表示・論理コピー管理の実装

### 2.1 Repository 実装

**src/infrastructure/repositories/dexie-image-asset-repository.ts**
```typescript
import { ImageAssetRepository } from '@/core/interfaces/repositories';
import { ImageAsset } from '@/shared/types';
import { db } from './database';
import { v4 as uuidv4 } from 'uuid';

export class DexieImageAssetRepository implements ImageAssetRepository {
  async findAll(): Promise<ImageAsset[]> {
    return await db.imageAssets.orderBy('createdAt').reverse().toArray();
  }

  async findById(id: string): Promise<ImageAsset | null> {
    return await db.imageAssets.get(id) || null;
  }

  async findByHash(hash: string): Promise<ImageAsset[]> {
    return await db.imageAssets.where('fileHash').equals(hash).toArray();
  }

  async create(asset: Omit<ImageAsset, 'id' | 'createdAt'>): Promise<ImageAsset> {
    const newAsset: ImageAsset = {
      ...asset,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    
    await db.imageAssets.add(newAsset);
    return newAsset;
  }

  async update(id: string, updates: Partial<ImageAsset>): Promise<void> {
    await db.imageAssets.update(id, updates);
  }

  async delete(id: string): Promise<void> {
    await db.imageAssets.delete(id);
  }
}
```

### 2.2 ファイルアップロード機能

**src/infrastructure/services/file-upload-service.ts**
```typescript
import imageCompression from 'browser-image-compression';

export class FileUploadService {
  async uploadImage(file: File): Promise<{
    source: string;
    width: number;
    height: number;
    fileHash: string;
  }> {
    // 1. 画像圧縮・最適化
    const compressedFile = await this.optimizeImage(file);
    
    // 2. Base64変換
    const source = await this.fileToBase64(compressedFile);
    
    // 3. 画像情報取得
    const { width, height } = await this.getImageDimensions(source);
    
    // 4. ハッシュ生成
    const fileHash = await this.generateFileHash(source);
    
    return { source, width, height, fileHash };
  }

  private async optimizeImage(file: File): Promise<File> {
    const options = {
      maxSizeMB: 10,
      maxWidthOrHeight: 4096,
      useWebWorker: true,
    };
    
    return await imageCompression(file, options);
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private async getImageDimensions(src: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = reject;
      img.src = src;
    });
  }

  private async generateFileHash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
```

### 2.3 状態管理（Zustand）

**src/application/stores/app-store.ts**
```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ImageAsset, ImageCopy, GridCanvas } from '@/shared/types';

interface AppState {
  // データ
  imageAssets: ImageAsset[];
  imageCopies: ImageCopy[];
  grids: GridCanvas[];
  activeGridId: string | null;
  
  // UI状態
  selectedCopyIds: string[];
  
  // アクション
  setImageAssets: (assets: ImageAsset[]) => void;
  addImageAsset: (asset: ImageAsset) => void;
  removeImageAsset: (id: string) => void;
  
  setImageCopies: (copies: ImageCopy[]) => void;
  addImageCopy: (copy: ImageCopy) => void;
  updateImageCopy: (id: string, updates: Partial<ImageCopy>) => void;
  removeImageCopy: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  immer((set, get) => ({
    // 初期状態
    imageAssets: [],
    imageCopies: [],
    grids: [],
    activeGridId: null,
    selectedCopyIds: [],

    // アクション
    setImageAssets: (assets) =>
      set((state) => {
        state.imageAssets = assets;
      }),

    addImageAsset: (asset) =>
      set((state) => {
        state.imageAssets.push(asset);
      }),

    removeImageAsset: (id) =>
      set((state) => {
        state.imageAssets = state.imageAssets.filter(a => a.id !== id);
      }),

    setImageCopies: (copies) =>
      set((state) => {
        state.imageCopies = copies;
      }),

    addImageCopy: (copy) =>
      set((state) => {
        state.imageCopies.push(copy);
      }),

    updateImageCopy: (id, updates) =>
      set((state) => {
        const index = state.imageCopies.findIndex(c => c.id === id);
        if (index !== -1) {
          Object.assign(state.imageCopies[index], updates);
          state.imageCopies[index].updatedAt = new Date().toISOString();
        }
      }),

    removeImageCopy: (id) =>
      set((state) => {
        state.imageCopies = state.imageCopies.filter(c => c.id !== id);
      }),
  }))
);
```

### 2.4 カスタムフック実装

**src/application/hooks/use-image-assets.ts**
```typescript
import { useEffect } from 'react';
import { useAppStore } from '@/application/stores/app-store';
import { DexieImageAssetRepository } from '@/infrastructure/repositories/dexie-image-asset-repository';
import { FileUploadService } from '@/infrastructure/services/file-upload-service';

const imageAssetRepo = new DexieImageAssetRepository();
const fileUploadService = new FileUploadService();

export function useImageAssets() {
  const {
    imageAssets,
    setImageAssets,
    addImageAsset,
    removeImageAsset,
  } = useAppStore();

  // 初期データ読み込み
  useEffect(() => {
    const loadAssets = async () => {
      const assets = await imageAssetRepo.findAll();
      setImageAssets(assets);
    };
    loadAssets();
  }, [setImageAssets]);

  const uploadImage = async (file: File) => {
    try {
      const uploadResult = await fileUploadService.uploadImage(file);
      
      const newAsset = await imageAssetRepo.create({
        sourceType: 'upload',
        originalFilename: file.name,
        ...uploadResult,
      });
      
      addImageAsset(newAsset);
      return newAsset;
    } catch (error) {
      console.error('Image upload failed:', error);
      throw error;
    }
  };

  const deleteAsset = async (id: string) => {
    try {
      await imageAssetRepo.delete(id);
      removeImageAsset(id);
    } catch (error) {
      console.error('Asset deletion failed:', error);
      throw error;
    }
  };

  return {
    imageAssets,
    uploadImage,
    deleteAsset,
  };
}
```

### 2.5 基本UI実装

**src/presentation/components/ImageUpload.tsx**
```typescript
import React, { useCallback } from 'react';
import { Upload } from 'lucide-react';
import { useImageAssets } from '@/application/hooks/use-image-assets';
import toast from 'react-hot-toast';

export function ImageUpload() {
  const { uploadImage } = useImageAssets();

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      try {
        await uploadImage(file);
        toast.success(`${file.name} uploaded successfully`);
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
  }, [uploadImage]);

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
      <div className="text-center">
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-4">
          <label htmlFor="file-upload" className="cursor-pointer">
            <span className="mt-2 block text-sm font-medium text-gray-900">
              Drop images here or click to upload
            </span>
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              className="sr-only"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
```

### 成功基準（Week 4終了時）
- [ ] 画像をアップロードできる
- [ ] アップロードした画像が一覧表示される
- [ ] 基本的な論理コピーを作成できる
- [ ] 画像の削除ができる

---

## 🎯 Phase 3: グリッド配置（Week 5-6）

### 目標
基本的なドラッグ&ドロップ配置機能の実装

### 3.1 グリッドコンポーネント実装

**src/presentation/components/GridCanvas.tsx**
```typescript
import React from 'react';
import { DndContext, DragEndEvent, DragOverlay } from '@dnd-kit/core';

interface GridCanvasProps {
  gridRows: number;
  gridCols: number;
  canvasWidth: number;
  canvasHeight: number;
}

export function GridCanvas({ gridRows, gridCols, canvasWidth, canvasHeight }: GridCanvasProps) {
  const cellWidth = canvasWidth / gridCols;
  const cellHeight = canvasHeight / gridRows;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over) {
      console.log(`Dropped ${active.id} on ${over.id}`);
      // TODO: 配置ロジック実装
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div 
        className="grid border-2 border-gray-300"
        style={{
          gridTemplateRows: `repeat(${gridRows}, 1fr)`,
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          width: canvasWidth,
          height: canvasHeight,
        }}
      >
        {Array.from({ length: gridRows * gridCols }, (_, index) => {
          const row = Math.floor(index / gridCols);
          const col = index % gridCols;
          
          return (
            <GridCell
              key={`${row}-${col}`}
              row={row}
              col={col}
              width={cellWidth}
              height={cellHeight}
            />
          );
        })}
      </div>
      
      <DragOverlay>
        {/* ドラッグ中のプレビュー */}
      </DragOverlay>
    </DndContext>
  );
}
```

### 3.2 配置検証サービス

**src/core/use-cases/placement-validation.ts**
```typescript
import type { GridPlacement, ImageCopy, GridCanvas } from '@/shared/types';

export class PlacementValidationUseCase {
  validatePlacement(
    copy: ImageCopy,
    gridX: number,
    gridY: number,
    grid: GridCanvas,
    existingPlacements: GridPlacement[]
  ): { isValid: boolean; conflicts: string[] } {
    const conflicts: string[] = [];

    // 境界チェック
    if (gridX + copy.occupySize.width > grid.gridCols ||
        gridY + copy.occupySize.height > grid.gridRows) {
      conflicts.push('placement exceeds grid bounds');
    }

    // 重複チェック
    const occupiedCells = this.getOccupiedCells(gridX, gridY, copy.occupySize);
    
    for (const existing of existingPlacements) {
      const existingCells = this.getOccupiedCellsForPlacement(existing);
      
      if (this.hasOverlap(occupiedCells, existingCells)) {
        conflicts.push(`conflicts with existing placement ${existing.id}`);
      }
    }

    return {
      isValid: conflicts.length === 0,
      conflicts,
    };
  }

  private getOccupiedCells(x: number, y: number, size: { width: number; height: number }) {
    const cells: Array<{ x: number; y: number }> = [];
    
    for (let dx = 0; dx < size.width; dx++) {
      for (let dy = 0; dy < size.height; dy++) {
        cells.push({ x: x + dx, y: y + dy });
      }
    }
    
    return cells;
  }

  private getOccupiedCellsForPlacement(placement: GridPlacement): Array<{ x: number; y: number }> {
    // TODO: placementから占有セルを計算
    return [];
  }

  private hasOverlap(cells1: Array<{ x: number; y: number }>, cells2: Array<{ x: number; y: number }>): boolean {
    return cells1.some(cell1 => 
      cells2.some(cell2 => cell1.x === cell2.x && cell1.y === cell2.y)
    );
  }
}
```

### 成功基準（Week 6終了時）
- [ ] グリッドが表示される
- [ ] 画像をドラッグ&ドロップで配置できる
- [ ] 配置時の検証が動作する
- [ ] 配置済み画像が表示される

---

## 🚀 Phase 4: 高度機能（Week 7-10）

### 実装優先順位
1. **占有セル機能**（NxM配置）
2. **画像特性システム完成**
3. **Canvas出力機能**
4. **履歴管理（Undo/Redo）**

### 各機能の詳細な実装ガイドは、実際の開発時に段階的に提供予定

---

## 🔧 開発Tips・ベストプラクティス

### デバッグ・テスト
```bash
# 開発サーバー起動
npm run dev

# 型チェック
npx tsc --noEmit

# テスト実行
npm run test

# データベース状態確認
// ブラウザコンソールで
import { db } from './src/infrastructure/repositories/database.ts';
db.imageAssets.toArray().then(console.log);
```

### コード品質
- **TypeScript厳格モード**を維持
- **ESLint警告ゼロ**を目標
- **テストカバレッジ70%以上**を維持

### パフォーマンス
- **画像は常にプレビューサイズで表示**
- **出力時のみ高解像度処理**
- **メモリ使用量の定期監視**

### エラーハンドリング
- **すべての非同期処理にtry-catch**
- **ユーザーフレンドリーなエラーメッセージ**
- **エラー復旧の仕組み**

---

**このガイドに従って実装を進めてください。Phase完了時には必ず成功基準をチェックし、次のPhaseに進む前に動作確認を行ってください。**