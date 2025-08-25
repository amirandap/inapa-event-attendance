// Tipos TypeScript para node-ical
declare module 'node-ical' {
  export interface VEvent {
    type: 'VEVENT';
    uid: string;
    summary: string;
    description?: string;
    location?: string;
    start: Date;
    end: Date;
    status?: string;
    organizer?: {
      val: string;
      params?: {
        CN?: string;
      };
    };
    attendee?: VEventAttendee | VEventAttendee[];
    [key: string]: any;
  }

  export interface VEventAttendee {
    val: string;
    params?: {
      CN?: string;
      PARTSTAT?: 'ACCEPTED' | 'DECLINED' | 'TENTATIVE' | 'NEEDS-ACTION';
      ROLE?: string;
      RSVP?: 'TRUE' | 'FALSE';
    };
  }

  export interface VTimezone {
    type: 'VTIMEZONE';
    tzid: string;
    [key: string]: any;
  }

  export interface VCalendar {
    type: 'VCALENDAR';
    version: string;
    prodid: string;
    [key: string]: any;
  }

  export type CalendarComponent = VEvent | VTimezone | VCalendar;

  export interface ParsedCalendar {
    [key: string]: CalendarComponent;
  }

  export namespace sync {
    export function parseICS(data: string): ParsedCalendar;
  }

  export function parseICS(data: string, callback: (err: Error | null, data: ParsedCalendar) => void): void;
  export function parseFile(filename: string, callback: (err: Error | null, data: ParsedCalendar) => void): void;
  export function fromURL(url: string, options: any, callback: (err: Error | null, data: ParsedCalendar) => void): void;
}
