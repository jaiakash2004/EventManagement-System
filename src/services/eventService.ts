import api from './api';

export type Event = {
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
  venueName: string;
  venueAddress: string;
  venueCapacity: number;
  organizerName?: string;
  organizerType?: string;
  createdAt: string;
  updatedAt: string;
};

export type Venue = {
  venueId: number;
  name: string;
  address: string;
  capacity: number;
  latitude: number;
  longitude: number;
  availabilityStatus: string;
  createdAt: string;
  updatedAt: string;
};

export const eventService = {
  getAllEvents: async (): Promise<Event[]> => {
    const response = await api.get<any>('/events/');
    return response.data?.data ?? [];
  },

  filterEvents: async (params: any): Promise<Event[]> => {
    const response = await api.get<any>('/events/filter', { params });
    return response.data?.data ?? [];
  },

  getEventById: async (eventId: number): Promise<Event> => {
    const response = await api.get<any>(`/events/${eventId}`);
    return response.data?.data;
  },

  registerForEvent: async (eventId: number, ticketQuantity: number, ticketType: string): Promise<any> => {
    const response = await api.post('/users/events/register', {
      eventId,
      ticketQuantity,
      ticketType,
    });
    return response.data;
  },

  getAllVenues: async (): Promise<Venue[]> => {
    const response = await api.get<any>('/venues/');
    return response.data?.data ?? [];
  },
};

