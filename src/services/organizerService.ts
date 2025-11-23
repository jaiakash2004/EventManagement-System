import api from './api';

export interface OrganizerEvent {
  eventId: number;
  eventName: string;
  description: string;
  rulesAndRestrictions: string;
  type: string;
  ticketsProvided: number;
  maxTicketsPerUser: number;
  ticketPrice: number;
  startTime: string;
  endTime: string;
  status: string;
  approvalStatus: string;
  adminComment: string | null;
  venueName: string;
  venueAddress: string;
  venueCapacity: number;
  venueLatitude: number;
  venueLongitude: number;
  createdAt: string;
  updatedAt: string;
}

export interface EventUpdateRequest {
  eventName: string;
  description: string;
  rulesAndRestrictions: string;
  type: string;
  venueId: number;
  ticketsProvided: number;
  maxTicketsPerUser: number;
  ticketPrice: number;
  startTime: string;
  endTime: string;
}

export const organizerService = {
  getOrganizerEvents: async (): Promise<OrganizerEvent[]> => {
    const response = await api.get<any>('/organizer/events/');
    return response.data?.data ?? [];
  },

  getEventDetails: async (eventId: number): Promise<OrganizerEvent> => {
    const response = await api.get<any>(`/organizer/events/${eventId}`);
    return response.data?.data;
  },

  createEvent: async (eventData: any): Promise<any> => {
    const response = await api.post('/organizer/events', eventData);
    return response.data;
  },

  updateEvent: async (eventId: number, event: EventUpdateRequest): Promise<OrganizerEvent> => {
    const response = await api.put<any>(`/admin/events/${eventId}`, event);
    return response.data?.data;
  },

  cancelEvent: async (eventId: number): Promise<any> => {
    const response = await api.put(`/admin/events/${eventId}/cancel`, {});
    return response.data;
  },

  getOrganizerProfile: async (): Promise<any> => {
    const response = await api.get('/organizer/profile');
    return response.data;
  },

  updateOrganizerProfile: async (profileData: any): Promise<any> => {
    const response = await api.put('/organizer/profile', profileData);
    return response.data;
  },

  submitVenueRequest: async (venueRequest: any): Promise<any> => {
    const response = await api.post('/organizers/venue-requests', venueRequest);
    return response.data;
  },

  getVenueRequests: async (): Promise<any[]> => {
    const response = await api.get<any>('/organizers/venue-requests');
    return response.data?.data ?? [];
  },

  trackRequest: async (trackingToken: string): Promise<any> => {
    const response = await api.get(`/organizers/status/${trackingToken}`);
    return response.data;
  },

  getEventFeedback: async (eventId: number): Promise<any[]> => {
    const response = await api.get<any>(`/organizer/events/${eventId}/feedback`);
    return response.data?.data ?? [];
  },

  getBookingSummary: async (): Promise<any> => {
    const response = await api.get<any>('/organizer/events/bookings/summary');
    return response.data?.data ?? { totalActiveTickets: 0, totalRevenue: 0 };
  },

  registerOrganizer: async (organizerData: any): Promise<any> => {
    const response = await api.post('/organizers/request', organizerData);
    return response.data;
  },
};

