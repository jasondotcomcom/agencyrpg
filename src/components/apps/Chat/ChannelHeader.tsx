import React from 'react';
import { useChatContext } from '../../../context/ChatContext';
import styles from './ChannelHeader.module.css';

export default function ChannelHeader(): React.ReactElement {
  const { channels, activeChannel } = useChatContext();
  const channel = channels.find((c) => c.id === activeChannel);

  if (!channel) return <div className={styles.channelHeader} />;

  return (
    <div className={styles.channelHeader}>
      <span className={styles.channelIcon}>{channel.icon}</span>
      <h3 className={styles.channelName}>{channel.name}</h3>
      <span className={styles.divider}>|</span>
      <span className={styles.channelDescription}>{channel.description}</span>
      {channel.readOnly && (
        <span className={styles.readOnlyTag}>Read-only</span>
      )}
    </div>
  );
}
