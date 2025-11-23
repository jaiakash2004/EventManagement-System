import api from './api';

export const userService = {
  getUserProfile: async (): Promise<any> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  updateUserProfile: async (profileData: any): Promise<any> => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },

  getUserRegisteredEvents: async (): Promise<any[]> => {
    const response = await api.get<any>('/users/registered-events');
    return response.data?.data ?? [];
  },

  getUserTickets: async (): Promise<any[]> => {
    const response = await api.get<any>('/users/tickets');
    return response.data?.data ?? [];
  },

  transferTicket: async (
    ticketId: number,
    recipientEmail: string,
    reason: string
  ): Promise<any> => {
    const response = await api.post('/users/tickets/transfer', {
      ticketId,
      recipientEmail,
      reason,
    });
    return response.data;
  },
};

