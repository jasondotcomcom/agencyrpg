import { useMemo, useState, useCallback } from 'react';
import type { DesktopIcon as DesktopIconType } from '../../types';
import { useEmailContext } from '../../context/EmailContext';
import { useChatContext } from '../../context/ChatContext';
import { useTerminalTools } from '../../hooks/useTerminalTools';
import { useLayoffs } from '../../utils/layoffsStore';
import MobileAppIcon from './MobileAppIcon';
import QuickActionMenu from './QuickActionMenu';
import styles from './Mobile.module.css';

const defaultIcons: DesktopIconType[] = [
  { id: 'icon-inbox', label: 'Inbox', icon: 'inbox', appId: 'inbox' },
  { id: 'icon-projects', label: 'Projects', icon: 'projects', appId: 'projects' },
  { id: 'icon-portfolio', label: 'Portfolio', icon: 'portfolio', appId: 'portfolio' },
  { id: 'icon-chat', label: 'Chat', icon: 'chat', appId: 'chat' },
  { id: 'icon-terminal', label: 'Terminal', icon: 'terminal', appId: 'terminal' },
  { id: 'icon-notes', label: 'Notes', icon: 'notes', appId: 'notes' },
  { id: 'icon-calendar', label: 'Calendar', icon: 'calendar', appId: 'calendar' },
  { id: 'icon-settings', label: 'Settings', icon: 'settings', appId: 'settings' },
  { id: 'icon-help', label: 'Help', icon: 'help', appId: 'help' },
  // Easter egg games + about
  { id: 'icon-solitaire', label: 'Solitaire', icon: 'tool:🃏', appId: 'solitaire' },
  { id: 'icon-minesweeper', label: 'Minesweeper', icon: 'tool:💣', appId: 'minesweeper' },
  { id: 'icon-skifree', label: 'SkiFree', icon: 'tool:⛷️', appId: 'skifree' },
  { id: 'icon-about', label: 'About', icon: 'tool:ℹ️', appId: 'about' },
];

interface QuickActionState {
  appId: string;
  rect: DOMRect;
}

export default function MobileHomeScreen() {
  const { getUnreadCount } = useEmailContext();
  const { getUnreadCount: getChatUnreadCount } = useChatContext();
  const terminalTools = useTerminalTools();
  const { overridden: slotsUnlocked } = useLayoffs();

  const [quickAction, setQuickAction] = useState<QuickActionState | null>(null);

  const allIcons = useMemo<DesktopIconType[]>(() => {
    const toolIcons: DesktopIconType[] = terminalTools.map(t => ({
      id: `icon-tool-${t.id}`,
      label: t.name.replace(/_/g, ' '),
      icon: `tool:${t.icon}`,
      appId: `tool:${t.id}`,
    }));
    const slotsIcon: DesktopIconType[] = slotsUnlocked
      ? [{ id: 'icon-headcount-slots', label: 'Headcount Slots', icon: 'tool:🎰', appId: 'headcount-slots' }]
      : [];
    return [...defaultIcons, ...slotsIcon, ...toolIcons];
  }, [terminalTools, slotsUnlocked]);

  const unreadCount = getUnreadCount();
  const chatUnreadCount = getChatUnreadCount();

  const handleLongPress = useCallback((appId: string, rect: DOMRect) => {
    setQuickAction({ appId, rect });
  }, []);

  const handleCloseQuickAction = useCallback(() => {
    setQuickAction(null);
  }, []);

  return (
    <div className={styles.homeScreen}>
      {allIcons.map(icon => (
        <MobileAppIcon
          key={icon.id}
          appId={icon.appId}
          label={icon.label}
          iconKey={icon.icon}
          badgeCount={
            icon.appId === 'inbox' ? unreadCount :
            icon.appId === 'chat' ? chatUnreadCount :
            undefined
          }
          onLongPress={handleLongPress}
        />
      ))}

      {quickAction && (
        <QuickActionMenu
          appId={quickAction.appId}
          anchorRect={quickAction.rect}
          onClose={handleCloseQuickAction}
        />
      )}
    </div>
  );
}
