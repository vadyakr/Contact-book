import type { Contact } from '@models/Contact';
import type { Group } from '@models/Group';

interface PersistedState {
  contacts: Contact[];
  groups: Group[];
}

const STORAGE_KEY = 'contact-book-state';

export class StorageService {
  static load(): PersistedState {
    if (typeof window === 'undefined') {
      return { contacts: [], groups: [] };
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { contacts: [], groups: [] };
    }

    try {
      const parsed = JSON.parse(raw) as PersistedState;
      return {
        contacts: parsed.contacts ?? [],
        groups: parsed.groups ?? []
      };
    } catch {
      return { contacts: [], groups: [] };
    }
  }

  static save(state: PersistedState): void {
    if (typeof window === 'undefined') {
      return;
    }

    const payload: PersistedState = {
      contacts: state.contacts,
      groups: state.groups
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }
}

