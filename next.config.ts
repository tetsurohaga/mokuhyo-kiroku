import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * "standalone" を指定すると、ビルド時に .next/standalone 配下へ
   * 実行に必要な最小限のファイル（server.js と依存モジュール）が出力される。
   * これを Docker イメージにコピーすることで、node_modules 全体を含めずに
   * 軽量なコンテナを作れる。Cloud Run へのデプロイに適した構成。
   */
  output: "standalone",
};

export default nextConfig;
