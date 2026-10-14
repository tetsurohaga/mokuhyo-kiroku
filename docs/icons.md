# アプリアイコンの変更

マスターデザインは `assets/app-icon.svg` の1枚だけ。ここから各サイズの PNG を生成している。

| 生成先 | 用途 |
|---|---|
| `src/app/icon.png` | ブラウザのタブ（favicon） |
| `src/app/apple-icon.png` | iOS の「ホーム画面に追加」（180x180） |
| `public/icons/` | Android の「ホーム画面に追加」（`src/app/manifest.ts` から参照） |

## 手順

`assets/app-icon.svg` を編集してから、次を実行して PNG を再生成する（生成物はコミットする）。

```bash
node scripts/generate-icons.mjs
```

## 注意: iOS のキャッシュ

iOS はホーム画面のアイコンを強くキャッシュするため、デプロイ後も既存のアイコンは
自動では変わらない。ホーム画面から一度削除し、Safari で開き直してから追加し直す必要がある。
