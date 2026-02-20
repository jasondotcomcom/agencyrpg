export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface WindowState {
  id: string;
  appId: string;
  title: string;
  position: Position;
  size: Size;
  minSize: Size;
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
  previousState?: {
    position: Position;
    size: Size;
  };
}

export interface DesktopIcon {
  id: string;
  label: string;
  icon: string;
  appId: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  icon?: string;
  duration?: number;
}

export type WindowAction =
  | { type: 'OPEN_WINDOW'; payload: { appId: string; title: string } }
  | { type: 'FOCUS_OR_OPEN'; payload: { appId: string; title: string } }
  | { type: 'CLOSE_WINDOW'; payload: { id: string } }
  | { type: 'MINIMIZE_WINDOW'; payload: { id: string } }
  | { type: 'MAXIMIZE_WINDOW'; payload: { id: string } }
  | { type: 'RESTORE_WINDOW'; payload: { id: string } }
  | { type: 'FOCUS_WINDOW'; payload: { id: string } }
  | { type: 'UPDATE_POSITION'; payload: { id: string; position: Position } }
  | { type: 'UPDATE_SIZE'; payload: { id: string; size: Size } }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id'> }
  | { type: 'REMOVE_NOTIFICATION'; payload: { id: string } };

export interface WindowContextState {
  windows: Map<string, WindowState>;
  activeWindowId: string | null;
  nextZIndex: number;
  notifications: Notification[];
}

// Re-export email types
export * from './email';
