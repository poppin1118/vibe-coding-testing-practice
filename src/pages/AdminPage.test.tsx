import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminPage } from './AdminPage';
import * as AuthContextModule from '../context/AuthContext';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

describe('AdminPage', () => {
    const mockNavigate = vi.fn();
    const mockLogout = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    });

    const renderWithRouter = () => {
        return render(
            <MemoryRouter>
                <AdminPage />
            </MemoryRouter>
        );
    };

    const mockAdminAuth = () => {
        vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
            user: { username: 'Admin', role: 'admin' },
            token: 'fake-token',
            isLoading: false,
            isAuthenticated: true,
            authExpiredMessage: null,
            login: vi.fn(),
            logout: mockLogout,
            checkAuth: vi.fn(),
            clearAuthExpiredMessage: vi.fn(),
        });
    };

    const mockUserAuth = () => {
        vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
            user: { username: 'User', role: 'user' },
            token: 'fake-token',
            isLoading: false,
            isAuthenticated: true,
            authExpiredMessage: null,
            login: vi.fn(),
            logout: mockLogout,
            checkAuth: vi.fn(),
            clearAuthExpiredMessage: vi.fn(),
        });
    };

    describe('前端元素', () => {
        it('【前端元素】渲染管理後台頁面', () => {
            mockAdminAuth();
            renderWithRouter();

            expect(screen.getByText('🛠️ 管理後台')).toBeInTheDocument();
            expect(screen.getByText('管理員')).toBeInTheDocument();
            expect(screen.getByText('管理員專屬頁面')).toBeInTheDocument();
        });

        it('【前端元素】渲染一般用戶頁面', () => {
            mockUserAuth();
            renderWithRouter();

            expect(screen.getByText('一般用戶')).toBeInTheDocument();
        });
    });

    describe('function 邏輯', () => {
        it('【function 邏輯】點擊登出按鈕', () => {
            mockAdminAuth();
            renderWithRouter();

            const logoutBtn = screen.getByText('登出');
            fireEvent.click(logoutBtn);

            expect(mockLogout).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true, state: null });
        });
    });
});
