import { useWindowContext } from '../../context/WindowContext';
import Notification from './Notification';
import styles from './NotificationContainer.module.css';

export default function NotificationContainer() {
  const { notifications, removeNotification } = useWindowContext();

  // Show max 3 notifications at a time
  const visibleNotifications = notifications.slice(-3);

  return (
    <div className={styles.container}>
      {visibleNotifications.map(notification => (
        <Notification
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}
