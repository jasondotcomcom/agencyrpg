import React from 'react';
import { useChatContext } from '../../../context/ChatContext';
import MoraleIndicator from './MoraleIndicator';
import styles from './ChannelSidebar.module.css';

export default function ChannelSidebar(): React.ReactElement {
  const { channels, activeChannel, setActiveChannel, getUnreadCountForChannel } = useChatContext();

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <h3 className={styles.headerTitle}>Agency Chat</h3>
      </div>

      <div className={styles.sectionLabel}>Channels</div>
      <div className={styles.channelList}>
        {channels.map((channel) => {
          const unread = getUnreadCountForChannel(channel.id);
          return (
            <button
              key={channel.id}
              className={`${styles.channelItem} ${activeChannel === channel.id ? styles.active : ''}`}
              onClick={() => setActiveChannel(channel.id)}
            >
              <span className={styles.channelIcon}>{channel.icon}</span>
              <span className={styles.channelName}>{channel.name}</span>
              {unread > 0 && (
                <span className={styles.unreadBadge}>
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className={styles.sidebarFooter}>
        <MoraleIndicator />
      </div>
    </div>
  );
}
