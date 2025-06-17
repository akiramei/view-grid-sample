# データベース設計詳細

## 🎯 設計方針

### ブラウザ内データベースとしてのIndexedDB活用
- **Dexie.js**を使用したIndexedDBラッパー
- **ブラウザ完結型**でのローカルデータ管理
- **高性能クエリ**と**ACID特性**の確保
- **型安全性**重視のスキーマ設計

### データモデリングの基本原則
1. **正規化**: データ重複を避けた効率的構造
2. **パフォーマンス**: インデックス最適化
3. **拡張性**: 将来機能追加への対応
4. **一貫性**: 外部キー制約による整合性確保

## 📊 データベーススキーマ

### 概念モデル図

```
┌─────────────┐    1    ∞ ┌─────────────┐    ∞    1 ┌─────────────┐
│ ImageAsset  │←──────────→│ ImageCopy   │←──────────→│GridPlacement│
│ (元画像)     │            │ (論理コピー)  │            │ (配置情報)   │
└─────────────┘            └─────────────┘            └─────────────┘
                                                           │
                                                           │ ∞
                                                           │
                                                           │ 1
                                                           ↓
                                                   ┌─────────────┐
                                                   │ GridCanvas  │
                                                   │ (グリッド)   │
                                                   └─────────────┘
```

### 関係性の説明
- **1つのImageAsset** → **複数のImageCopy**（論理コピー）
- **1つのImageCopy** → **複数のGridPlacement**（複数グリッドに配置可能）
- **1つのGridCanvas** → **複数のGridPlacement**（グリッド内の配置）

## 🗃️ テーブル設計詳細

### 1. image_asset（画像アセット）

**目的**: アップロードされた元画像の管理

```sql
CREATE TABLE image_asset (
    id TEXT PRIMARY KEY,
    source_type TEXT NOT NULL CHECK (source_type IN ('upload', 'url')),
    source TEXT NOT NULL,
    original_filename TEXT,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    file_hash TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT NOT NULL,
    created_at TEXT NOT NULL
);
```

**フィールド詳細**:
| フィールド | 型 | 必須 | 説明 | 例 |
|-----------|---|------|------|-----|
| `id` | TEXT | ✓ | UUID | `550e8400-e29b-41d4-a716-446655440000` |
| `source_type` | TEXT | ✓ | 取得方法 | `upload`, `url` |
| `source` | TEXT | ✓ | Base64データまたはURL | `data:image/jpeg;base64,/9j/4AAQ...` |
| `original_filename` | TEXT | | 元ファイル名 | `photo.jpg` |
| `width` | INTEGER | ✓ | 画像幅（px） | `1920` |
| `height` | INTEGER | ✓ | 画像高さ（px） | `1080` |
| `file_hash` | TEXT | ✓ | SHA-256ハッシュ | `a1b2c3d4e5f6...` |
| `file_size` | INTEGER | | ファイルサイズ（bytes） | `2048576` |
| `mime_type` | TEXT | ✓ | MIMEタイプ | `image/jpeg` |
| `created_at` | TEXT | ✓ | 作成日時（ISO 8601） | `2024-01-15T10:30:00.000Z` |

**ビジネスルール**:
- `file_hash`により重複画像を検出可能
- `source`がBase64の場合は10MB制限
- 対応形式: JPG, PNG, GIF, WebP

### 2. image_copy（論理コピー）

**目的**: 1つの元画像から作成される複数のバリエーション管理

```sql
CREATE TABLE image_copy (
    id TEXT PRIMARY KEY,
    asset_id TEXT NOT NULL,
    copy_name TEXT,
    
    -- 変形設定
    rotation INTEGER NOT NULL DEFAULT 0 CHECK (rotation IN (0, 90, 180, 270)),
    flip_x BOOLEAN NOT NULL DEFAULT FALSE,
    flip_y BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- 画像特性
    allow_enlarge BOOLEAN NOT NULL DEFAULT TRUE,
    allow_shrink BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- トリミング基準点
    trim_anchor_x TEXT NOT NULL DEFAULT 'center' CHECK (trim_anchor_x IN ('left', 'center', 'right')),
    trim_anchor_y TEXT NOT NULL DEFAULT 'center' CHECK (trim_anchor_y IN ('top', 'center', 'bottom')),
    
    -- アライメント設定
    align_x TEXT NOT NULL DEFAULT 'center' CHECK (align_x IN ('left', 'center', 'right')),
    align_y TEXT NOT NULL DEFAULT 'center' CHECK (align_y IN ('top', 'center', 'bottom')),
    
    -- 占有セル設定
    occupy_width INTEGER NOT NULL DEFAULT 1,
    occupy_height INTEGER NOT NULL DEFAULT 1,
    
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    
    FOREIGN KEY (asset_id) REFERENCES image_asset(id) ON DELETE CASCADE
);
```

**フィールド詳細**:
| カテゴリ | フィールド | 型 | デフォルト | 説明 |
|----------|-----------|---|-----------|------|
| **基本情報** | `id` | TEXT | - | UUID |
| | `asset_id` | TEXT | - | 元画像への参照 |
| | `copy_name` | TEXT | null | ユーザー定義名 |
| **変形** | `rotation` | INTEGER | 0 | 回転角度（度） |
| | `flip_x` | BOOLEAN | false | 水平反転 |
| | `flip_y` | BOOLEAN | false | 垂直反転 |
| **スケーリング** | `allow_enlarge` | BOOLEAN | true | 拡大許可 |
| | `allow_shrink` | BOOLEAN | true | 縮小許可 |
| **トリミング** | `trim_anchor_x` | TEXT | center | X軸基準点 |
| | `trim_anchor_y` | TEXT | center | Y軸基準点 |
| **アライメント** | `align_x` | TEXT | center | X軸配置 |
| | `align_y` | TEXT | center | Y軸配置 |
| **占有セル** | `occupy_width` | INTEGER | 1 | 占有幅（セル数） |
| | `occupy_height` | INTEGER | 1 | 占有高さ（セル数） |

**使用例**:
```typescript
// ロゴ画像：縮小のみ、原寸維持重視
{
  allow_enlarge: false,
  allow_shrink: true,
  occupy_width: 1,
  occupy_height: 1
}

// 背景画像：自由スケーリング、大きく配置
{
  allow_enlarge: true,
  allow_shrink: true,
  occupy_width: 2,
  occupy_height: 2
}
```

### 3. grid_canvas（グリッドキャンバス）

**目的**: 画像配置用のグリッド定義

```sql
CREATE TABLE grid_canvas (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    grid_rows INTEGER NOT NULL,
    grid_cols INTEGER NOT NULL,
    canvas_width INTEGER NOT NULL,
    canvas_height INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
```

**フィールド詳細**:
| フィールド | 型 | 制約 | 説明 | 例 |
|-----------|---|------|------|-----|
| `id` | TEXT | PK | UUID | `grid-001` |
| `name` | TEXT | NOT NULL | グリッド名 | `メインレイアウト` |
| `grid_rows` | INTEGER | 1-10 | 行数 | `3` |
| `grid_cols` | INTEGER | 1-10 | 列数 | `3` |
| `canvas_width` | INTEGER | 100-4096 | 出力幅（px） | `1200` |
| `canvas_height` | INTEGER | 100-4096 | 出力高さ（px） | `1200` |
| `is_active` | BOOLEAN | UNIQUE | アクティブフラグ | `true` |

**ビジネスルール**:
- `is_active = true`は常に1つのみ（トリガーで制御）
- セルサイズ = `canvas_width / grid_cols`, `canvas_height / grid_rows`
- グリッドサイズ制限: 最大10x10

### 4. grid_placement（グリッド配置）

**目的**: 特定のグリッド内での画像配置情報

```sql
CREATE TABLE grid_placement (
    id TEXT PRIMARY KEY,
    grid_id TEXT NOT NULL,
    copy_id TEXT NOT NULL,
    
    -- グリッド位置（0ベース）
    grid_x INTEGER NOT NULL,
    grid_y INTEGER NOT NULL,
    
    -- 微調整
    offset_x INTEGER NOT NULL DEFAULT 0,
    offset_y INTEGER NOT NULL DEFAULT 0,
    
    -- 表示順序
    placement_order INTEGER NOT NULL DEFAULT 0,
    
    created_at TEXT NOT NULL,
    
    FOREIGN KEY (grid_id) REFERENCES grid_canvas(id) ON DELETE CASCADE,
    FOREIGN KEY (copy_id) REFERENCES image_copy(id) ON DELETE CASCADE,
    
    -- 同一グリッド内での位置重複防止
    UNIQUE(grid_id, grid_x, grid_y)
);
```

**重要な制約**:
- `UNIQUE(grid_id, grid_x, grid_y)`: 同一セルへの重複配置防止
- 占有セル範囲の重複はアプリケーション層でチェック

## 🔧 インデックス設計

### パフォーマンス最適化用インデックス

```sql
-- 基本検索性能向上
CREATE INDEX idx_image_copy_asset_id ON image_copy(asset_id);
CREATE INDEX idx_grid_placement_grid_id ON grid_placement(grid_id);
CREATE INDEX idx_grid_placement_copy_id ON grid_placement(copy_id);

-- 重複検出用
CREATE INDEX idx_image_asset_hash ON image_asset(file_hash);

-- アクティブグリッド検索
CREATE INDEX idx_grid_canvas_active ON grid_canvas(is_active) WHERE is_active = TRUE;

-- 配置順序検索
CREATE INDEX idx_grid_placement_order ON grid_placement(grid_id, placement_order);

-- 位置ベース検索
CREATE INDEX idx_grid_placement_position ON grid_placement(grid_id, grid_x, grid_y);

-- 時系列検索
CREATE INDEX idx_image_asset_created ON image_asset(created_at);
CREATE INDEX idx_image_copy_updated ON image_copy(updated_at);
```

## 🛡️ データ整合性制御

### トリガー設計

#### 1. アクティブグリッド制約

```sql
-- アクティブグリッドは1つのみ許可
CREATE TRIGGER enforce_single_active_grid_update
BEFORE UPDATE ON grid_canvas
WHEN NEW.is_active = TRUE AND OLD.is_active = FALSE
BEGIN
  UPDATE grid_canvas SET is_active = FALSE WHERE is_active = TRUE AND id != NEW.id;
END;

CREATE TRIGGER enforce_single_active_grid_insert
BEFORE INSERT ON grid_canvas
WHEN NEW.is_active = TRUE
BEGIN
  UPDATE grid_canvas SET is_active = FALSE WHERE is_active = TRUE;
END;
```

#### 2. 配置境界チェック

```sql
-- 占有セルがグリッド範囲を超えないことをチェック
CREATE TRIGGER check_placement_bounds
BEFORE INSERT ON grid_placement
BEGIN
  SELECT CASE
    WHEN (
      SELECT (NEW.grid_x + c.occupy_width > g.grid_cols) OR 
             (NEW.grid_y + c.occupy_height > g.grid_rows)
      FROM image_copy c 
      JOIN grid_canvas g ON g.id = NEW.grid_id
      WHERE c.id = NEW.copy_id
    ) THEN RAISE(ABORT, 'Placement exceeds grid bounds')
  END;
END;
```

#### 3. 自動タイムスタンプ更新

```sql
CREATE TRIGGER update_image_copy_timestamp
AFTER UPDATE ON image_copy
BEGIN
  UPDATE image_copy SET updated_at = datetime('now') WHERE id = NEW.id;
END;
```

## 💾 Dexie.js実装例

### データベースクラス定義

```typescript
import Dexie, { type Table } from 'dexie';

export interface ImageAsset {
  id: string;
  sourceType: 'upload' | 'url';
  source: string;
  originalFilename?: string;
  width: number;
  height: number;
  fileHash: string;
  fileSize?: number;
  mimeType: string;
  createdAt: string;
}

export interface ImageCopy {
  id: string;
  assetId: string;
  copyName?: string;
  rotation: 0 | 90 | 180 | 270;
  flipX: boolean;
  flipY: boolean;
  allowEnlarge: boolean;
  allowShrink: boolean;
  trimAnchorX: 'left' | 'center' | 'right';
  trimAnchorY: 'top' | 'center' | 'bottom';
  alignX: 'left' | 'center' | 'right';
  alignY: 'top' | 'center' | 'bottom';
  occupyWidth: number;
  occupyHeight: number;
  createdAt: string;
  updatedAt: string;
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

export class ImageConcatDB extends Dexie {
  imageAssets!: Table<ImageAsset>;
  imageCopies!: Table<ImageCopy>;
  gridCanvases!: Table<GridCanvas>;
  gridPlacements!: Table<GridPlacement>;

  constructor() {
    super('ImageConcatDB');
    
    this.version(1).stores({
      imageAssets: 'id, fileHash, createdAt, mimeType',
      imageCopies: 'id, assetId, updatedAt, occupyWidth, occupyHeight',
      gridCanvases: 'id, isActive, updatedAt, name',
      gridPlacements: 'id, gridId, copyId, [gridX+gridY], placementOrder, createdAt'
    });

    // アクティブグリッド制約をフック実装
    this.gridCanvases.hook('creating', (primKey, obj, trans) => {
      if (obj.isActive) {
        return this.gridCanvases.where('isActive').equals(true).modify({ isActive: false });
      }
    });

    this.gridCanvases.hook('updating', (modifications, primKey, obj, trans) => {
      if (modifications.isActive === true) {
        return this.gridCanvases.where('isActive').equals(true).modify({ isActive: false });
      }
    });
  }
}

export const db = new ImageConcatDB();
```

### 複雑なクエリ例

```typescript
// アクティブグリッドの全配置情報を取得
export async function getActiveGridWithPlacements() {
  const activeGrid = await db.gridCanvases
    .where('isActive').equals(true)
    .first();
    
  if (!activeGrid) return null;
  
  const placements = await db.gridPlacements
    .where('gridId').equals(activeGrid.id)
    .orderBy('placementOrder')
    .toArray();
  
  // 配置された画像コピーと元画像を結合
  const placementsWithImages = await Promise.all(
    placements.map(async (placement) => {
      const copy = await db.imageCopies.get(placement.copyId);
      const asset = copy ? await db.imageAssets.get(copy.assetId) : null;
      
      return {
        ...placement,
        imageCopy: copy,
        imageAsset: asset
      };
    })
  );
  
  return {
    grid: activeGrid,
    placements: placementsWithImages
  };
}

// 重複画像の検出
export async function findDuplicateImages(fileHash: string): Promise<ImageAsset[]> {
  return await db.imageAssets
    .where('fileHash').equals(fileHash)
    .toArray();
}

// 占有セル範囲の重複チェック
export async function checkPlacementConflict(
  gridId: string,
  gridX: number,
  gridY: number,
  occupyWidth: number,
  occupyHeight: number
): Promise<boolean> {
  const existingPlacements = await db.gridPlacements
    .where('gridId').equals(gridId)
    .toArray();
  
  // 新しい配置の占有セル計算
  const newCells = [];
  for (let x = gridX; x < gridX + occupyWidth; x++) {
    for (let y = gridY; y < gridY + occupyHeight; y++) {
      newCells.push({ x, y });
    }
  }
  
  // 既存配置との重複チェック
  for (const existing of existingPlacements) {
    const existingCopy = await db.imageCopies.get(existing.copyId);
    if (!existingCopy) continue;
    
    // 既存配置の占有セル計算
    for (let x = existing.gridX; x < existing.gridX + existingCopy.occupyWidth; x++) {
      for (let y = existing.gridY; y < existing.gridY + existingCopy.occupyHeight; y++) {
        if (newCells.some(cell => cell.x === x && cell.y === y)) {
          return true; // 重複あり
        }
      }
    }
  }
  
  return false; // 重複なし
}
```

## 📈 容量管理・最適化

### ストレージ使用量監視

```typescript
export async function getStorageUsage() {
  const [assetCount, copyCount, placementCount] = await Promise.all([
    db.imageAssets.count(),
    db.imageCopies.count(),
    db.gridPlacements.count()
  ]);
  
  // 概算容量計算
  const estimatedSize = await db.imageAssets.toCollection().reduce((total, asset) => {
    return total + (asset.fileSize || 0);
  }, 0);
  
  return {
    assetCount,
    copyCount,
    placementCount,
    estimatedSizeMB: estimatedSize / (1024 * 1024)
  };
}

// 古いデータの自動削除
export async function cleanupOldData(daysToKeep: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  const cutoffISO = cutoffDate.toISOString();
  
  // 使用されていない古いアセットを削除
  const unusedAssets = await db.imageAssets
    .where('createdAt').below(cutoffISO)
    .filter(asset => {
      return db.imageCopies.where('assetId').equals(asset.id).count().then(count => count === 0);
    })
    .toArray();
    
  await db.imageAssets.bulkDelete(unusedAssets.map(asset => asset.id));
}
```

## 🔄 マイグレーション戦略

### 将来のスキーマ変更対応

```typescript
export class ImageConcatDB extends Dexie {
  constructor() {
    super('ImageConcatDB');
    
    // Version 1: 初期スキーマ
    this.version(1).stores({
      imageAssets: 'id, fileHash, createdAt',
      imageCopies: 'id, assetId, updatedAt',
      gridCanvases: 'id, isActive, updatedAt',
      gridPlacements: 'id, gridId, copyId, [gridX+gridY]'
    });
    
    // Version 2: フィールド追加（将来の例）
    this.version(2).stores({
      imageAssets: 'id, fileHash, createdAt, mimeType, fileSize',
      imageCopies: 'id, assetId, updatedAt, occupyWidth, occupyHeight',
      gridCanvases: 'id, isActive, updatedAt, name',
      gridPlacements: 'id, gridId, copyId, [gridX+gridY], placementOrder'
    }).upgrade(trans => {
      // マイグレーション処理
      return trans.imageAssets.toCollection().modify(asset => {
        asset.mimeType = asset.mimeType || 'image/jpeg';
        asset.fileSize = asset.fileSize || 0;
      });
    });
  }
}
```

この詳細なデータベース設計により、堅牢で拡張性の高いデータ管理を実現できます。