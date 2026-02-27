import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardPage } from './DashboardPage';
import * as AuthContextModule from '../context/AuthContext';
import { productApi } from '../api/productApi';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

vi.mock('../api/productApi', () => ({
    productApi: {
        getProducts: vi.fn(),
    }
}));

describe('DashboardPage', () => {
    const mockNavigate = vi.fn();
    const mockLogout = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    });

    const renderWithRouter = () => {
        return render(
            <MemoryRouter>
                <DashboardPage />
            </MemoryRouter>
        );
    };

    const mockAuthContext = (role: 'admin' | 'user', username: string) => {
        vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
            user: { username, role },
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
        it('【前端元素】渲染 Dashboard 一般用戶畫面', async () => {
            mockAuthContext('user', 'TestUser');
            vi.mocked(productApi.getProducts).mockResolvedValue([]);
            renderWithRouter();

            expect(screen.getByText('儀表板')).toBeInTheDocument();
            expect(screen.getByText('Welcome, TestUser 👋')).toBeInTheDocument();
            expect(screen.getByText('一般用戶')).toBeInTheDocument();
            expect(screen.queryByText('🛠️ 管理後台')).not.toBeInTheDocument();

            await waitFor(() => {
                expect(vi.mocked(productApi.getProducts)).toHaveBeenCalled();
            });
        });

        it('【前端元素】渲染Dashboard 管理員畫面', async () => {
            mockAuthContext('admin', 'AdminUser');
            vi.mocked(productApi.getProducts).mockResolvedValue([]);
            renderWithRouter();

            expect(screen.getByText('管理員')).toBeInTheDocument();
            expect(screen.getByText('🛠️ 管理後台')).toBeInTheDocument();

            await waitFor(() => {
                expect(vi.mocked(productApi.getProducts)).toHaveBeenCalled();
            });
        });
    });

    describe('function 邏輯', () => {
        it('【function 邏輯】點擊登出按鈕', async () => {
            mockAuthContext('user', 'User');
            vi.mocked(productApi.getProducts).mockResolvedValue([]);
            renderWithRouter();

            const logoutBtn = screen.getByText('登出');
            fireEvent.click(logoutBtn);

            expect(mockLogout).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true, state: null });

            await waitFor(() => {
                expect(vi.mocked(productApi.getProducts)).toHaveBeenCalled();
            });
        });
    });

    describe('Mock API', () => {
        it('【Mock API】顯示商品列表載入中狀態', () => {
            mockAuthContext('user', 'User');
            // return a promise that never resolves so we can see the loading state
            vi.mocked(productApi.getProducts).mockImplementation(() => new Promise(() => { }));

            renderWithRouter();

            expect(screen.getByText('載入商品中...')).toBeInTheDocument();
            expect(screen.getByText('載入商品中...').previousSibling).toHaveClass('loading-spinner');
        });

        it('【Mock API】成功載入並渲染商品列表', async () => {
            mockAuthContext('user', 'User');
            const mockProducts = [
                { id: 1, name: 'Product A', price: 1000, description: 'Desc A' },
                { id: 2, name: 'Product B', price: 2000000, description: 'Desc B' },
            ];
            vi.mocked(productApi.getProducts).mockResolvedValue(mockProducts);

            renderWithRouter();

            expect(await screen.findByText('Product A')).toBeInTheDocument();
            expect(screen.getByText('Desc A')).toBeInTheDocument();
            expect(screen.getByText('NT$ 1,000')).toBeInTheDocument();

            expect(screen.getByText('Product B')).toBeInTheDocument();
            expect(screen.getByText('Desc B')).toBeInTheDocument();
            expect(screen.getByText('NT$ 2,000,000')).toBeInTheDocument();

            expect(screen.queryByText('載入商品中...')).not.toBeInTheDocument();
        });

        it('【Mock API】商品列表載入失敗顯示錯誤訊息', async () => {
            mockAuthContext('user', 'User');
            const errorObj = {
                response: { data: { message: '伺服器異常' } }
            };
            vi.mocked(productApi.getProducts).mockRejectedValue(errorObj);

            renderWithRouter();

            expect(await screen.findByText('伺服器異常')).toBeInTheDocument();
            expect(screen.queryByText('載入商品中...')).not.toBeInTheDocument();
        });
    });
});
