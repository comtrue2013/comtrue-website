# 部署到 Cloudflare Pages

依序做完大約 40 分鐘，其中等 DNS 生效佔一半。

---

## 步驟 0 — 前提

Cloudflare Pages 的**表單寄信功能（Functions）需要 Git 整合**才會自動編譯
`functions/` 目錄。用 Dashboard 拖拉上傳資料夾只會當成純靜態檔，Function
不會生效。

所以流程一定是：**先推 GitHub → 再讓 Cloudflare 連過去**。

（這步跟 GitHub Pages 共用，不會白做。）

---

## 步驟 1 — 推到 GitHub

`website/` 已經是獨立 repo 且完成第一次 commit。

1. 到 <https://github.com/new> 建一個空 repo，例如 `comtrue-website`
   - 不要勾 "Add a README"
   - Cloudflare 可以讀 private repo，所以這裡**選 Private 也行**
2. 接上 remote 並推送：

```bash
git remote add origin https://github.com/<你的帳號>/comtrue-website.git
git push -u origin main
```

第一次推送時 Git Credential Manager 會開瀏覽器要你登入 GitHub。

---

## 步驟 2 — 建立 Cloudflare Pages 專案

1. 註冊 / 登入 <https://dash.cloudflare.com>
2. 左側 **Workers & Pages** → **Create** → **Pages** 分頁 →
   **Connect to Git**
3. 授權 Cloudflare 存取 GitHub，選剛才那個 repo
4. Build 設定：

   | 欄位 | 值 |
   |---|---|
   | Production branch | `main` |
   | Framework preset | **None** |
   | Build command | **留空** |
   | Build output directory | `/` |

   > 若你把 `website/` 當成子目錄推上去（repo 根目錄不是網站根目錄），
   > 這裡要填 `website`。

5. **Save and Deploy**

約一分鐘後會拿到 `https://<專案名>.pages.dev`。先用這個網址確認頁面正常。

此時表單還不會寄信 —— 環境變數還沒設。

---

## 步驟 3 — 設定 Resend（寄信服務）

1. 到 <https://resend.com> 註冊
2. **Domains** → **Add Domain** → 輸入 `comtrue-inc.com`
3. Resend 會給你幾筆 DNS 記錄（SPF 的 TXT、DKIM 的 TXT/CNAME）。
   把它們加到 `comtrue-inc.com` 現在的 DNS 服務商後台。

   > **這步沒做，信會被判垃圾郵件或直接退回。**
   > 加完等 Resend 後台那筆網域變成 **Verified** 再繼續。

4. **API Keys** → **Create API Key**，權限選 Sending access，
   複製那串 `re_...`（只會顯示一次）

免費方案每月 3,000 封、每天 100 封，這種用量夠。

---

## 步驟 4 — 設定環境變數

Cloudflare Dashboard → 你的 Pages 專案 → **Settings** →
**Environment variables** → Production 加三筆：

| 變數名 | 值 | 類型 |
|---|---|---|
| `RESEND_API_KEY` | 步驟 3 拿到的 `re_...` | **Secret**（要選這個，不然明碼可見） |
| `MAIL_TO` | `Sales@comtrue-inc.com` | Plaintext |
| `MAIL_FROM` | `ComTrue Website <noreply@comtrue-inc.com>` | Plaintext |

> `MAIL_FROM` 的網域必須是步驟 3 驗證過的網域，否則 Resend 會拒收。
> `noreply@` 這個信箱**不需要真的存在**。

改完環境變數要**重新部署一次**才會生效：
Deployments → 最新那筆右邊 **⋯** → **Retry deployment**

---

## 步驟 5 — 開啟表單

編輯 `contact.html`，找到：

```js
const FORM_ENDPOINT = '';
```

改成：

```js
const FORM_ENDPOINT = '/api/contact';
```

commit + push，Cloudflare 會自動重新部署。

然後**實際送一封測試**，確認信有進到 `Sales@comtrue-inc.com`
（順便看一下有沒有掉進垃圾郵件匣）。

---

## 步驟 6 — 掛上 www.comtrue-inc.com

Pages 專案 → **Custom domains** → **Set up a domain** →
輸入 `www.comtrue-inc.com`

接下來看你要不要把 DNS 搬到 Cloudflare：

### 方案 A：不搬 DNS（風險低，建議先這樣）

`www` 是子網域，可以只加一筆 CNAME 就好：

1. 先在上面的 Cloudflare 畫面把 `www.comtrue-inc.com` **加進去**
2. 再到現有 DNS 服務商，加一筆：

   ```
   類型: CNAME
   名稱: www
   值:   <專案名>.pages.dev
   ```

> **順序不能反。** 沒先在 Cloudflare 登記就加 CNAME，會出現 522 錯誤。

憑證由 Cloudflare 自動簽發，幾分鐘到幾小時。
現行網站的自簽憑證警告到這步就解決了。

**限制**：這個方法只能用在 `www.`，裸網域 `comtrue-inc.com`
（不含 www）沒辦法，要改用方案 B。

### 方案 B：把 DNS 整個搬到 Cloudflare

裸網域也要指過去才需要走這條。Cloudflare 會給你兩台 nameserver，
到網域註冊商換掉。

> ⚠️ **搬 DNS 前務必先把現有的 MX 記錄抄下來。**
> 漏掉的話 `Sales@comtrue-inc.com` 和 `Support@comtrue-inc.com`
> 會立刻收不到信。Cloudflare 掃描通常會自動帶過來，但**一定要自己核對一遍**
> 再切 nameserver。同理，步驟 3 加的 SPF/DKIM 也要跟著搬。

---

## 驗收清單

- [ ] `pages.dev` 網址五頁都開得起來，logo 正常
- [ ] Downloads 頁的 PDF / ZIP 點得下來（檔案要先放進 `files/`）
- [ ] 表單送出後，信有進到 `Sales@comtrue-inc.com`
- [ ] 那封信不在垃圾郵件匣
- [ ] 回信時 To 是填表者的信箱（`reply_to` 有生效）
- [ ] `https://www.comtrue-inc.com` 沒有憑證警告
- [ ] 手機開起來版面正常
- [ ] **公司信箱還收得到信**（若走方案 B）

---

## 之後要改網站內容

改檔案 → commit → push，Cloudflare 自動重新部署，約一分鐘。

```bash
git add -A
git commit -m "更新產品頁"
git push
```

免費方案每月 500 次建置，一天改十幾次都用不完。
