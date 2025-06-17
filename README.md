# ※注意
Claude for Desktopで設計を行い、開発者向け引継ぎ資料を作成したというシナリオのサンプル

# 画像連結ソフトウェア開発プロジェクト

## 🎯 プロジェクト概要

**革新的な画像連結ツール**の開発プロジェクトです。従来の単純な左右・上下連結を超越し、**グリッドベースの直感的配置**により、複雑で美しいレイアウトを1枚の画像として出力します。

### 🌟 革新ポイント
- **2フェーズワークフロー**: 準備フェーズ（画像特性定義） → 配置フェーズ（グリッド配置）
- **画像特性システム**: 画像ごとの拡大・縮小ポリシー、トリミング基準点、アライメント設定
- **論理コピー機能**: 1つの画像から複数バリエーション（回転・反転）を効率管理
- **占有セル概念**: 画像が複数セルにまたがる柔軟な配置

## 🚀 クイックスタート

### 必須要件
- Node.js 18+
- 現代的なブラウザ（Chrome 90+, Firefox 88+, Safari 14+）

### 初期セットアップ
```bash
# プロジェクト作成
npm create vite@latest image-concat-app -- --template react-ts
cd image-concat-app

# 推奨パッケージインストール
npm install zustand immer @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install dexie konva react-konva
npm install @headlessui/react lucide-react zod react-hot-toast
npm install browser-image-compression

# 開発用パッケージ
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D autoprefixer postcss tailwindcss

# Tailwind CSS初期化
npx tailwindcss init -p

# 開発開始
npm run dev
```

## 📋 開発ロードマップ

### Phase 1: 基盤構築（Week 1-2）
- [x] 開発環境セットアップ
- [ ] プロジェクト構造作成
- [ ] Repository層骨格実装
- [ ] 基本UI構築

**成功基準**: `npm run dev`でアプリが起動し、基本ページが表示される

### Phase 2: 画像管理（Week 3-4）
- [ ] ファイルアップロード機能
- [ ] 画像プレビュー表示
- [ ] 論理コピー作成・管理
- [ ] 基本的な画像特性設定

**成功基準**: 画像をアップロードし、論理コピーを作成・表示できる

### Phase 3: グリッド配置（Week 5-6）
- [ ] グリッドキャンバス実装
- [ ] ドラッグ&ドロップ配置
- [ ] 基本的な配置検証
- [ ] 1x1占有セル配置

**成功基準**: 画像をグリッドにドラッグ&ドロップして配置できる

### Phase 4: 高度機能（Week 7-10）
- [ ] 占有セル機能（NxM配置）
- [ ] 画像特性システム完成
- [ ] Canvas出力機能
- [ ] 履歴管理（Undo/Redo）

**成功基準**: 複雑な配置と高品質出力が可能

## 📚 必須ドキュメント

### 🔴 必読（開発開始前）
1. **[concept-overview.md](./docs/concept-overview.md)** - プロダクトビジョン・コンセプト
2. **[implementation-guide.md](./docs/implementation-guide.md)** - 実装の具体的道筋
3. **[tech-stack-guide.md](./docs/tech-stack-guide.md)** - 技術選択と使用方法

### 🟡 参考資料（実装中に参照）
4. **[technical-specification.md](./docs/technical-specification.md)** - 完全技術仕様書
5. **[architecture-strategy.md](./docs/architecture-strategy.md)** - アーキテクチャ設計指針
6. **[database-design.md](./docs/database-design.md)** - データベース設計詳細

### 🟢 サポート資料（必要時に参照）
7. **[feasibility-analysis.md](./docs/feasibility-analysis.md)** - 技術的実現可能性分析
8. **[coding-templates.md](./templates/coding-templates.md)** - コードテンプレート集

## 🏗️ 推奨プロジェクト構造

```
src/
├── core/                    # ビジネスロジック（ライブラリ非依存）
│   ├── entities/           # エンティティ定義
│   ├── use-cases/          # ユースケース
│   └── interfaces/         # インターフェース定義
├── infrastructure/         # 外部ライブラリ実装
│   ├── repositories/       # データアクセス（Dexie実装）
│   ├── services/          # 外部サービス（Konva実装）
│   └── adapters/          # アダプター実装
├── application/           # アプリケーション層
│   ├── hooks/             # カスタムフック
│   └── stores/            # 状態管理（Zustand）
├── presentation/          # UI層
│   ├── components/        # UIコンポーネント
│   ├── pages/             # ページコンポーネント
│   └── layouts/           # レイアウトコンポーネント
└── shared/                # 共通要素
    ├── types/             # 型定義
    ├── utils/             # ユーティリティ
    └── constants/         # 定数定義
```

## 🎯 重要な技術的制約

- **画像サイズ制限**: 最大4K（4096px）、ファイルサイズ10MB
- **グリッドサイズ**: 最大10x10
- **対応形式**: JPG, PNG, GIF, WebP
- **実行環境**: ブラウザ完結型（Electron/Tauri不使用）
- **データベース**: Dexie.js（IndexedDB）

## 🤝 コミュニケーション・サポート

### 質問・相談
- **技術的質問**: [連絡先を記載]
- **仕様確認**: [連絡先を記載]
- **進捗報告**: 週次ミーティング（金曜日 30分）

### エスカレーション
- **設計判断が必要**: 即座に相談
- **仕様の解釈**: ドキュメント確認後に相談
- **技術的課題**: 24時間以内に相談

## 🔧 開発Tips

### デバッグ・テスト
```bash
# 開発サーバー起動
npm run dev

# テスト実行
npm run test

# 型チェック
npm run type-check

# ビルド確認
npm run build
```

### 推奨開発環境
- **エディタ**: VS Code + TypeScript拡張
- **ブラウザ**: Chrome DevTools
- **デバッガ**: React Developer Tools

## 📦 最終成果物

### MVP（Minimum Viable Product）
- 基本的な画像アップロード・表示
- シンプルなグリッド配置（1x1）
- PNG出力機能

### 完成版
- 高度な画像特性制御
- 複雑な占有セル配置
- リアルタイムプレビュー
- 完全な履歴管理

---

**開発を開始する前に、必ず `docs/concept-overview.md` を読んでプロダクトビジョンを理解してください。**

質問や不明な点があれば、遠慮なくご相談ください。革新的なツールを一緒に作り上げましょう！
