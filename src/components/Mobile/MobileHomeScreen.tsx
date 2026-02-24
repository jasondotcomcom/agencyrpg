import { useMemo } from 'react';
import type { DesktopIcon as DesktopIconType } from '../../types';
import { useEmailContext } from '../../context/EmailContext';
import { useChatContext } from '../../context/ChatContext';
import { useTerminalTools } from '../../hooks/useTerminalTools';
import MobileAppIcon from './MobileAppIcon';
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
];

export default function MobileHomeScreen() {
  const { getUnreadCount } = useEmailContext();
  const { getUnreadCount: getChatUnreadCount } = useChatContext();
  const terminalTools = useTerminalTools();

  const allIcons = useMemo<DesktopIconType[]>(() => {
    const toolIcons: DesktopIconType[] = terminalTools.map(t => ({
      id: `icon-tool-${t.id}`,
      label: t.name.replace(/_/g, ' '),
      icon: `tool:${t.icon}`,
      appId: `tool:${t.id}`,
    }));
    return [...defaultIcons, ...toolIcons];
  }, [terminalTools]);

  const unreadCount = getUnreadCount();
  const chatUnreadCount = getChatUnreadCount();

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
        />
      ))}
    </div>
  );
}
