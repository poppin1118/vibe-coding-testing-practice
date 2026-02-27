> 狀態：初始為 [ ]、完成為 [x]
> 注意：狀態只能在測試通過後由流程更新。
> 測試類型：前端元素、function 邏輯、Mock API、驗證權限...

---

## [x] 【前端元素】渲染 Dashboard 一般用戶畫面
**範例輸入**：Context user 角色為 'user'、名稱為 'TestUser'
**期待輸出**：畫面標題顯示「儀表板」，歡迎區塊顯示「Welcome, TestUser 👋」與「一般用戶」徽章，且導覽列沒有「管理後台」連結。

---

## [x] 【前端元素】渲染Dashboard 管理員畫面
**範例輸入**：Context user 角色為 'admin'
**期待輸出**：歡迎區塊顯示「管理員」徽章，且導覽列出現「🛠️ 管理後台」連結。

---

## [x] 【function 邏輯】點擊登出按鈕
**範例輸入**：點擊導覽列上的「登出」按鈕
**期待輸出**：觸發 Context 的 logout 方法，透過 useNavigate 將畫面導向至 `/login` 並傳遞 replace: true 及 state: null。

---

## [x] 【Mock API】顯示商品列表載入中狀態
**範例輸入**：進入 DashboardPage，API 呼叫尚未回傳
**期待輸出**：畫面商品區塊顯示「載入商品中...」及 spinner。

---

## [x] 【Mock API】成功載入並渲染商品列表
**範例輸入**：mock productApi.getProducts 回傳包含多筆 Product 的陣列
**期待輸出**：畫面不再顯示載入中，正確渲染每個商品卡片，包含商品名稱、描述及價格（含千分位逗號）。

---

## [x] 【Mock API】商品列表載入失敗顯示錯誤訊息
**範例輸入**：mock productApi.getProducts 拋出錯誤（例如包含 message '伺服器異常'）
**期待輸出**：畫面不顯示載入中，顯示包含 ⚠️ icon 的錯誤區塊，內容文字為 API 提供的錯誤訊息。
