import { useMobileContext } from '../../context/MobileContext';
import MobileStatusBar from './MobileStatusBar';
import MobileHomeScreen from './MobileHomeScreen';
import MobileAppContainer from './MobileAppContainer';
import MobileDock from './MobileDock';
import styles from './Mobile.module.css';

export default function MobileShell() {
  const { activeAppId } = useMobileContext();

  return (
    <div className={styles.phoneFrame}>
      <MobileStatusBar />
      <div className={styles.screenArea}>
        {activeAppId ? (
          <MobileAppContainer appId={activeAppId} />
        ) : (
          <MobileHomeScreen />
        )}
      </div>
      <MobileDock />
    </div>
  );
}
