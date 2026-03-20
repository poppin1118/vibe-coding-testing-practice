# Code Review 報告

- **審查日期**：2026-03-20
- **審查範圍**：`src/pages/LoginPage.tsx`
- **審查人**：AI Assistant

---

## 摘要

| 嚴重度 | 數量 |
|--------|------|
| 🔴 嚴重（Must Fix） | 1 |
| 🟡 建議（Should Fix） | 4 |
| 🟢 可選（Nice to Have） | 3 |

---

## 靜態分析結果

- **ESLint**：✅ 無錯誤
- **TypeScript (`tsc --noEmit`)**：✅ 無編譯錯誤

---

## 審查明細

### 📄 `src/pages/LoginPage.tsx`

#### 🔴 嚴重

- **[SOLID-S / 關注點分離]** 第 34–58 行：`validateEmail` 和 `validatePassword` 直接在元件內定義，且內部直接呼叫 `setEmailError` / `setPasswordError` 來操作 UI 狀態。驗證邏輯與 UI 副作用耦合，無法獨立測試、也無法跨元件重用。

  **建議做法**：將純驗證邏輯抽離為純函數，元件只負責呼叫和設定錯誤。

  ```typescript
  // utils/validators.ts（純函數，可獨立單元測試）
  export const validateEmail = (email: string): string | null => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email) ? null : '請輸入有效的 Email 格式';
  };

  export const validatePassword = (password: string): string | null => {
      if (password.length < 8) return '密碼必須至少 8 個字元';
      const hasLetter = /[a-zA-Z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      if (!hasLetter || !hasNumber) return '密碼必須包含英文字母和數字';
      return null;
  };
  ```

  ```tsx
  // LoginPage.tsx（元件內只負責呼叫）
  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setApiError('');

      const emailErr = validateEmail(email);
      const passwordErr = validatePassword(password);
      setEmailError(emailErr ?? '');
      setPasswordError(passwordErr ?? '');

      if (emailErr || passwordErr) return;
      // ...
  };
  ```

---

#### 🟡 建議

- **[變數宣告 / Magic Number]** 第 49 行：密碼最小長度 `8` 是 magic number，且 regex pattern 也散落在函數內。

  **建議做法**：抽為具名常數。

  ```typescript
  const MIN_PASSWORD_LENGTH = 8;
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  ```

---

- **[設計模式 / Custom Hook]** 第 8–83 行：`handleSubmit` 內的登入流程（驗證 → 呼叫 API → 錯誤處理 → loading 狀態）全部寫在元件內，元件同時處理 UI 渲染與業務邏輯。

  **建議做法**：抽離為 `useLoginForm` custom hook，使元件只負責渲染。

  ```typescript
  // hooks/useLoginForm.ts
  export const useLoginForm = () => {
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [emailError, setEmailError] = useState('');
      const [passwordError, setPasswordError] = useState('');
      const [apiError, setApiError] = useState('');
      const [isLoading, setIsLoading] = useState(false);

      const { login, isAuthenticated, authExpiredMessage, clearAuthExpiredMessage } = useAuth();
      const navigate = useNavigate();

      // ... useEffect、handleSubmit 等邏輯搬進來

      return {
          email, setEmail,
          password, setPassword,
          emailError, passwordError, apiError,
          isLoading,
          handleSubmit,
      };
  };
  ```

  LoginPage 元件將變為純 UI 元件，大幅提升可測試性。

---

- **[SOLID-D / 依賴反轉]** 第 77 行：`error as AxiosError<{ message: string }>` — 元件直接依賴 `AxiosError` 型別，意味著 UI 層（LoginPage）知道底層 HTTP 實作細節。

  **建議做法**：錯誤處理應在 API layer 或 AuthContext 層統一轉換為與 HTTP 無關的應用錯誤型別。

  ```typescript
  // api/authApi.ts 或 context/AuthContext.tsx
  export class AuthError extends Error {
      constructor(message: string) {
          super(message);
          this.name = 'AuthError';
      }
  }

  // login 函數內 catch AxiosError，拋出 AuthError
  const login = async (email: string, password: string): Promise<void> => {
      try {
          const response = await authApi.login(email, password);
          // ...
      } catch (error) {
          const axiosError = error as AxiosError<{ message: string }>;
          throw new AuthError(axiosError.response?.data?.message || '登入失敗，請稍後再試');
      }
  };
  ```

  這樣 LoginPage 就不需要 `import { AxiosError } from 'axios'`。

---

- **[效能]** 第 19–25 行 & 第 75 行：登入成功時 `navigate('/dashboard')` 被觸發了**兩次** — 一次在 `handleSubmit` 第 75 行，一次在 `useEffect` 監聽 `isAuthenticated` 變化時。雖然 `{ replace: true }` 讓 UX 無感，但這是不必要的雙重導航。

  **建議做法**：二選一。建議移除 `handleSubmit` 裡的 `navigate`，統一由 `useEffect` 監聽 `isAuthenticated` 來導航，職責更單一。

  ```diff
  try {
      await login(email, password);
  -   navigate('/dashboard', { replace: true });
  } catch (error) {
  ```

---

#### 🟢 可選

- **[可讀性]** 第 1 行：`import React` — React 17+ 的 JSX Transform 不需要顯式 import React（除非用到 `React.FC` 或 `React.FormEvent`）。此處因為用了 `React.FC` 和 `React.FormEvent` 所以不算錯，但可以改用具名 import 讓意圖更清晰。

  ```diff
  -import React, { useState, useEffect } from 'react';
  +import { useState, useEffect, type FC, type FormEvent } from 'react';
  ```

  ```diff
  -export const LoginPage: React.FC = () => {
  +export const LoginPage: FC = () => {
  ```

---

- **[可讀性]** 第 6–7 行：多餘空行。連續兩個空行不影響功能，但不符一般 code style（通常最多一個空行）。

---

- **[可讀性]** 第 144 行：`!import.meta.env.VITE_API_URL` 判斷是否顯示測試帳號提示。這個條件語意不夠直覺。

  **建議做法**：抽為具名變數。

  ```typescript
  const isMockMode = !import.meta.env.VITE_API_URL;
  ```

---

## 總結與建議

### 整體評價

LoginPage 程式碼品質不錯，ESLint 與 TypeScript 皆無錯誤，元件結構清晰，表單驗證邏輯完整。主要問題集中在 **關注點分離** — 驗證邏輯、業務流程、UI 渲染全混在同一個元件中。

### 優先處理順序

1. 🔴 **抽離驗證邏輯為純函數** — 這是最有價值的改動，直接提升可測試性和可重用性
2. 🟡 **移除重複的 `navigate` 呼叫** — 快速修復，消除潛在的 race condition
3. 🟡 **將 AxiosError 依賴移出 UI 層** — 改善架構分層，需連動修改 AuthContext
4. 🟡 **抽離 `useLoginForm` custom hook** — 較大重構，建議搭配第 1 點一起做
5. 🟡 **Magic number 抽常數** — 簡單改動，隨時可做
6. 🟢 **可讀性微調** — 低優先，有空再做
