import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginPage } from './LoginPage';
import * as AuthContextModule from '../context/AuthContext';

// mock useNavigate
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

describe('LoginPage', () => {
    const mockLogin = vi.fn();
    const mockNavigate = vi.fn();
    const mockClearAuthExpiredMessage = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useNavigate).mockReturnValue(mockNavigate);
        vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
            login: mockLogin,
            isAuthenticated: false,
            authExpiredMessage: null,
            clearAuthExpiredMessage: mockClearAuthExpiredMessage,
            user: null,
            token: null,
            isLoading: false,
            logout: vi.fn(),
            checkAuth: vi.fn(),
        });
        // reset VITE_API_URL
        vi.stubEnv('VITE_API_URL', '');
    });

    const renderWithRouter = () => {
        return render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        );
    };

    describe('前端元素', () => {
        it('【前端元素】渲染登入表單', () => {
            renderWithRouter();

            expect(screen.getByLabelText('電子郵件')).toBeInTheDocument();
            expect(screen.getByLabelText('密碼')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: '登入' })).toBeInTheDocument();
            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        });

        it('【前端元素】開發環境顯示測試帳號提示', () => {
            renderWithRouter();
            expect(screen.getByText('測試帳號：任意 email 格式 / 密碼需包含英數且8位以上')).toBeInTheDocument();
        });
    });

    describe('function 邏輯', () => {
        it('【function 邏輯】驗證 Email 格式錯誤', async () => {
            renderWithRouter();

            const emailInput = screen.getByLabelText('電子郵件');
            const submitBtn = screen.getByRole('button', { name: '登入' });

            fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
            fireEvent.click(submitBtn);

            expect(await screen.findByText('請輸入有效的 Email 格式')).toBeInTheDocument();
            expect(mockLogin).not.toHaveBeenCalled();
        });

        it('【function 邏輯】驗證密碼長度不足', async () => {
            renderWithRouter();

            const emailInput = screen.getByLabelText('電子郵件');
            const passwordInput = screen.getByLabelText('密碼');
            const submitBtn = screen.getByRole('button', { name: '登入' });

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: '1234567' } });
            fireEvent.click(submitBtn);

            expect(await screen.findByText('密碼必須至少 8 個字元')).toBeInTheDocument();
            expect(mockLogin).not.toHaveBeenCalled();
        });

        it('【function 邏輯】驗證密碼未包含英數混合', async () => {
            renderWithRouter();

            const emailInput = screen.getByLabelText('電子郵件');
            const passwordInput = screen.getByLabelText('密碼');
            const submitBtn = screen.getByRole('button', { name: '登入' });

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: '12345678' } });
            fireEvent.click(submitBtn);

            expect(await screen.findByText('密碼必須包含英文字母和數字')).toBeInTheDocument();
            expect(mockLogin).not.toHaveBeenCalled();
        });
    });

    describe('Mock API', () => {
        it('【Mock API】登入成功並導向', async () => {
            mockLogin.mockResolvedValueOnce(undefined);
            renderWithRouter();

            const emailInput = screen.getByLabelText('電子郵件');
            const passwordInput = screen.getByLabelText('密碼');
            const submitBtn = screen.getByRole('button', { name: '登入' });

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'test1234' } });
            fireEvent.click(submitBtn);

            expect(submitBtn).toBeDisabled();
            expect(screen.getByText('登入中...')).toBeInTheDocument();

            await waitFor(() => {
                expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'test1234');
                expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
            });
        });

        it('【Mock API】登入失敗顯示錯誤', async () => {
            const errorObj = {
                response: { data: { message: '帳號或密碼錯誤' } }
            };
            mockLogin.mockRejectedValueOnce(errorObj);
            renderWithRouter();

            const emailInput = screen.getByLabelText('電子郵件');
            const passwordInput = screen.getByLabelText('密碼');
            const submitBtn = screen.getByRole('button', { name: '登入' });

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'test1234' } });
            fireEvent.click(submitBtn);

            const alert = await screen.findByRole('alert');
            expect(alert).toHaveTextContent('帳號或密碼錯誤');
            expect(submitBtn).not.toBeDisabled();
        });
    });

    describe('驗證權限', () => {
        it('【驗證權限】已登入狀態直接導向', () => {
            vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
                login: mockLogin,
                isAuthenticated: true,
                authExpiredMessage: null,
                clearAuthExpiredMessage: mockClearAuthExpiredMessage,
                user: null,
                token: null,
                isLoading: false,
                logout: vi.fn(),
                checkAuth: vi.fn(),
            });

            renderWithRouter();

            expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
        });

        it('【驗證權限】顯示授權過期訊息', () => {
            vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
                login: mockLogin,
                isAuthenticated: false,
                authExpiredMessage: '您的登入已過期，請重新登入',
                clearAuthExpiredMessage: mockClearAuthExpiredMessage,
                user: null,
                token: null,
                isLoading: false,
                logout: vi.fn(),
                checkAuth: vi.fn(),
            });

            renderWithRouter();

            expect(screen.getByRole('alert')).toHaveTextContent('您的登入已過期，請重新登入');
            expect(mockClearAuthExpiredMessage).toHaveBeenCalled();
        });
    });
});
