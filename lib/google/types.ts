export type EventIdentifiers = {
  googleEventId: string;
  googleICalUID?: string;
  recurringEventId?: string;
  sequence: number;
  etag?: string;
};

export enum EventSyncStatus {
  SYNCED = 'synced',
  PENDING_SYNC = 'pending_sync',
  SYNC_FAILED = 'sync_failed',
  LOCAL_ONLY = 'local_only'
}

export enum EventSource {
  GOOGLE_CALENDAR = 'google_calendar',
  ICAL = 'ical',
  MANUAL = 'manual'
}

export enum EventStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  TENTATIVE = 'tentative'
}
