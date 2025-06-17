# 画像連結ソフトウェア仕様書

## 1. プロジェクト概要

### 1.1 目的
**画像連結に特化した**ブラウザベースソフトウェアの開発。従来の単純な左右・上下連結を超越し、NxMグリッドベースの直感的配置により、複雑な画像レイアウトを1枚の統合画像として出力する。

### 1.2 設計哲学
**「画像連結の特化性によるシンプルさ」**
- 複雑な画像編集機能は排除し、連結に必要な機能のみを提供
- グリッドベース配置により「最終的な見た目」を想像しながら作業
- 2フェーズワークフロー：準備フェーズ → 配置フェーズ

### 1.3 革新的特徴
- **画像特性システム**: 画像ごとの縮小・拡大ポリシー設定
- **論理コピー機能**: 1つの画像から複数バリエーション（回転・反転）を効率管理
- **占有セル概念**: 画像が複数セルにまたがる配置を直感的に設定
- **セル単位制御**: グリッド位置に応じた最適なアライメント設定

### 1.4 対象ユーザー
- デザイナー・クリエイター（コラージュ、レイアウト作成）
- ソーシャルメディア投稿者（画像まとめ投稿）
- プレゼンテーション作成者（資料用画像統合）
- 一般ユーザー（家族写真の整理・統合）

## 2. 技術仕様

### 2.1 技術スタック

| 分野 | 技術 | 理由 |
|------|------|------|
| フロントエンド | React + TypeScript | 型安全性とコンポーネント再利用性 |
| 状態管理 | useContext / Jotai | 軽量で拡張性のある状態管理 |
| スタイリング | Tailwind CSS | 迅速な開発とデザイン一貫性 |
| データベース | SQLite | ブラウザ内完結、軽量 |
| 型バリデーション | Zod | ランタイム型チェック |
| エラーハンドリング | neverthrow | 関数型エラーハンドリング |
| テスト | Vitest | 高速なテスト実行 |
| Lint | ESLint | コード品質管理 |
| ユーティリティ | react-use | 再利用可能なフック集 |

### 2.2 アーキテクチャ

```
┌─────────────────┐
│   UI層          │ ← 画像配置、編集、状態表示
├─────────────────┤
│   サービス層     │ ← ビジネスロジック
├─────────────────┤
│   API層         │ ← データ変換・バリデーション
├─────────────────┤
│   データ層      │ ← SQLite, ローカルストレージ
└─────────────────┘
```

### 2.3 プロジェクト構成

```
src/
├── components/           # UIコンポーネント
├── services/            # ビジネスロジック
├── api/                 # API層
├── types/               # 型定義
├── shared/              # 共有型・スキーマ
├── hooks/               # カスタムフック
├── utils/               # ユーティリティ
├── stores/              # 状態管理
└── i18n/                # 国際化
```

## 3. 機能仕様

### 3.1 2フェーズワークフロー

#### 3.1.1 準備フェーズ（画像素材管理）
**画像の取り込み**
- **対応形式**: JPG, PNG, GIF, WebP
- **取り込み方法**: ファイルアップロード、URL指定、ドラッグ&ドロップ
- **制約**: 最大ファイルサイズ50MB、最大解像度8192x8192px

**論理コピー機能**
- 1つの元画像から複数の論理インスタンス（コピー）を作成
- 各論理コピーは独立した特性を持つ
- ファイルシステム上では1ファイルのまま管理（メモリ効率化）
- 論理コピーの作成・削除・複製が可能

#### 3.1.2 配置フェーズ（グリッド配置）
**アクティブグリッド概念**
- 複数グリッドが存在するが、編集対象は常に1つのアクティブグリッドのみ
- グリッド間の画像移動・連携機能は提供しない（シンプルさ重視）
- グリッド切り替えによりアクティブグリッドを変更

### 3.2 画像特性システム（論理コピーごと設定）

#### 3.2.1 スケーリングポリシー
```typescript
type ScalingPolicy = {
  allowEnlarge: boolean;    // 拡大許可
  allowShrink: boolean;     // 縮小許可
};

// 設定例
// { allowEnlarge: true, allowShrink: true }   // 自由スケーリング
// { allowEnlarge: false, allowShrink: true }  // 縮小のみ（ロゴ等に最適）
// { allowEnlarge: true, allowShrink: false }  // 拡大のみ（背景等に最適）
// { allowEnlarge: false, allowShrink: false } // 原寸固定
```

#### 3.2.2 トリミング基準点
スケーリングポリシーで拡大・縮小が禁止されている場合のトリミング制御
```typescript
type TrimmingAnchor = {
  x: 'left' | 'center' | 'right';
  y: 'top' | 'center' | 'bottom';
};

// 例：{ x: 'center', y: 'top' } → 上中央を基準にトリミング
```

#### 3.2.3 アライメント設定
セル内での画像配置（スケーリング後の位置調整）
```typescript
type Alignment = {
  x: 'left' | 'center' | 'right';
  y: 'top' | 'center' | 'bottom';
};

// サイズがぴったりでも設定値は保持（将来的な調整に備える）
```

#### 3.2.4 変形設定
```typescript
type Transform = {
  rotation: 0 | 90 | 180 | 270;  // 度数
  flipX: boolean;                // 水平反転
  flipY: boolean;                // 垂直反転
};
```

### 3.3 占有セル設定

#### 3.3.1 占有セル概念
- 画像が占有するセル数をNxM形式で定義（例：2x1、3x2）
- 占有セル全体が画像の配置・スケーリング単位となる
- **制約**: NxMの矩形のみ（L字型等の非矩形は不可）

#### 3.3.2 配置制約
- 占有セルがグリッドサイズを超える場合は配置不可
- 他の画像と重複する配置は不可
- グリッド境界をまたぐ配置は不可

#### 3.3.3 占有セル内での処理
- スケーリング計算は占有セル全体のサイズを基準とする
- アライメントも占有セル全体内での位置調整となる

### 3.4 グリッド配置システム

#### 3.4.1 基本配置操作
- **操作方法**: ドラッグ&ドロップ
- **配置先**: セル単位（占有セル設定に応じて複数セルまたがり可能）
- **視覚的フィードバック**: 配置可能領域のハイライト表示

#### 3.4.2 配置時の動作
1. **サイズ判定**: 占有セル vs 画像サイズ
2. **スケーリング適用**: 画像特性に基づく拡大・縮小
3. **トリミング適用**: スケーリング不可の場合のトリミング
4. **アライメント適用**: セル内での最終位置調整

#### 3.4.3 セル単位の個別設定
各セルに対して以下を個別設定可能：
- デフォルトアライメント（グリッド位置に応じた最適値）
- 例：3x3グリッドの場合
  ```
  left-top    | center-top    | right-top
  left-center | center-center | right-center  
  left-bottom | center-bottom | right-bottom
  ```

### 3.5 キャンバス・グリッド管理

#### 3.5.1 グリッド作成
- **入力項目**
  - グリッド名
  - グリッドサイズ（NxM、最大20x20）
  - 出力サイズ（幅x高さ、最大8192x8192px）
- **制約**: 出力サイズはグリッドで整数除算可能

#### 3.5.2 グリッド操作
- アクティブグリッドの切り替え
- グリッドの複製・削除・リネーム
- 編集画面での縮小表示対応

### 3.6 編集機能

#### 3.6.1 選択とフォーカス
- 配置済み画像インスタンスの選択
- 選択状態の視覚的表示（ボーダー、ハンドル表示）
- プロパティパネルでの特性編集

#### 3.6.2 履歴管理
- **Undo/Redo**: 最大50ステップ
- **履歴対象操作**
  - 画像配置・移動・削除
  - 特性変更（スケーリング、アライメント、変形）
  - 占有セル設定変更

### 3.7 出力機能

#### 3.7.1 画像出力
- **フォーマット**: PNG（アルファチャンネル対応）
- **出力サイズ**: グリッド作成時に指定したサイズで出力
- **出力モード**
  - 標準出力: 指定サイズで出力
  - トリミング出力: 余白を除去して出力

#### 3.7.2 プロジェクト保存
- アクティブグリッドの状態をブラウザ内データベースに保存
- プロジェクトのエクスポート/インポート（JSON形式）

## 4. データベース設計

### 4.1 テーブル構成

#### 4.1.1 grid_canvas（グリッド定義）
```sql
CREATE TABLE grid_canvas (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    grid_rows INTEGER NOT NULL,
    grid_cols INTEGER NOT NULL,
    canvas_width INTEGER NOT NULL,
    canvas_height INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,  -- アクティブグリッド管理
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
```

#### 4.1.2 image_asset（元画像）
```sql
CREATE TABLE image_asset (
    id TEXT PRIMARY KEY,
    source_type TEXT NOT NULL CHECK (source_type IN ('upload', 'url')),
    source TEXT NOT NULL,
    original_filename TEXT,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    file_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
);
```

#### 4.1.3 image_copy（論理コピー）
```sql
CREATE TABLE image_copy (
    id TEXT PRIMARY KEY,
    asset_id TEXT NOT NULL,
    copy_name TEXT,                           -- ユーザー定義のコピー名
    
    -- 変形設定
    rotation INTEGER NOT NULL DEFAULT 0 CHECK (rotation IN (0, 90, 180, 270)),
    flip_x BOOLEAN NOT NULL DEFAULT FALSE,
    flip_y BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- スケーリングポリシー
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

#### 4.1.4 grid_placement（グリッド配置）
```sql
CREATE TABLE grid_placement (
    id TEXT PRIMARY KEY,
    grid_id TEXT NOT NULL,
    copy_id TEXT NOT NULL,
    
    -- グリッド位置（0ベース）
    grid_x INTEGER NOT NULL,
    grid_y INTEGER NOT NULL,
    
    -- 配置時の微調整（将来拡張用）
    offset_x INTEGER NOT NULL DEFAULT 0,
    offset_y INTEGER NOT NULL DEFAULT 0,
    
    placement_order INTEGER NOT NULL DEFAULT 0,  -- 配置順序（重なり順制御）
    
    created_at TEXT NOT NULL,
    
    FOREIGN KEY (grid_id) REFERENCES grid_canvas(id) ON DELETE CASCADE,
    FOREIGN KEY (copy_id) REFERENCES image_copy(id) ON DELETE CASCADE,
    
    -- 同一グリッド内での位置重複防止
    UNIQUE(grid_id, grid_x, grid_y)
);
```

### 4.2 インデックス設計

```sql
-- パフォーマンス最適化用インデックス
CREATE INDEX idx_image_copy_asset_id ON image_copy(asset_id);
CREATE INDEX idx_grid_placement_grid_id ON grid_placement(grid_id);
CREATE INDEX idx_grid_placement_copy_id ON grid_placement(copy_id);
CREATE INDEX idx_image_asset_hash ON image_asset(file_hash);
CREATE INDEX idx_grid_canvas_active ON grid_canvas(is_active);
CREATE INDEX idx_grid_placement_position ON grid_placement(grid_id, grid_x, grid_y);
```

### 4.3 データ制約とビジネスルール

#### 4.3.1 アクティブグリッド制約
```sql
-- アクティブグリッドは1つのみ許可
CREATE TRIGGER enforce_single_active_grid
BEFORE UPDATE ON grid_canvas
WHEN NEW.is_active = TRUE
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

#### 4.3.2 配置制約チェック
```sql
-- 占有セル範囲がグリッドサイズを超えないことをチェック
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

### 4.4 データ操作の基本パターン

#### 4.4.1 論理コピー作成
```sql
-- 元画像から論理コピーを作成
INSERT INTO image_copy (id, asset_id, copy_name, rotation, flip_x, flip_y, ...)
VALUES (?, ?, ?, ?, ?, ?, ...);
```

#### 4.4.2 グリッド配置
```sql
-- 占有セル範囲の重複チェック後に配置
WITH occupied_cells AS (
  SELECT DISTINCT 
    g.grid_x + x_offset as x, 
    g.grid_y + y_offset as y
  FROM grid_placement g
  JOIN image_copy c ON c.id = g.copy_id
  CROSS JOIN (
    SELECT value as x_offset FROM generate_series(0, c.occupy_width-1)
  ) x_range
  CROSS JOIN (
    SELECT value as y_offset FROM generate_series(0, c.occupy_height-1)  
  ) y_range
  WHERE g.grid_id = ?
)
-- 新規配置可能かチェック...
```

#### 4.4.3 アクティブグリッドの画像一覧取得
```sql
SELECT 
  p.id as placement_id,
  p.grid_x, p.grid_y,
  c.id as copy_id, c.copy_name,
  c.rotation, c.flip_x, c.flip_y,
  c.allow_enlarge, c.allow_shrink,
  c.trim_anchor_x, c.trim_anchor_y,
  c.align_x, c.align_y,
  c.occupy_width, c.occupy_height,
  a.id as asset_id, a.source, a.width, a.height
FROM grid_placement p
JOIN image_copy c ON c.id = p.copy_id  
JOIN image_asset a ON a.id = c.asset_id
JOIN grid_canvas g ON g.id = p.grid_id
WHERE g.is_active = TRUE
ORDER BY p.placement_order;
```

## 5. 状態管理設計

### 5.1 グローバル状態構造

```typescript
interface AppState {
  // グリッド管理
  grids: GridCanvas[];
  activeGridId: string | null;
  
  // 画像素材管理（準備フェーズ）
  imageAssets: ImageAsset[];
  imageCopies: ImageCopy[];
  
  // 配置管理（配置フェーズ）
  gridPlacements: GridPlacement[];
  
  // UI状態
  selectedCopyIds: string[];
  selectedPlacementIds: string[];
  zoomLevel: number;
  viewMode: 'asset-management' | 'grid-editing' | 'preview';
  
  // アプリケーション設定
  language: 'en' | 'ja';
  showGrid: boolean;
  snapToGrid: boolean;
  
  // 履歴管理
  history: {
    past: GridState[];
    present: GridState;
    future: GridState[];
  };
}
```

### 5.2 コア型定義

#### 5.2.1 グリッド関連
```typescript
interface GridCanvas {
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

interface GridPlacement {
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

#### 5.2.2 画像素材関連
```typescript
interface ImageAsset {
  id: string;
  sourceType: 'upload' | 'url';
  source: string;
  originalFilename?: string;
  width: number;
  height: number;
  fileHash: string;
  createdAt: string;
}

interface ImageCopy {
  id: string;
  assetId: string;
  copyName?: string;
  
  // 変形設定
  transform: ImageTransform;
  
  // 画像特性
  characteristics: ImageCharacteristics;
  
  // 占有セル設定
  occupySize: OccupySize;
  
  createdAt: string;
  updatedAt: string;
}
```

#### 5.2.3 画像特性詳細型
```typescript
interface ImageTransform {
  rotation: 0 | 90 | 180 | 270;
  flipX: boolean;
  flipY: boolean;
}

interface ImageCharacteristics {
  scalingPolicy: ScalingPolicy;
  trimmingAnchor: TrimmingAnchor;
  alignment: Alignment;
}

interface ScalingPolicy {
  allowEnlarge: boolean;
  allowShrink: boolean;
}

interface TrimmingAnchor {
  x: 'left' | 'center' | 'right';
  y: 'top' | 'center' | 'bottom';
}

interface Alignment {
  x: 'left' | 'center' | 'right';
  y: 'top' | 'center' | 'bottom';
}

interface OccupySize {
  width: number;  // 占有セル幅
  height: number; // 占有セル高さ
}
```

#### 5.2.4 履歴管理
```typescript
interface GridState {
  gridId: string;
  placements: GridPlacement[];
  timestamp: number;
  operation: HistoryOperation;
}

type HistoryOperation = 
  | 'place-image'
  | 'move-image' 
  | 'remove-image'
  | 'modify-characteristics'
  | 'modify-occupy-size';
```

### 5.3 ビジネスロジック型

#### 5.3.1 配置検証
```typescript
interface PlacementValidation {
  isValid: boolean;
  conflictingPlacements: string[];
  outOfBounds: boolean;
  occupiedCells: CellPosition[];
}

interface CellPosition {
  x: number;
  y: number;
}
```

#### 5.3.2 画像レンダリング情報
```typescript
interface RenderedImageInfo {
  copyId: string;
  placementId: string;
  
  // 最終描画位置・サイズ
  renderX: number;
  renderY: number;
  renderWidth: number;
  renderHeight: number;
  
  // スケーリング情報
  appliedScaling: {
    scaleX: number;
    scaleY: number;
    wasEnlarged: boolean;
    wasShrunk: boolean;
    wasTrimed: boolean;
  };
  
  // 変形情報
  appliedTransform: ImageTransform;
}
```

### 5.4 状態操作パターン

#### 5.4.1 準備フェーズの操作
```typescript
// 画像アセット追加
const addImageAsset = (asset: Omit<ImageAsset, 'id' | 'createdAt'>): ImageAsset => {
  const newAsset: ImageAsset = {
    ...asset,
    id: generateUUID(),
    createdAt: new Date().toISOString(),
  };
  return newAsset;
};

// 論理コピー作成
const createImageCopy = (
  assetId: string, 
  characteristics?: Partial<ImageCharacteristics>
): ImageCopy => {
  return {
    id: generateUUID(),
    assetId,
    copyName: undefined,
    transform: { rotation: 0, flipX: false, flipY: false },
    characteristics: {
      scalingPolicy: { allowEnlarge: true, allowShrink: true },
      trimmingAnchor: { x: 'center', y: 'center' },
      alignment: { x: 'center', y: 'center' },
      ...characteristics,
    },
    occupySize: { width: 1, height: 1 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};
```

#### 5.4.2 配置フェーズの操作
```typescript
// 画像配置
const placeImageCopy = (
  copyId: string,
  gridX: number,
  gridY: number,
  activeGridId: string
): Result<GridPlacement, PlacementError> => {
  // 1. 占有セル計算
  // 2. 配置可能性検証
  // 3. 重複チェック
  // 4. 配置実行
};

// 配置可能性検証
const validatePlacement = (
  copy: ImageCopy,
  gridX: number,
  gridY: number,
  grid: GridCanvas,
  existingPlacements: GridPlacement[]
): PlacementValidation => {
  // 境界チェック、重複チェック、占有セル計算
};
```

### 5.5 状態の永続化

#### 5.5.1 保存すべき状態
- グリッド定義（grid_canvas テーブル）
- 画像アセット（image_asset テーブル）
- 論理コピー設定（image_copy テーブル）  
- 配置情報（grid_placement テーブル）

#### 5.5.2 一時的な状態
- UI状態（選択、ズーム、表示モード）
- 履歴情報（セッション中のみ保持）
- レンダリング情報（計算結果、キャッシュ）

## 6. ユーザーインターフェース設計

### 6.1 2フェーズワークフロー対応UI

#### 6.1.1 メイン画面構成
```
┌─────────────────────────────────────────────────────────────────┐
│ ヘッダー（ロゴ、言語切替、フェーズ切替タブ、出力ボタン）                    │
├─────────────────┬───────────────────────┬─────────────────────┤
│【準備フェーズ】    │                      │                     │
│ 画像アセット管理   │   メインワークエリア      │  プロパティパネル      │
│ - アップロード    │                      │                     │
│ - URL追加       │   【配置フェーズ】        │  【準備フェーズ】      │
│ - 重複検出      │   - グリッドキャンバス     │  - 画像特性設定       │
│                │   - 画像配置・編集        │  - 論理コピー管理     │
│ 論理コピー一覧   │   - ズーム・パン操作      │                     │
│ - コピー作成     │                      │  【配置フェーズ】      │
│ - 特性プリセット  │   【プレビューモード】    │  - 配置画像設定       │
│ - バリエーション  │   - 最終出力プレビュー     │  - 位置・サイズ調整    │
└─────────────────┴───────────────────────┴─────────────────────┘
```

#### 6.1.2 フェーズ切替タブ
```
┌─────┬─────┬─────┬─────┐
│準備  │配置  │調整  │出力  │
└─────┴─────┴─────┴─────┘
```

### 6.2 準備フェーズUI

#### 6.2.1 画像アセット管理パネル
```
┌─────────────────────────┐
│ 📁 画像アセット管理        │
├─────────────────────────┤
│ [+] アップロード  [🔗] URL │
├─────────────────────────┤
│ 🔍 検索: [_____________] │
├─────────────────────────┤
│ 📷 image1.jpg (1.2MB)   │
│   ├─ 🔄 コピー1 (90°)    │
│   ├─ 🔄 コピー2 (反転)   │
│   └─ [+] 新規コピー      │
├─────────────────────────┤
│ 📷 image2.png (0.8MB)   │
│   └─ 🔄 オリジナル       │
└─────────────────────────┘
```

#### 6.2.2 論理コピー詳細設定
```
┌─────────────────────────┐
│ 🔄 コピー設定: コピー1     │
├─────────────────────────┤
│ 📝 名前: [_____________] │
├─────────────────────────┤
│ 🔄 変形                │
│ 回転: [0°ⓥ] 反転: □H □V  │
├─────────────────────────┤
│ 📏 スケーリングポリシー    │
│ 拡大: ☑ 許可  縮小: ☑ 許可 │
├─────────────────────────┤
│ ✂️ トリミング基準点       │
│ X: [中央ⓥ]  Y: [中央ⓥ]   │
├─────────────────────────┤
│ 📍 アライメント           │
│ X: [中央ⓥ]  Y: [中央ⓥ]   │
├─────────────────────────┤
│ 📐 占有セル              │
│ 幅: [1] セル  高さ: [1] セル │
└─────────────────────────┘
```

### 6.3 配置フェーズUI

#### 6.3.1 グリッドキャンバス
```
┌─────────────────────────────────────────┐
│ 🎯 グリッド: メインレイアウト (3x3)          │
├─────────────────────────────────────────┤
│ ┌─────┬─────┬─────┐ [100%ⓥ] 🔍+🔍-     │
│ │  1  │  2  │  3  │                   │
│ ├─────┼─────┼─────┤                   │
│ │  4  │[IMG]│  6  │ 📷: 選択中の画像      │
│ ├─────┼─────┼─────┤ 位置: (1,1)        │
│ │  7  │  8  │  9  │ サイズ: 1x1        │
│ └─────┴─────┴─────┘                   │
├─────────────────────────────────────────┤
│ ⚠️ 配置ガイド: ドラッグで配置              │
│ ✅ 配置可能  ❌ 重複  ⚠️ 範囲外           │
└─────────────────────────────────────────┘
```

#### 6.3.2 配置可能性ビジュアルフィードバック
```
グリッド表示例（3x3、2x1画像を配置時）：

┌─────┬─────┬─────┐
│ ✅  │ ✅  │ ❌  │ ← 配置可能/不可の色分け
├─────┼─────┼─────┤
│ ✅  │ ✅  │ ❌  │ 
├─────┼─────┼─────┤
│ ❌  │ ❌  │ ❌  │
└─────┴─────┴─────┘

✅ 緑色: 配置可能
❌ 赤色: 既に占有済み/範囲外
🔶 黄色: 配置予定範囲（ドラッグ中）
```

### 6.4 プロパティパネル

#### 6.4.1 配置済み画像の設定
```
┌─────────────────────────┐
│ 🖼️ 配置画像: コピー1       │
├─────────────────────────┤
│ 📍 位置                 │
│ X: [1] Y: [1] (セル座標)   │
├─────────────────────────┤
│ 📐 占有セル              │
│ 幅: [2] 高さ: [1]        │
│ [⚠️ 範囲外の場合は警告]     │
├─────────────────────────┤
│ 🎯 配置内アライメント      │
│ ┌─────┬─────┬─────┐      │
│ │ ↖  │ ↑  │ ↗  │      │
│ ├─────┼─────┼─────┤      │
│ │ ←  │ ⊙  │ →  │      │
│ ├─────┼─────┼─────┤      │
│ │ ↙  │ ↓  │ ↘  │      │
│ └─────┴─────┴─────┘      │
├─────────────────────────┤
│ 🔧 微調整                │
│ ΔX: [0]px  ΔY: [0]px    │
├─────────────────────────┤
│ [🗑️ 削除] [📋 複製]       │
└─────────────────────────┘
```

### 6.5 グリッド管理UI

#### 6.5.1 グリッド一覧・切替
```
┌─────────────────────────┐
│ 📊 グリッド管理           │
├─────────────────────────┤
│ ● メインレイアウト (3x3)  │ ← アクティブ
│ ○ サムネイル用 (2x2)     │
│ ○ バナー用 (5x1)        │
├─────────────────────────┤
│ [+] 新規グリッド作成      │
└─────────────────────────┘
```

#### 6.5.2 グリッド作成ダイアログ
```
┌─────────────────────────┐
│ 📊 新規グリッド作成       │
├─────────────────────────┤
│ 📝 名前:                │
│ [___________________]   │
├─────────────────────────┤
│ 📐 グリッドサイズ         │
│ 行: [3] × 列: [3]       │
├─────────────────────────┤
│ 📏 出力サイズ (px)       │
│ 幅: [1200] × 高さ: [1200] │
├─────────────────────────┤
│ ✅ セルサイズ: 400×400px  │
├─────────────────────────┤
│ [キャンセル] [作成]       │
└─────────────────────────┘
```

### 6.6 出力・プレビューUI

#### 6.6.1 プレビューモード
```
┌─────────────────────────────────────────┐
│ 👁️ プレビュー: メインレイアウト             │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │                                   │ │
│ │        最終出力イメージ               │ │
│ │        (1200×1200px)              │ │
│ │                                   │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ 🔍 ズーム: [25%ⓥ] [実寸] [フィット]       │
├─────────────────────────────────────────┤
│ 💾 出力設定                            │
│ 形式: [PNG ⓥ] 品質: [高 ⓥ]              │
│ ☑ 余白トリミング                       │
└─────────────────────────────────────────┘
```

### 6.7 レスポンシブ対応

#### 6.7.1 タブレット表示
```
┌─────────────────────────┐
│ ヘッダー + タブ切替        │
├─────────────────────────┤
│                        │
│   メインワークエリア       │
│                        │
├─────────────────────────┤
│ [🎛️] ← サイドパネル折畳    │
└─────────────────────────┘
```

#### 6.7.2 モバイル表示
```
┌─────────────────┐
│ ヘッダー          │
├─────────────────┤
│ [準備][配置][出力] │ ← タブ切替
├─────────────────┤
│                │
│ 単一ペイン表示    │
│                │
├─────────────────┤
│ [⚙️] [📷] [📊]   │ ← ボトムツールバー
└─────────────────┘
```

### 6.8 キーボードショートカット拡張

#### 6.8.1 フェーズ切替
- `Tab`: 次のフェーズに切替
- `Shift+Tab`: 前のフェーズに切替

#### 6.8.2 論理コピー操作
- `Ctrl+D`: 選択コピーを複製
- `R`: 90度回転
- `H`: 水平反転
- `V`: 垂直反転

#### 6.8.3 配置操作
- `Arrow Keys`: 選択画像を1セル移動
- `Shift+Arrow`: 占有セルサイズ変更
- `Ctrl+Arrow`: 1px微調整

### 6.9 アクセシビリティ対応

#### 6.9.1 視覚的配慮
- 高コントラストモード対応
- 色覚異常者向けの色選択
- 配置状態のテキスト読み上げ対応

#### 6.9.2 操作性配慮
- フルキーボードナビゲーション
- スクリーンリーダー対応
- 操作結果の音声フィードバック

## 7. パフォーマンス要件

### 7.1 レスポンス性能
- 画像アップロード: 10MB以下は3秒以内
- グリッド操作: 60FPS維持
- Undo/Redo: 100ms以内

### 7.2 メモリ使用量
- 最大メモリ使用量: 1GB
- 画像キャッシュ: 最大100枚

### 7.3 対応ブラウザ
- Chrome: 90+
- Firefox: 88+
- Safari: 14+
- Edge: 90+

## 8. セキュリティ要件

### 8.1 データ保護
- 全データはローカル保存（外部送信なし）
- アップロード画像の自動削除機能

### 8.2 入力検証
- ファイル形式の厳密チェック
- SQLインジェクション対策
- XSS対策

## 9. テスト仕様

### 9.1 単体テスト
- **対象**: サービス層、ユーティリティ関数
- **カバレッジ**: 90%以上

### 9.2 統合テスト
- **対象**: API層、データベース操作
- **ツール**: Vitest

### 9.3 E2Eテスト
- **シナリオ**: 主要操作フローの自動テスト
- **ツール**: Playwright

## 10. 開発計画

### 10.1 フェーズ1: 基盤構築（MVP）
**目標**: 基本的な2フェーズワークフローの実現

- [x] プロジェクト基盤構築
- [ ] データベース設計・実装
- [ ] 基本UI構造（フェーズ切替、グリッド表示）
- [ ] 画像アセット管理（アップロード、表示）
- [ ] 論理コピー基本機能
- [ ] シンプルなグリッド配置（1x1のみ）

**成果物**: 基本的な画像連結が可能なプロトタイプ

### 10.2 フェーズ2: 画像特性システム実装
**目標**: 核となる画像特性機能の完成

- [ ] スケーリングポリシー実装
- [ ] トリミング基準点制御
- [ ] アライメントシステム
- [ ] 占有セル機能（NxM配置）
- [ ] 画像変形（回転・反転）
- [ ] 配置検証ロジック

**成果物**: 高度な配置制御が可能な画像連結ツール

### 10.3 フェーズ3: UX向上・出力機能
**目標**: 実用性とユーザビリティの向上

- [ ] 履歴管理（Undo/Redo）
- [ ] 画像出力機能（PNG、トリミング）
- [ ] プレビューモード
- [ ] 配置ガイド・ビジュアルフィードバック
- [ ] キーボードショートカット
- [ ] エラーハンドリング・バリデーション

**成果物**: 実用レベルの画像連結ソフトウェア

### 10.4 フェーズ4: 完成・最適化
**目標**: プロダクション品質への仕上げ

- [ ] 多言語対応（日本語・英語）
- [ ] レスポンシブ対応
- [ ] パフォーマンス最適化
- [ ] アクセシビリティ対応
- [ ] 包括的テスト実装
- [ ] ドキュメント整備

**成果物**: 完成した画像連結ソフトウェア

### 10.5 技術的マイルストーン

#### 10.5.1 コア機能実装順序
1. **画像アセット管理** → 論理コピー → 画像特性
2. **グリッド基盤** → 配置検証 → 占有セル
3. **レンダリング** → スケーリング → トリミング
4. **UI統合** → UX改善 → 最適化

#### 10.5.2 技術的課題と対策
**Canvas API活用**
- 高解像度画像の効率的レンダリング
- 変形処理のパフォーマンス最適化

**メモリ管理**
- 大量画像の効率的キャッシュ戦略
- 論理コピーによるメモリ使用量削減

**ブラウザ互換性**
- WebGL fallback対応
- Safari固有の制約対応

## 11. 今後の拡張可能性

### 11.1 機能拡張（リリース後）

#### 11.1.1 プリセット・テンプレート機能
- よく使う画像特性の組み合わせをプリセット保存
- 特定用途（SNS投稿、プレゼン等）向けテンプレート

#### 11.1.2 高度な画像処理
- 基本的な画像フィルター（明度・コントラスト）
- 自動画像配置（AI による最適レイアウト提案）

#### 11.1.3 コラボレーション機能
- プロジェクト共有・共同編集
- 画像素材ライブラリの共有

### 11.2 技術的拡張

#### 11.2.1 パフォーマンス向上
- WebAssembly による画像処理高速化
- Web Worker を活用した非同期処理

#### 11.2.2 プラットフォーム拡張
- PWA対応（オフライン機能）
- Tauri/Electron デスクトップアプリ化
- モバイルアプリ（React Native）

#### 11.2.3 AI統合
- 画像の自動分類・タグ付け
- 最適レイアウト提案
- 画像品質向上（超解像度化）

### 11.3 ビジネス拡張

#### 11.3.1 SaaS化
- クラウド保存・同期
- チーム機能・ワークスペース
- 使用量ベースの課金モデル

#### 11.3.2 API提供
- 画像連結処理のAPI化
- 他サービスとの連携機能

---

*この仕様書は、画像連結に特化したシンプルで強力なツールの実現を目指し、開発の進行に応じて継続的に更新されます。*