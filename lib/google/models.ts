import { calendar_v3 } from '@googleapis/calendar';

export interface Event {
  id: string;
  googleEventId: string;
  googleICalUID?: string | null;
  recurringEventId?: string | null;
  etag?: string | null;
  title: string;
  description: string | null;
  location: string | null;
  startAt: Date;
  endAt: Date;
  formToken: string;
  status: string;
  organizerId: number;
  createdAt: Date;
  updatedAt: Date;
  lastSyncAt: Date | null;
  sourceCreatedAt: Date | null;
  sourceUpdatedAt: Date | null;
  sequence: number;
  meetingId: string | null;
  conferenceData: any | null;
  source: string;
  syncStatus: string;
  syncError: string | null;
  syncRetries: number;
}

export interface GoogleEvent extends calendar_v3.Schema$Event {
  // Campos adicionales específicos de nuestra implementación
  id: string;
  iCalUID?: string;
  recurringEventId?: string;
  sequence: number;
  etag?: string;
}
