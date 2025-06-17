# ライブラリ抽象化戦略

## 🎯 間接層推奨度別分類

### 🔴 高優先度：間接層必須

#### 1. データベース層（Dexie.js）
**リスク**: データアクセスパターンの全面書き換え
**対策**: Repository パターンで抽象化

```typescript
// ❌ 直接利用（ロックインリスク）
import { db } from './database';
const assets = await db.imageAssets.where('fileHash').equals(hash).toArray();

// ✅ 抽象化された利用
interface ImageAssetRepository {
  findByHash(hash: string): Promise<ImageAsset[]>;
  create(asset: Omit<ImageAsset, 'id'>): Promise<ImageAsset>;
  update(id: string, updates: Partial<ImageAsset>): Promise<void>;
  delete(id: string): Promise<void>;
}

class DexieImageAssetRepository implements ImageAssetRepository {
  async findByHash(hash: string): Promise<ImageAsset[]> {
    return await db.imageAssets.where('fileHash').equals(hash).toArray();
  }
  
  async create(asset: Omit<ImageAsset, 'id'>): Promise<ImageAsset> {
    const id = generateUUID();
    const newAsset = { ...asset, id };
    await db.imageAssets.add(newAsset);
    return newAsset;
  }
}

// 使用側はインターフェースのみ依存
const imageAssetRepo: ImageAssetRepository = new DexieImageAssetRepository();
```

#### 2. 画像処理層（Konva.js）
**リスク**: Canvas処理の実装詳細が漏洩
**対策**: Service パターンで抽象化

```typescript
// ❌ 直接利用
import Konva from 'konva';
const layer = new Konva.Layer();
const image = new Konva.Image({ ... });

// ✅ 抽象化された利用
interface ImageProcessingService {
  applyTransform(image: ImageData, transform: ImageTransform): Promise<ImageData>;
  renderToCanvas(layout: GridLayout): Promise<HTMLCanvasElement>;
  exportToPNG(canvas: HTMLCanvasElement, quality?: number): Promise<Blob>;
}

class KonvaImageProcessingService implements ImageProcessingService {
  async applyTransform(image: ImageData, transform: ImageTransform): Promise<ImageData> {
    // Konva.js具体実装
    const stage = new Konva.Stage({ ... });
    // ... 変形処理
    return processedImageData;
  }
}

// 将来的にCanvas API直接実装やWebGL実装に変更可能
class CanvasImageProcessingService implements ImageProcessingService {
  async applyTransform(image: ImageData, transform: ImageTransform): Promise<ImageData> {
    // Canvas API具体実装
    const canvas = new OffscreenCanvas(width, height);
    // ... 変形処理
    return processedImageData;
  }
}
```

### 🟡 中優先度：設計次第で間接層

#### 3. 状態管理（Zustand）
**リスク**: 状態管理パターンの変更
**対策**: Custom Hooks で抽象化

```typescript
// ❌ 直接利用
import { useAppStore } from './store';
const { imageAssets, addImageAsset } = useAppStore();

// ✅ カスタムフックで抽象化
interface UseImageAssetsReturn {
  imageAssets: ImageAsset[];
  addImageAsset: (asset: Omit<ImageAsset, 'id'>) => Promise<void>;
  removeImageAsset: (id: string) => Promise<void>;
  updateImageAsset: (id: string, updates: Partial<ImageAsset>) => Promise<void>;
}

export function useImageAssets(): UseImageAssetsReturn {
  // Zustand具体実装
  const { imageAssets, actions } = useAppStore();
  
  return {
    imageAssets,
    addImageAsset: actions.addImageAsset,
    removeImageAsset: actions.removeImageAsset,
    updateImageAsset: actions.updateImageAsset,
  };
}

// 将来的にRedux、Jotai等に変更時も、このフック内だけの変更で済む
```

#### 4. ファイル処理
**リスク**: ブラウザAPI変更、Node.js移行の可能性
**対策**: Adapter パターン

```typescript
interface FileService {
  uploadImage(file: File): Promise<ImageAsset>;
  saveProject(data: ProjectData): Promise<void>;
  loadProject(): Promise<ProjectData | null>;
}

class BrowserFileService implements FileService {
  async uploadImage(file: File): Promise<ImageAsset> {
    // File API + Canvas API実装
  }
  
  async saveProject(data: ProjectData): Promise<void> {
    // File System Access API + Download fallback
  }
}

// 将来的なElectron対応
class ElectronFileService implements FileService {
  async saveProject(data: ProjectData): Promise<void> {
    // Electron fs API実装
  }
}
```

### 🟢 低優先度：直接利用OK

#### 5. UI系ライブラリ
**理由**: UI変更は見た目の変更で、ビジネスロジックに影響しない

```typescript
// ✅ 直接利用OK
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { Dialog } from '@headlessui/react';
import { Camera, Upload } from 'lucide-react';

// UI変更時は見た目だけの変更で済む
```

#### 6. ユーティリティ系
**理由**: 純粋関数的で置き換えコストが低い

```typescript
// ✅ 直接利用OK
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { z } from 'zod';

// 関数レベルの置き換えで対応可能
```

## 🏗️ 推奨アーキテクチャ構成

### ディレクトリ構造

```
src/
├── core/                    # ビジネスロジック（ライブラリ非依存）
│   ├── entities/           # エンティティ定義
│   ├── use-cases/          # ユースケース
│   └── interfaces/         # インターフェース定義
├── infrastructure/         # 外部ライブラリ実装
│   ├── repositories/       # データアクセス
│   ├── services/          # 外部サービス
│   └── adapters/          # アダプター実装
├── application/           # アプリケーション層
│   ├── hooks/             # カスタムフック
│   └── stores/            # 状態管理
├── presentation/          # UI層
│   ├── components/        # UIコンポーネント
│   └── pages/             # ページコンポーネント
└── shared/                # 共通要素
    ├── types/             # 型定義
    └── utils/             # ユーティリティ
```

### 具体的な実装例

#### インターフェース定義（core/interfaces）

```typescript
// core/interfaces/repositories.ts
export interface ImageAssetRepository {
  findAll(): Promise<ImageAsset[]>;
  findById(id: string): Promise<ImageAsset | null>;
  findByHash(hash: string): Promise<ImageAsset[]>;
  create(asset: Omit<ImageAsset, 'id'>): Promise<ImageAsset>;
  update(id: string, updates: Partial<ImageAsset>): Promise<void>;
  delete(id: string): Promise<void>;
}

// core/interfaces/services.ts
export interface ImageProcessingService {
  applyTransform(image: ImageData, transform: ImageTransform): Promise<ImageData>;
  renderGrid(layout: GridLayout): Promise<HTMLCanvasElement>;
  exportImage(canvas: HTMLCanvasElement, format: 'png' | 'jpeg'): Promise<Blob>;
}
```

#### 実装（infrastructure）

```typescript
// infrastructure/repositories/dexie-image-asset-repository.ts
export class DexieImageAssetRepository implements ImageAssetRepository {
  constructor(private db: ImageConcatDB) {}
  
  async findAll(): Promise<ImageAsset[]> {
    return await this.db.imageAssets.orderBy('createdAt').reverse().toArray();
  }
  
  async create(asset: Omit<ImageAsset, 'id'>): Promise<ImageAsset> {
    const id = generateUUID();
    const newAsset = { ...asset, id, createdAt: new Date().toISOString() };
    await this.db.imageAssets.add(newAsset);
    return newAsset;
  }
}

// infrastructure/services/konva-image-processing-service.ts
export class KonvaImageProcessingService implements ImageProcessingService {
  async applyTransform(image: ImageData, transform: ImageTransform): Promise<ImageData> {
    // Konva.js実装
  }
}
```

#### カスタムフック（application/hooks）

```typescript
// application/hooks/use-image-assets.ts
export function useImageAssets() {
  const repository = useImageAssetRepository(); // DIで注入
  
  return {
    imageAssets: useQuery(['imageAssets'], () => repository.findAll()),
    addImageAsset: useMutation((asset: Omit<ImageAsset, 'id'>) => 
      repository.create(asset)
    ),
  };
}
```

#### DI設定

```typescript
// infrastructure/di-container.ts
class DIContainer {
  private static instance: DIContainer;
  private services = new Map<string, any>();
  
  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }
  
  register<T>(key: string, implementation: T): void {
    this.services.set(key, implementation);
  }
  
  get<T>(key: string): T {
    return this.services.get(key);
  }
}

// 初期化
const container = DIContainer.getInstance();
container.register('imageAssetRepository', new DexieImageAssetRepository(db));
container.register('imageProcessingService', new KonvaImageProcessingService());
```

## 📊 コスト vs メリット分析

### 間接層のコスト

| 要素 | 初期コスト | 維持コスト | 複雑度増加 |
|------|-----------|-----------|-----------|
| Repository | 中 | 低 | 低 |
| Service | 中 | 低 | 中 |
| Custom Hooks | 低 | 低 | 低 |
| DI Container | 高 | 中 | 高 |

### 間接層のメリット

| 要素 | テスタビリティ | 置き換え容易性 | 保守性 |
|------|-------------|-------------|-------|
| Repository | 高 | 高 | 高 |
| Service | 高 | 高 | 高 |
| Custom Hooks | 中 | 中 | 高 |

## 🎯 推奨実装戦略

### Phase 1: 最小限の抽象化
```typescript
// 重要な部分のみ抽象化
const criticalAbstractions = [
  'ImageAssetRepository',
  'ImageProcessingService', 
  'useImageAssets',
  'useGridLayout'
];
```

### Phase 2: 必要に応じて拡張
```typescript
// 課題が見えてから追加
const additionalAbstractions = [
  'FileService',
  'StateManager',
  'EventBus'
];
```

## 🚀 実装開始時の推奨事項

### 1. 即座に間接層を設ける
- **ImageAssetRepository** 
- **ImageProcessingService**
- **useImageAssets**フック

### 2. 直接利用開始
- UI系ライブラリ（@dnd-kit、Headless UI）
- ユーティリティ系（Lucide、date-fns）

### 3. 経過観察
- Zustand（状態管理の複雑化時に抽象化検討）
- ファイル処理（将来要件次第）

この戦略により、**初期開発速度を保ちつつ、重要な部分のロックインリスクを回避**できます。過度な抽象化を避けながら、将来の技術選択肢を保持する現実的なアプローチです。