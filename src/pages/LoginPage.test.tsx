import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { useAuth } from '../context/AuthContext';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock useAuth
vi.mock('../context/AuthContext', () => ({
    useAuth: vi.fn(),
}));

const mockLogin = vi.fn();
const mockClearAuthExpiredMessage = vi.fn();

const defaultAuthState = {
    user: null,
    token: null,
    isLoading: false,
    isAuthenticated: false,
    authExpiredMessage: null as string | null,
    login: mockLogin,
    logout: vi.fn(),
    checkAuth: vi.fn(),
    clearAuthExpiredMessage: mockClearAuthExpiredMessage,
};

const renderLoginPage = (authOverrides: Partial<typeof defaultAuthState> = {}) => {
    vi.mocked(useAuth).mockReturnValue({
        ...defaultAuthState,
        ...authOverrides,
    });

    return render(
        <MemoryRouter initialEntries={['/login']}>
            <LoginPage />
        </MemoryRouter>,
    );
};

describe('LoginPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('前端元素', () => {
        it('應正確渲染登入頁面標題、表單欄位與按鈕', () => {
            renderLoginPage();

            expect(screen.getByText('歡迎回來')).toBeInTheDocument();
            expect(screen.getByLabelText('電子郵件')).toBeInTheDocument();
            expect(screen.getByLabelText('密碼')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: '登入' })).toBeInTheDocument();
        });

        it('未設定 VITE_API_URL 時應顯示測試帳號提示', () => {
            renderLoginPage();

            expect(screen.getByText(/測試帳號/)).toBeInTheDocument();
        });
    });

    describe('function 邏輯', () => {
        it('Email 格式不正確時應顯示驗證錯誤訊息', async () => {
            renderLoginPage();
            const user = userEvent.setup();

            await user.type(screen.getByLabelText('電子郵件'), 'invalid-email');
            await user.type(screen.getByLabelText('密碼'), 'Password1');
            await user.click(screen.getByRole('button', { name: '登入' }));

            expect(screen.getByText('請輸入有效的 Email 格式')).toBeInTheDocument();
        });

        it('密碼少於 8 個字元時應顯示驗證錯誤訊息', async () => {
            renderLoginPage();
            const user = userEvent.setup();

            await user.type(screen.getByLabelText('電子郵件'), 'test@example.com');
            await user.type(screen.getByLabelText('密碼'), 'Pass1');
            await user.click(screen.getByRole('button', { name: '登入' }));

            expect(screen.getByText('密碼必須至少 8 個字元')).toBeInTheDocument();
        });

        it('密碼未包含英文字母和數字時應顯示驗證錯誤訊息', async () => {
            renderLoginPage();
            const user = userEvent.setup();

            await user.type(screen.getByLabelText('電子郵件'), 'test@example.com');
            await user.type(screen.getByLabelText('密碼'), 'abcdefgh');
            await user.click(screen.getByRole('button', { name: '登入' }));

            expect(screen.getByText('密碼必須包含英文字母和數字')).toBeInTheDocument();
        });

        it('Email 和密碼驗證皆失敗時應同時顯示兩個錯誤訊息', async () => {
            renderLoginPage();
            const user = userEvent.setup();

            await user.type(screen.getByLabelText('電子郵件'), 'bad');
            await user.type(screen.getByLabelText('密碼'), '123');
            await user.click(screen.getByRole('button', { name: '登入' }));

            expect(screen.getByText('請輸入有效的 Email 格式')).toBeInTheDocument();
            expect(screen.getByText('密碼必須至少 8 個字元')).toBeInTheDocument();
        });

        it('驗證失敗時不應呼叫 login API', async () => {
            renderLoginPage();
            const user = userEvent.setup();

            await user.type(screen.getByLabelText('電子郵件'), 'invalid');
            await user.type(screen.getByLabelText('密碼'), 'short');
            await user.click(screen.getByRole('button', { name: '登入' }));

            expect(mockLogin).not.toHaveBeenCalled();
        });
    });

    describe('Mock API', () => {
        it('登入成功時應導向 /dashboard', async () => {
            mockLogin.mockResolvedValue(undefined);
            renderLoginPage();
            const user = userEvent.setup();

            await user.type(screen.getByLabelText('電子郵件'), 'test@example.com');
            await user.type(screen.getByLabelText('密碼'), 'Password1');
            await user.click(screen.getByRole('button', { name: '登入' }));

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
            });
        });

        it('登入過程中按鈕應顯示 loading 狀態且欄位被禁用', async () => {
            let resolveLogin!: () => void;
            mockLogin.mockImplementation(
                () =>
                    new Promise<void>((resolve) => {
                        resolveLogin = resolve;
                    }),
            );
            renderLoginPage();
            const user = userEvent.setup();

            await user.type(screen.getByLabelText('電子郵件'), 'test@example.com');
            await user.type(screen.getByLabelText('密碼'), 'Password1');
            await user.click(screen.getByRole('button', { name: '登入' }));

            await waitFor(() => {
                expect(screen.getByText('登入中...')).toBeInTheDocument();
            });
            expect(screen.getByLabelText('電子郵件')).toBeDisabled();
            expect(screen.getByLabelText('密碼')).toBeDisabled();

            // Cleanup: resolve pending promise to avoid act warnings
            await act(async () => {
                resolveLogin();
            });
        });

        it('登入失敗時應顯示 API 回傳的錯誤訊息', async () => {
            mockLogin.mockRejectedValue({
                response: { data: { message: '密碼錯誤' } },
            });
            renderLoginPage();
            const user = userEvent.setup();

            await user.type(screen.getByLabelText('電子郵件'), 'test@example.com');
            await user.type(screen.getByLabelText('密碼'), 'Password1');
            await user.click(screen.getByRole('button', { name: '登入' }));

            await waitFor(() => {
                expect(screen.getByText('密碼錯誤')).toBeInTheDocument();
            });
        });

        it('登入失敗且無 message 時應顯示預設錯誤訊息', async () => {
            mockLogin.mockRejectedValue({
                response: { data: {} },
            });
            renderLoginPage();
            const user = userEvent.setup();

            await user.type(screen.getByLabelText('電子郵件'), 'test@example.com');
            await user.type(screen.getByLabelText('密碼'), 'Password1');
            await user.click(screen.getByRole('button', { name: '登入' }));

            await waitFor(() => {
                expect(screen.getByText('登入失敗，請稍後再試')).toBeInTheDocument();
            });
        });
    });

    describe('驗證權限', () => {
        it('已登入狀態下應自動導向 /dashboard', () => {
            renderLoginPage({ isAuthenticated: true });

            expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
        });

        it('收到 authExpiredMessage 時應顯示過期訊息並清除', () => {
            renderLoginPage({ authExpiredMessage: '登入已過期，請重新登入' });

            expect(screen.getByText('登入已過期，請重新登入')).toBeInTheDocument();
            expect(mockClearAuthExpiredMessage).toHaveBeenCalled();
        });
    });
});
