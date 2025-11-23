import api from './api';

export const adminService = {
  getAllUsers: async (): Promise<any[]> => {
    const response = await api.get<any>('/admin/users');
    return response.data?.data ?? [];
  },

  getAllOrganizers: async (): Promise<any[]> => {
    const response = await api.get<any>('/admin/organizers');
    return response.data?.data ?? [];
  },

  getAllEvents: async (): Promise<any[]> => {
    const response = await api.get<any>('/admin/events');
    return response.data?.data ?? [];
  },

  getAllVenues: async (): Promise<any[]> => {
    const response = await api.get<any>('/admin/venues');
    return response.data?.data ?? [];
  },

  approveEvent: async (eventId: number, comment?: string): Promise<any> => {
    const response = await api.put(`/admin/events/${eventId}/approve`, { comment });
    return response.data;
  },

  rejectEvent: async (eventId: number, comment: string): Promise<any> => {
    const response = await api.put(`/admin/events/${eventId}/reject`, { comment });
    return response.data;
  },

  approveVenue: async (venueId: number): Promise<any> => {
    const response = await api.put(`/admin/venues/${venueId}/approve`, {});
    return response.data;
  },

  rejectVenue: async (venueId: number, comment: string): Promise<any> => {
    const response = await api.put(`/admin/venues/${venueId}/reject`, { comment });
    return response.data;
  },

  // Organizer Requests
  getOrganizerRequests: async (): Promise<any[]> => {
    const response = await api.get<any>('/admin/organizer-requests');
    return Array.isArray(response.data) ? response.data : response.data?.data ?? [];
  },

  approveOrganizerRequest: async (requestId: number): Promise<any> => {
    const response = await api.post(`/admin/organizer-requests/${requestId}/approve`, {});
    return response.data;
  },

  rejectOrganizerRequest: async (requestId: number, rejectionReason: string): Promise<any> => {
    const response = await api.post(`/admin/organizer-requests/${requestId}/reject`, { rejectionReason });
    return response.data;
  },

  // User Management
  getUsers: async (role?: string, includeDeleted?: boolean): Promise<any[]> => {
    const params: any = {};
    if (role) params.role = role;
    if (includeDeleted !== undefined) params.includeDeleted = includeDeleted;
    const response = await api.get<any>('/admin/users/', { params });
    return response.data?.data ?? [];
  },

  deactivateUser: async (userId: number): Promise<any> => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  reactivateUser: async (userId: number): Promise<any> => {
    const response = await api.post(`/admin/users/${userId}/reactivate`, {});
    return response.data;
  },

  // Organizers List
  getAllOrganizersList: async (): Promise<any[]> => {
    const response = await api.get<any>('/organizers');
    return Array.isArray(response.data) ? response.data : response.data?.data ?? [];
  },

  // Event Management
  updateEvent: async (eventId: number, eventData: any): Promise<any> => {
    const response = await api.put(`/admin/events/${eventId}`, eventData);
    return response.data;
  },

  cancelEvent: async (eventId: number): Promise<any> => {
    const response = await api.post(`/admin/events/${eventId}/cancel`, {});
    return response.data;
  },

  deleteEvent: async (eventId: number): Promise<any> => {
    const response = await api.delete(`/admin/events/${eventId}`);
    return response.data;
  },

  // Venue Management
  createVenue: async (venueData: any): Promise<any> => {
    const response = await api.post('/admin/venues', venueData);
    return response.data;
  },

  updateVenue: async (venueId: number, venueData: any): Promise<any> => {
    const response = await api.put(`/admin/venues/${venueId}`, venueData);
    return response.data;
  },

  deleteVenue: async (venueId: number): Promise<any> => {
    const response = await api.delete(`/admin/venues/${venueId}`);
    return response.data;
  },

  // Venue Requests
  getPendingVenueRequests: async (): Promise<any[]> => {
    const response = await api.get<any>('/admin/venue-requests/pending');
    return response.data?.data ?? [];
  },

  reviewVenueRequest: async (requestId: number, reviewData: any): Promise<any> => {
    const response = await api.post(`/admin/venue-requests/${requestId}/review`, reviewData);
    return response.data;
  },

  // Approve/Reject Organizers
  approveOrganizer: async (organizerId: number): Promise<any> => {
    const response = await api.post(`/admin/organizers/${organizerId}/approve`, {});
    return response.data;
  },

  rejectOrganizer: async (organizerId: number, rejectionReason: string): Promise<any> => {
    const response = await api.post(`/admin/organizers/${organizerId}/reject`, { rejectionReason });
    return response.data;
  },

  // Approve/Reject Users
  approveUser: async (userId: number): Promise<any> => {
    const response = await api.post(`/admin/users/${userId}/approve`, {});
    return response.data;
  },

  rejectUser: async (userId: number, rejectionReason: string): Promise<any> => {
    const response = await api.post(`/admin/users/${userId}/reject`, { rejectionReason });
    return response.data;
  },
};

