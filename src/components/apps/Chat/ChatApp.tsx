import React, { useEffect } from 'react';
import ChannelSidebar from './ChannelSidebar';
import ChannelHeader from './ChannelHeader';
import MobileChannelTabs from './MobileChannelTabs';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import styles from './ChatApp.module.css';

export default function ChatApp(): React.ReactElement {
  // Warm the serverless API route when the chat opens so the player's first
  // message doesn't pay a cold-start penalty on top of the model call.
  useEffect(() => {
    fetch('/api/anthropic/v1/messages', { method: 'GET' }).catch(() => {});
  }, []);

  return (
    <div className={styles.chatApp}>
      <ChannelSidebar />
      <div className={styles.mainPane}>
        <MobileChannelTabs />
        <ChannelHeader />
        <MessageList />
        <MessageInput />
      </div>
    </div>
  );
}
