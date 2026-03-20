> 狀態：初始為 [ ]、完成為 [x]
> 注意：狀態只能在測試通過後由流程更新。

---

## [x] 【前端元素】應正確渲染登入頁面標題、表單欄位與按鈕
**範例輸入**：無（初始渲染）
**期待輸出**：頁面包含標題「歡迎回來」、Email 輸入框、密碼輸入框、「登入」按鈕

---

## [x] 【前端元素】未設定 VITE_API_URL 時應顯示測試帳號提示
**範例輸入**：`import.meta.env.VITE_API_URL` 為 falsy
**期待輸出**：頁面顯示測試帳號提示文字

---

## [x] 【function 邏輯】Email 格式不正確時應顯示驗證錯誤訊息
**範例輸入**：Email = `"invalid-email"`、密碼 = `"Password1"`，提交表單
**期待輸出**：顯示「請輸入有效的 Email 格式」

---

## [x] 【function 邏輯】密碼少於 8 個字元時應顯示驗證錯誤訊息
**範例輸入**：Email = `"test@example.com"`、密碼 = `"Pass1"`，提交表單
**期待輸出**：顯示「密碼必須至少 8 個字元」

---

## [x] 【function 邏輯】密碼未包含英文字母和數字時應顯示驗證錯誤訊息
**範例輸入**：Email = `"test@example.com"`、密碼 = `"abcdefgh"`，提交表單
**期待輸出**：顯示「密碼必須包含英文字母和數字」

---

## [x] 【function 邏輯】Email 和密碼驗證皆失敗時應同時顯示兩個錯誤訊息
**範例輸入**：Email = `"bad"`、密碼 = `"123"`，提交表單
**期待輸出**：同時顯示 Email 錯誤和密碼錯誤

---

## [x] 【function 邏輯】驗證失敗時不應呼叫 login API
**範例輸入**：Email = `"invalid"`、密碼 = `"short"`，提交表單
**期待輸出**：login 函數未被呼叫

---

## [x] 【Mock API】登入成功時應導向 /dashboard
**範例輸入**：Email = `"test@example.com"`、密碼 = `"Password1"`，提交表單，login 成功
**期待輸出**：頁面導向至 `/dashboard`

---

## [x] 【Mock API】登入過程中按鈕應顯示 loading 狀態且欄位被禁用
**範例輸入**：提交表單後，login 尚未完成（pending 狀態）
**期待輸出**：按鈕顯示「登入中...」、Email 與密碼欄位被 disabled

---

## [x] 【Mock API】登入失敗時應顯示 API 回傳的錯誤訊息
**範例輸入**：提交表單，login 拋出 AxiosError，response.data.message = `"密碼錯誤"`
**期待輸出**：頁面顯示 error banner，內容為「密碼錯誤」

---

## [x] 【Mock API】登入失敗且無 message 時應顯示預設錯誤訊息
**範例輸入**：提交表單，login 拋出 AxiosError，無 response.data.message
**期待輸出**：頁面顯示「登入失敗，請稍後再試」

---

## [x] 【驗證權限】已登入狀態下應自動導向 /dashboard
**範例輸入**：`isAuthenticated` 為 true
**期待輸出**：自動導向至 `/dashboard`

---

## [x] 【驗證權限】收到 authExpiredMessage 時應顯示過期訊息並清除
**範例輸入**：`authExpiredMessage` = `"登入已過期，請重新登入"`
**期待輸出**：頁面顯示 error banner 內容為該訊息，且 `clearAuthExpiredMessage` 被呼叫
