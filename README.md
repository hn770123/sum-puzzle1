# Sum Puzzle - 合計パズル

縦と横の合計が分かっている数独風のパズルゲームです。

## 遊び方

1. 空白のマスに1～9の数字を入力します
2. 各行と各列の合計が、端に表示されている数字と一致するようにします
3. すべてのマスを正しく埋めるとクリアです

## 機能

- **PWA対応**: スマートフォンにインストール可能
- **自動生成**: ボタン一つで新しいパズルを生成
- **難易度表示**: パズルの難易度を自動判定して表示
- **進捗表示**: パズル生成中の進捗をリアルタイム表示
- **レスポンシブデザイン**: PCでもスマートフォンでも快適にプレイ可能

## 技術スタック

- HTML5
- CSS3
- Vanilla JavaScript
- PWA (Progressive Web App)

## デモ

GitHub Pagesで公開されています:
https://hn770123.github.io/sum-puzzle1/

## ローカルでの実行

1. リポジトリをクローン
```bash
git clone https://github.com/hn770123/sum-puzzle1.git
cd sum-puzzle1
```

2. ローカルサーバーで起動
```bash
# Python 3の場合
python -m http.server 8000

# Node.jsの場合
npx http-server
```

3. ブラウザで `http://localhost:8000` にアクセス

## ライセンス

MIT License
