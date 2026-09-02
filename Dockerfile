# ------------------------------------------------------------------
# Cloud Run 用の Dockerfile（マルチステージビルド）
# ------------------------------------------------------------------
# 1. deps  : 依存パッケージのインストールだけを行う（レイヤーキャッシュが効く）
# 2. builder: Next.js のビルド（standalone 出力を生成）
# 3. runner : 実行に必要なファイルだけを含む最終イメージ
# ------------------------------------------------------------------

# ---- 1. 依存インストール ----
FROM node:22-alpine AS deps
WORKDIR /app

# package.json と lock ファイルだけ先にコピーすることで、
# ソース変更のたびに npm ci が再実行されるのを防ぐ（Docker のレイヤーキャッシュ活用）
COPY package.json package-lock.json ./
RUN npm ci


# ---- 2. ビルド ----
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

# ソース一式をコピーする。ここには .env.local も含まれる。
#
# NEXT_PUBLIC_ 系の値は「ビルド時」にクライアントバンドルへ埋め込まれる性質があり、
# 実行時に環境変数として渡しても反映されない。そのため以前は docker build の
# --build-arg で1つずつ渡していたが、ローカルで使っている .env.local を
# そのままビルドコンテキストに含めて next build に読ませる方式にした。
# （next build は .env.local を自動で読み込む）
#
# .env.local が置かれるのはこの builder ステージだけで、最終イメージ（runner）へは
# .next の出力しかコピーしないため、公開されるイメージにこのファイルは残らない。
COPY . .

# 匿名の利用統計送信を無効化
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build


# ---- 3. 実行 ----
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# root 以外のユーザーで動かす（コンテナのセキュリティ上の定石）
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# public/ と .next/static/ は standalone 出力に含まれないため個別にコピーする
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# Cloud Run はコンテナに PORT 環境変数を渡す（既定 8080）。
# standalone の server.js は PORT / HOSTNAME を見て待ち受ける。
ENV PORT=8080
ENV HOSTNAME=0.0.0.0
EXPOSE 8080

CMD ["node", "server.js"]
