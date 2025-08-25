import { calendar_v3 } from 'googleapis';

export interface GoogleEventDateTime {
  dateTime: string;
  timeZone?: string;
}

export interface GoogleEventAttendee {
  email: string;
  displayName?: string;
  responseStatus?: string;
  resource?: boolean;
}

export interface GoogleEventOrganizer {
  email: string;
  displayName?: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: GoogleEventDateTime;
  end: GoogleEventDateTime;
  organizer?: GoogleEventOrganizer;
  attendees?: GoogleEventAttendee[];
  status: string;
}

export interface GoogleCalendarConferenceData {
  conferenceId: string;
  type: string;
  entryPoints: Array<{
    entryPointType: string;
    uri: string;
    label?: string;
  }>;
}

export interface RawGoogleEvent extends calendar_v3.Schema$Event {
  iCalUID: string;
  sequence: number;
  created: string;
  updated: string;
  conferenceData?: GoogleCalendarConferenceData;
}

export type EventSource = 'google_calendar' | 'ical' | 'manual';

export type EventStatus = 'active' | 'cancelled' | 'tentative';
