# ComTrue Inc. — 公司網站

純靜態 HTML/CSS，**沒有建置步驟**。改完檔案存檔、推上 Git 就是新版網站。

```
index.html          首頁
about.html          About Comtrue
products.html       Products（CT7601 / CT7602 / CT7302 / CT5302）
downloads.html      Downloads（datasheet、application note、driver）
contact.html        Contact（含表單、台灣總部、大陸代理）
assets/style.css    全站樣式（改 :root 的變數就能換色）
assets/logo.png     公司 logo（沿用原網站檔案）
files/              ← 要自己建：所有可下載的 PDF / ZIP
functions/api/contact.js   Cloudflare Pages Function，表單寄信
```

## 本機預覽

用瀏覽器直接開 `index.html` 就能看版面（表單送出會失敗，那要 Function 才會動）。

要連表單一起測，安裝 Node.js 後：

```bash
npx wrangler pages dev .
```

## 待辦

1. **下載檔案** — 建 `files/ct7601/`、`files/ct7602/`、`files/ct7302/`，
   把原網站的 PDF / ZIP 放進去。檔名要跟 `downloads.html` 裡的 `href` 一致，
   或是把 `href` 改成你實際的檔名。CT7602 與 CT7302/5302 的清單目前只有
   佔位一筆，請依實際檔案補齊（搜尋 `TODO`）。
2. **產品規格** — `products.html` 的 selection table 目前只有原網站那三行
   說明。要加封裝、通道數、電壓等欄位就直接加 `<th>` / `<td>`。
3. **下載是否要公開** — 靜態站的檔案是完全公開的，任何人拿到網址就能下載。
   若 datasheet 需要登記才給，要另外做（例如表單送出後才回信附連結）。

## 部署到 Cloudflare Pages

1. 把這個資料夾推到 GitHub / GitLab
2. Cloudflare Dashboard → Workers & Pages → Create → Pages → 連結 repo
3. Build 設定：
   - Framework preset：**None**
   - Build command：**留空**
   - Build output directory：**/**（或 `website`，看你 repo 根目錄放哪）
4. Settings → Environment variables，新增：

   | 變數 | 值 | 類型 |
   |---|---|---|
   | `RESEND_API_KEY` | Resend 後台產生的 key | Secret |
   | `MAIL_TO` | `Sales@comtrue-inc.com` | Plaintext |
   | `MAIL_FROM` | `ComTrue Website <noreply@comtrue-inc.com>` | Plaintext |

5. Custom domains → 加入 `www.comtrue-inc.com`，照指示改 DNS。
   憑證由 Cloudflare 自動簽發（現行網站的自簽憑證警告會一併解決）。

## 寄信設定（Resend）

1. resend.com 註冊，Domains 加入 `comtrue-inc.com`
2. 把它給的 SPF / DKIM TXT 記錄加到 DNS（**這步沒做信會進垃圾桶**）
3. API Keys 產生一把，填進上面的 `RESEND_API_KEY`

免費方案每月 3000 封，這種用量完全夠。
