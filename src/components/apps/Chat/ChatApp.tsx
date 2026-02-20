import React from 'react';
import ChannelSidebar from './ChannelSidebar';
import ChannelHeader from './ChannelHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import styles from './ChatApp.module.css';

export default function ChatApp(): React.ReactElement {
  return (
    <div className={styles.chatApp}>
      <ChannelSidebar />
      <div className={styles.mainPane}>
        <ChannelHeader />
        <MessageList />
        <MessageInput />
      </div>
    </div>
  );
}
