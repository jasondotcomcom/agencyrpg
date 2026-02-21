import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { Email, EmailFilter, EmailSort } from '../types/email';
import { initialEmails } from '../data/initialEmails';
import { emitSave } from '../utils/saveSignal';

const STORAGE_KEY = 'agencyrpg_emails';

function loadEmails(): Email[] | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const parsed: Email[] = JSON.parse(saved);
    // Revive Date objects
    const savedEmails = parsed.map(e => ({ ...e, timestamp: new Date(e.timestamp) }));
    // Merge in any new initial emails not present in saved data (for game updates)
    const savedIds = new Set(savedEmails.map(e => e.id));
    const newEmails = initialEmails.filter(e => !savedIds.has(e.id));
    return [...newEmails, ...savedEmails];
  } catch {
    return null;
  }
}

interface EmailState {
  emails: Email[];
  selectedEmailId: string | null;
  filter: EmailFilter;
  sort: EmailSort;
  searchQuery: string;
}

type EmailAction =
  | { type: 'SELECT_EMAIL'; payload: string | null }
  | { type: 'MARK_READ'; payload: string }
  | { type: 'MARK_UNREAD'; payload: string }
  | { type: 'TOGGLE_STAR'; payload: string }
  | { type: 'DELETE_EMAIL'; payload: string }
  | { type: 'SET_FILTER'; payload: EmailFilter }
  | { type: 'SET_SORT'; payload: EmailSort }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'ADD_EMAIL'; payload: Email }
  | { type: 'ACCEPT_BRIEF'; payload: string };

const savedEmails = loadEmails();
const initialState: EmailState = {
  emails: savedEmails ?? initialEmails,
  selectedEmailId: null,
  filter: 'all',
  sort: 'date_desc',
  searchQuery: '',
};

function emailReducer(state: EmailState, action: EmailAction): EmailState {
  switch (action.type) {
    case 'SELECT_EMAIL':
      return { ...state, selectedEmailId: action.payload };

    case 'MARK_READ':
      return {
        ...state,
        emails: state.emails.map(email =>
          email.id === action.payload ? { ...email, isRead: true } : email
        ),
      };

    case 'MARK_UNREAD':
      return {
        ...state,
        emails: state.emails.map(email =>
          email.id === action.payload ? { ...email, isRead: false } : email
        ),
      };

    case 'TOGGLE_STAR':
      return {
        ...state,
        emails: state.emails.map(email =>
          email.id === action.payload ? { ...email, isStarred: !email.isStarred } : email
        ),
      };

    case 'DELETE_EMAIL':
      return {
        ...state,
        emails: state.emails.map(email =>
          email.id === action.payload ? { ...email, isDeleted: true } : email
        ),
        selectedEmailId: state.selectedEmailId === action.payload ? null : state.selectedEmailId,
      };

    case 'SET_FILTER':
      return { ...state, filter: action.payload, selectedEmailId: null };

    case 'SET_SORT':
      return { ...state, sort: action.payload };

    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload };

    case 'ADD_EMAIL':
      return {
        ...state,
        emails: [action.payload, ...state.emails],
      };

    case 'ACCEPT_BRIEF':
      return {
        ...state,
        emails: state.emails.map(email =>
          email.id === action.payload
            ? { ...email, isRead: true }
            : email
        ),
      };

    default:
      return state;
  }
}

interface EmailContextValue extends EmailState {
  selectEmail: (id: string | null) => void;
  markRead: (id: string) => void;
  markUnread: (id: string) => void;
  toggleStar: (id: string) => void;
  deleteEmail: (id: string) => void;
  setFilter: (filter: EmailFilter) => void;
  setSort: (sort: EmailSort) => void;
  setSearch: (query: string) => void;
  addEmail: (email: Email) => void;
  acceptBrief: (id: string) => void;
  getFilteredEmails: () => Email[];
  getUnreadCount: () => number;
  getSelectedEmail: () => Email | undefined;
}

const EmailContext = createContext<EmailContextValue | null>(null);

export function EmailProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(emailReducer, initialState);

  // Persist emails to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.emails));
      emitSave();
    } catch (e) {
      console.error('Failed to save emails:', e);
    }
  }, [state.emails]);

  const selectEmail = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_EMAIL', payload: id });
    if (id) {
      dispatch({ type: 'MARK_READ', payload: id });
    }
  }, []);

  const markRead = useCallback((id: string) => {
    dispatch({ type: 'MARK_READ', payload: id });
  }, []);

  const markUnread = useCallback((id: string) => {
    dispatch({ type: 'MARK_UNREAD', payload: id });
  }, []);

  const toggleStar = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_STAR', payload: id });
  }, []);

  const deleteEmail = useCallback((id: string) => {
    dispatch({ type: 'DELETE_EMAIL', payload: id });
  }, []);

  const setFilter = useCallback((filter: EmailFilter) => {
    dispatch({ type: 'SET_FILTER', payload: filter });
  }, []);

  const setSort = useCallback((sort: EmailSort) => {
    dispatch({ type: 'SET_SORT', payload: sort });
  }, []);

  const setSearch = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH', payload: query });
  }, []);

  const addEmail = useCallback((email: Email) => {
    dispatch({ type: 'ADD_EMAIL', payload: email });
  }, []);

  const acceptBrief = useCallback((id: string) => {
    dispatch({ type: 'ACCEPT_BRIEF', payload: id });
  }, []);

  const getFilteredEmails = useCallback(() => {
    let filtered = state.emails.filter(e => !e.isDeleted);

    // Apply search
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(
        e =>
          e.subject.toLowerCase().includes(query) ||
          e.from.name.toLowerCase().includes(query) ||
          e.body.toLowerCase().includes(query)
      );
    }

    // Apply filter
    switch (state.filter) {
      case 'unread':
        filtered = filtered.filter(e => !e.isRead);
        break;
      case 'starred':
        filtered = filtered.filter(e => e.isStarred);
        break;
      case 'campaign_brief':
        filtered = filtered.filter(e => e.type === 'campaign_brief');
        break;
      case 'team_message':
        filtered = filtered.filter(e => e.type === 'team_message');
        break;
      case 'reputation_bonus':
        filtered = filtered.filter(e => e.type === 'reputation_bonus');
        break;
    }

    // Apply sort
    switch (state.sort) {
      case 'date_desc':
        filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        break;
      case 'date_asc':
        filtered.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        break;
      case 'sender':
        filtered.sort((a, b) => a.from.name.localeCompare(b.from.name));
        break;
    }

    return filtered;
  }, [state.emails, state.filter, state.sort, state.searchQuery]);

  const getUnreadCount = useCallback(() => {
    return state.emails.filter(e => !e.isRead && !e.isDeleted).length;
  }, [state.emails]);

  const getSelectedEmail = useCallback(() => {
    return state.emails.find(e => e.id === state.selectedEmailId);
  }, [state.emails, state.selectedEmailId]);

  const value: EmailContextValue = {
    ...state,
    selectEmail,
    markRead,
    markUnread,
    toggleStar,
    deleteEmail,
    setFilter,
    setSort,
    setSearch,
    addEmail,
    acceptBrief,
    getFilteredEmails,
    getUnreadCount,
    getSelectedEmail,
  };

  return (
    <EmailContext.Provider value={value}>
      {children}
    </EmailContext.Provider>
  );
}

export function useEmailContext() {
  const context = useContext(EmailContext);
  if (!context) {
    throw new Error('useEmailContext must be used within an EmailProvider');
  }
  return context;
}
