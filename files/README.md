# 可下載檔案

把 PDF / ZIP 放進對應的型號資料夾，檔名要跟 `downloads.html` 裡的 `href` 一致
（或反過來改 `href`）。

```
files/ct7601/  CT7601 的 datasheet、application note、schematic、driver
files/ct7602/  CT7602 的檔案
files/ct7302/  CT7302 / CT5302 的檔案
```

## 注意

- **單一檔案不要超過 100MB**（Git 的硬限制）
- 檔名不要有空白或中文，用 `-` 連接，例如 `CT7601-brief-datasheet.pdf`
- 放進來的檔案**任何人都能下載**，沒有權限控管。
  機密文件不要放，要登記才給的請改用表單索取。
- 檔案一旦 commit 就進入 Git 歷史，之後刪掉也還在。
  常改版的大檔建議每次覆蓋同一個檔名，不要一直加新版本。
