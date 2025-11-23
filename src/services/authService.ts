import api from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    email: string;
    role: string;
    name: string;
    userId: number;
  };
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  gender: string;
  dob: string;
  profilePicture?: string;
}

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: RegisterRequest): Promise<any> => {
    const response = await api.post('/users/register', userData);
    return response.data;
  },

  getProfile: async (): Promise<any> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
};

