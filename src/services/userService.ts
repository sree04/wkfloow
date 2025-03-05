import api from './api';

export interface User {
  idrb_user_master: number;
  user_name: string;
  password: string;
}

export const userService = {
  getAllUsers: async () => {
    const response = await api.get<User[]>('/users');
    return response.data;
  },

  getUserById: async (id: number) => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  createUser: async (userData: Omit<User, 'idrb_user_master'>) => {
    const response = await api.post<User>('/users', userData);
    return response.data;
  },

  updateUser: async (id: number, userData: Partial<User>) => {
    const response = await api.put<User>(`/users/${id}`, userData);
    return response.data;
  }
};