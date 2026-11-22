import { INITIAL_ANNOUNCEMENTS } from '../data/sampleAnnouncements';
import type { Announcement } from '../types/announcement';

const STORAGE_KEY = 'campussignal_announcements_v1';

export function loadAnnouncements(): Announcement[] {
  if (typeof window === 'undefined') {
    return INITIAL_ANNOUNCEMENTS;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ANNOUNCEMENTS));
      return INITIAL_ANNOUNCEMENTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as Announcement[];
    }
    return INITIAL_ANNOUNCEMENTS;
  } catch {
    return INITIAL_ANNOUNCEMENTS;
  }
}

export function saveAnnouncementsToStorage(items: Announcement[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore quota errors in constrained environments
  }
}

export function resetAnnouncementsToSample(): Announcement[] {
  saveAnnouncementsToStorage(INITIAL_ANNOUNCEMENTS);
  return INITIAL_ANNOUNCEMENTS;
}
