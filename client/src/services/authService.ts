import api from './api';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    role: string;
    name: string;
    email: string;
    [key: string]: unknown;
  };
}

class AuthService {
  async login(email: string, password: string) {
    const response = await api.post<LoginResponse>('/auth/login', {
      email,
      password,
    });

    const { accessToken, refreshToken, user } = response.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));

    return user;
  }

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }
}

export const authService = new AuthService();

