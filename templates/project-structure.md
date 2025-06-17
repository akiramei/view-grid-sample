# 推奨プロジェクト構造

## 🎯 アーキテクチャ概要

このプロジェクトは**Clean Architecture**に基づいた構造を採用しています。外部ライブラリへの依存を適切に管理し、テスタビリティと保守性を最大化します。

```
src/
├── core/                    # ビジネスロジック層（外部依存なし）
├── infrastructure/         # 外部サービス・ライブラリ実装層
├── application/           # アプリケーション層（状態管理・フック）
├── presentation/          # プレゼンテーション層（UI）
└── shared/                # 共通コード（型定義・ユーティリティ）
```

## 📁 完全なディレクトリ構造

### プロジェクトルート
```
image-concat-app/
├── public/                 # 静的ファイル
│   ├── vite.svg
│   └── favicon.ico
├── src/                    # ソースコード
├── docs/                   # プロジェクト文書（オプション）
├── .env                    # 環境変数
├── .env.local              # ローカル環境変数
├── .gitignore              # Git無視設定
├── index.html              # メインHTMLファイル
├── package.json            # パッケージ依存関係
├── tailwind.config.js      # Tailwind CSS設定
├── tsconfig.json           # TypeScript設定
├── tsconfig.node.json      # Node.js用TypeScript設定
├── vite.config.ts          # Vite設定
├── vitest.config.ts        # テスト設定
└── README.md               # プロジェクト説明
```

### src/ ディレクトリ詳細

```
src/
├── core/                           # 🎯 ビジネスロジック層
│   ├── entities/                   # エンティティ定義
│   │   ├── index.ts
│   │   ├── image-asset.ts
│   │   ├── image-copy.ts
│   │   ├── grid-canvas.ts
│   │   └── grid-placement.ts
│   ├── use-cases/                  # ユースケース（ビジネスルール）
│   │   ├── index.ts
│   │   ├── image-management/
│   │   │   ├── upload-image.ts
│   │   │   ├── create-image-copy.ts
│   │   │   └── manage-image-characteristics.ts
│   │   ├── grid-operations/
│   │   │   ├── create-grid.ts
│   │   │   ├── place-image.ts
│   │   │   └── validate-placement.ts
│   │   └── export/
│   │       ├── render-canvas.ts
│   │       └── export-image.ts
│   └── interfaces/                 # インターフェース定義
│       ├── repositories.ts
│       ├── services.ts
│       └── use-cases.ts
├── infrastructure/                 # 🔧 外部依存実装層
│   ├── repositories/               # データアクセス実装
│   │   ├── index.ts
│   │   ├── database.ts             # Dexie.js設定
│   │   ├── dexie-image-asset-repository.ts
│   │   ├── dexie-image-copy-repository.ts
│   │   ├── dexie-grid-canvas-repository.ts
│   │   └── dexie-grid-placement-repository.ts
│   ├── services/                   # 外部サービス実装
│   │   ├── index.ts
│   │   ├── file-upload-service.ts  # ファイルアップロード
│   │   ├── konva-image-processing-service.ts # 画像処理
│   │   ├── canvas-rendering-service.ts # Canvas描画
│   │   └── export-service.ts       # 画像出力
│   └── adapters/                   # 外部API アダプター
│       ├── index.ts
│       ├── browser-file-adapter.ts
│       └── storage-adapter.ts
├── application/                    # 🎮 アプリケーション層
│   ├── hooks/                      # カスタムフック
│   │   ├── index.ts
│   │   ├── use-image-assets.ts
│   │   ├── use-image-copies.ts
│   │   ├── use-grid-canvas.ts
│   │   ├── use-grid-placement.ts
│   │   ├── use-file-upload.ts
│   │   └── use-export.ts
│   ├── stores/                     # 状態管理（Zustand）
│   │   ├── index.ts
│   │   ├── app-store.ts            # メインストア
│   │   ├── ui-store.ts             # UI状態
│   │   └── history-store.ts        # 履歴管理
│   └── services/                   # アプリケーションサービス
│       ├── index.ts
│       ├── validation-service.ts
│       └── notification-service.ts
├── presentation/                   # 🎨 プレゼンテーション層
│   ├── components/                 # UIコンポーネント
│   │   ├── index.ts
│   │   ├── common/                 # 共通コンポーネント
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Loading.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── image-management/       # 画像管理UI
│   │   │   ├── ImageUpload.tsx
│   │   │   ├── ImageAssetList.tsx
│   │   │   ├── ImageCopyList.tsx
│   │   │   └── ImageCharacteristicsForm.tsx
│   │   ├── grid-editor/           # グリッド編集UI
│   │   │   ├── GridCanvas.tsx
│   │   │   ├── GridCell.tsx
│   │   │   ├── GridPlacementPreview.tsx
│   │   │   └── GridToolbar.tsx
│   │   └── export/                # 出力UI
│   │       ├── ExportPreview.tsx
│   │       ├── ExportSettings.tsx
│   │       └── ExportProgress.tsx
│   ├── pages/                     # ページコンポーネント
│   │   ├── index.ts
│   │   ├── HomePage.tsx
│   │   ├── EditorPage.tsx
│   │   └── PreviewPage.tsx
│   ├── layouts/                   # レイアウトコンポーネント
│   │   ├── index.ts
│   │   ├── AppLayout.tsx
│   │   ├── EditorLayout.tsx
│   │   └── HeaderNav.tsx
│   └── styles/                    # スタイル定義
│       ├── index.css
│       ├── globals.css
│       └── components.css
├── shared/                        # 🔄 共通コード
│   ├── types/                     # 型定義
│   │   ├── index.ts
│   │   ├── entities.ts
│   │   ├── api.ts
│   │   └── ui.ts
│   ├── utils/                     # ユーティリティ関数
│   │   ├── index.ts
│   │   ├── validation.ts
│   │   ├── formatting.ts
│   │   ├── file-utils.ts
│   │   ├── canvas-utils.ts
│   │   └── type-guards.ts
│   ├── constants/                 # 定数定義
│   │   ├── index.ts
│   │   ├── app-config.ts
│   │   ├── image-constraints.ts
│   │   └── ui-constants.ts
│   └── errors/                    # エラー定義
│       ├── index.ts
│       ├── app-errors.ts
│       └── validation-errors.ts
├── test/                          # テスト設定・ユーティリティ
│   ├── setup.ts                   # Vitest設定
│   ├── utils/                     # テストユーティリティ
│   │   ├── test-utils.tsx         # React Testing Library設定
│   │   ├── mock-data.ts           # モックデータ
│   │   └── db-test-utils.ts       # DB テストユーティリティ
│   └── fixtures/                  # テスト用固定データ
│       ├── sample-images.ts
│       └── sample-grids.ts
├── App.tsx                        # メインアプリコンポーネント
├── main.tsx                       # エントリーポイント
└── vite-env.d.ts                  # Vite型定義
```

## 🎯 層別の責務と依存関係

### 📊 依存関係図

```
presentation  →  application  →  infrastructure
     ↓              ↓                ↓
   shared    ←    core      ←    shared
```

### 各層の責務

#### 🎯 core/ - ビジネスロジック層
**責務**: ドメインロジック・ビジネスルール
**依存**: shared のみ（外部ライブラリ依存なし）
**例**:
```typescript
// core/use-cases/place-image.ts
export class PlaceImageUseCase {
  execute(imageId: string, gridX: number, gridY: number): Result<void, Error> {
    // ビジネスルール検証
    // 外部依存なしの純粋ロジック
  }
}
```

#### 🔧 infrastructure/ - 外部依存実装層
**責務**: 外部ライブラリ・サービスとの統合
**依存**: core interfaces を実装
**例**:
```typescript
// infrastructure/repositories/dexie-image-asset-repository.ts
export class DexieImageAssetRepository implements ImageAssetRepository {
  // Dexie.js具体実装
}
```

#### 🎮 application/ - アプリケーション層
**責務**: 状態管理・UI ロジック調整
**依存**: core + infrastructure
**例**:
```typescript
// application/hooks/use-image-assets.ts
export function useImageAssets() {
  // 状態管理 + use case 呼び出し
}
```

#### 🎨 presentation/ - プレゼンテーション層
**責務**: UI コンポーネント・ユーザー操作
**依存**: application hooks
**例**:
```typescript
// presentation/components/ImageUpload.tsx
export function ImageUpload() {
  const { uploadImage } = useImageAssets();
  // UI ロジックのみ
}
```

#### 🔄 shared/ - 共通コード
**責務**: 全層で使用される共通要素
**依存**: なし（他層から参照される）

## 🗂️ ファイル命名規則

### ディレクトリ命名
- **kebab-case**: `image-management/`, `grid-editor/`
- **複数形**: 複数のファイルを含む場合 `components/`, `hooks/`
- **単数形**: 単一の責務を持つ場合 `core/`, `shared/`

### ファイル命名
- **コンポーネント**: `PascalCase.tsx` (例: `ImageUpload.tsx`)
- **フック**: `camelCase.ts` (例: `useImageAssets.ts`)
- **ユーティリティ**: `kebab-case.ts` (例: `file-utils.ts`)
- **型定義**: `kebab-case.ts` (例: `image-types.ts`)

### 定数・列挙型
```typescript
// shared/constants/app-config.ts
export const APP_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_GRID_SIZE: 10,
} as const;

// shared/constants/image-constraints.ts
export const IMAGE_CONSTRAINTS = {
  MAX_RESOLUTION: 4096,
  SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
} as const;
```

## 📦 インポート規則

### パスエイリアス設定
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/core/*": ["./src/core/*"],
      "@/infrastructure/*": ["./src/infrastructure/*"],
      "@/application/*": ["./src/application/*"],
      "@/presentation/*": ["./src/presentation/*"],
      "@/shared/*": ["./src/shared/*"]
    }
  }
}
```

### インポート順序
```typescript
// 1. 外部ライブラリ
import React from 'react';
import { create } from 'zustand';

// 2. 内部モジュール（近い層から遠い層へ）
import { useImageAssets } from '@/application/hooks/use-image-assets';
import { ImageAssetRepository } from '@/core/interfaces/repositories';
import { ImageAsset } from '@/shared/types';

// 3. 相対インポート
import './ImageUpload.css';
```

## 🧪 テスト構造

### テストファイル配置
```
src/
├── core/
│   ├── use-cases/
│   │   ├── place-image.ts
│   │   └── __tests__/
│   │       └── place-image.test.ts
├── infrastructure/
│   ├── repositories/
│   │   ├── dexie-image-asset-repository.ts
│   │   └── __tests__/
│   │       └── dexie-image-asset-repository.test.ts
└── presentation/
    ├── components/
    │   ├── ImageUpload.tsx
    │   └── __tests__/
    │       └── ImageUpload.test.tsx
```

### テスト命名規則
- **単体テスト**: `[module-name].test.ts`
- **統合テスト**: `[feature-name].integration.test.ts`
- **E2Eテスト**: `[user-flow].e2e.test.ts`

## 🔄 作成手順

### 1. ディレクトリ作成
```bash
# メインディレクトリ
mkdir -p src/{core,infrastructure,application,presentation,shared,test}

# core サブディレクトリ
mkdir -p src/core/{entities,use-cases,interfaces}

# infrastructure サブディレクトリ  
mkdir -p src/infrastructure/{repositories,services,adapters}

# application サブディレクトリ
mkdir -p src/application/{hooks,stores,services}

# presentation サブディレクトリ
mkdir -p src/presentation/{components,pages,layouts,styles}

# shared サブディレクトリ
mkdir -p src/shared/{types,utils,constants,errors}

# test サブディレクトリ
mkdir -p src/test/{utils,fixtures}
```

### 2. 基本ファイル作成
```bash
# index.ts ファイル作成
touch src/{core,infrastructure,application,presentation,shared}/index.ts

# 各サブディレクトリの index.ts
find src -type d -name "*" -exec touch {}/index.ts \;
```

### 3. 段階的実装順序
1. **shared/**: 型定義・ユーティリティ
2. **core/**: エンティティ・インターフェース  
3. **infrastructure/**: リポジトリ実装
4. **application/**: フック・ストア
5. **presentation/**: UI コンポーネント

この構造により、**保守性が高く拡張しやすい**コードベースを構築できます。