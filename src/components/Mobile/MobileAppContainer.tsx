import AppRouter from '../apps/AppRouter';
import MobileAppHeader from './MobileAppHeader';
import styles from './Mobile.module.css';

interface MobileAppContainerProps {
  appId: string;
}

export default function MobileAppContainer({ appId }: MobileAppContainerProps) {
  return (
    <div className={styles.appContainer}>
      <MobileAppHeader appId={appId} />
      <div className={styles.appContent}>
        <AppRouter appId={appId} />
      </div>
    </div>
  );
}
