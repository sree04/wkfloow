import api from './api';

export interface Role {
  idrb_role_master: number;
  rb_role_name: string;
  rb_role_desc: string;
}

export const roleService = {
  getAllRoles: async () => {
    const response = await api.get<Role[]>('/roles');
    return response.data;
  },

  getRoleById: async (id: number) => {
    const response = await api.get<Role>(`/roles/${id}`);
    return response.data;
  },

  createRole: async (roleData: Omit<Role, 'idrb_role_master'>) => {
    const response = await api.post<Role>('/roles', roleData);
    return response.data;
  },

  updateRole: async (id: number, roleData: Partial<Role>) => {
    const response = await api.put<Role>(`/roles/${id}`, roleData);
    return response.data;
  }
};