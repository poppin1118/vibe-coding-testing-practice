> 狀態：初始為 [ ]、完成為 [x]
> 注意：狀態只能在測試通過後由流程更新。
> 測試類型：前端元素、function 邏輯、Mock API、驗證權限...

---

## [x] 【前端元素】渲染管理後台頁面
**範例輸入**：Context user 角色為 'admin'
**期待輸出**：畫面正常渲染，包含標題「管理後台」，badge 顯示「管理員」，並有「管理員專屬頁面」相關說明。

---

## [x] 【前端元素】渲染一般用戶頁面
**範例輸入**：Context user 角色非 'admin'（如 'user'）
**期待輸出**：畫面 badge 顯示「一般用戶」。

---

## [x] 【function 邏輯】點擊登出按鈕
**範例輸入**：點擊「登出」按鈕
**期待輸出**：觸發 Context 的 logout 方法，並且透過 useNavigate 導向至 `/login` 且 replace: true、state: null。
