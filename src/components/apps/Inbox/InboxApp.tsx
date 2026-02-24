import { useEffect } from 'react';
import { useEmailContext } from '../../../context/EmailContext';
import { useMobileContext } from '../../../context/MobileContext';
import { useDeviceMode } from '../../../utils/deviceDetection';
import EmailListItem from './EmailListItem';
import EmailDetail from './EmailDetail';
import type { EmailFilter } from '../../../types/email';
import styles from './InboxApp.module.css';

const filterLabels: Record<EmailFilter, string> = {
  all: 'All',
  unread: 'Unread',
  starred: 'Starred',
  campaign_brief: 'Briefs',
  team_message: 'Team',
  reputation_bonus: 'News',
};

export default function InboxApp() {
  const {
    filter,
    searchQuery,
    setFilter,
    setSearch,
    getFilteredEmails,
    getSelectedEmail,
    selectEmail,
  } = useEmailContext();

  const { setDockVisible } = useMobileContext();
  const deviceMode = useDeviceMode();
  const filteredEmails = getFilteredEmails();
  const selectedEmail = getSelectedEmail();

  // Hide dock on mobile when viewing email detail to maximize space
  useEffect(() => {
    if (deviceMode === 'phone') {
      setDockVisible(!selectedEmail);
    }
    return () => {
      if (deviceMode === 'phone') setDockVisible(true);
    };
  }, [selectedEmail, deviceMode, setDockVisible]);

  /** On mobile, go back to list view by clearing selection */
  const handleMobileBack = () => {
    selectEmail(null);
  };

  return (
    <div className={`${styles.inboxApp} ${selectedEmail ? styles.mobileDetailActive : ''}`}>
      {/* Sidebar with email list */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <button className={styles.composeButton} disabled title="Coming soon">
            <span className={styles.composeIcon}>&#x270F;&#xFE0F;</span>
            Compose
          </button>

          <div className={styles.searchBar}>
            <span className={styles.searchIcon}>&#x1F50D;</span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.filterTabs}>
          {(Object.keys(filterLabels) as EmailFilter[]).map((f) => (
            <button
              key={f}
              className={`${styles.filterTab} ${filter === f ? styles.active : ''}`}
              onClick={() => setFilter(f)}
            >
              {filterLabels[f]}
            </button>
          ))}
        </div>

        <div className={styles.emailList}>
          {filteredEmails.length === 0 ? (
            <div className={styles.emptyList}>
              <span className={styles.emptyIcon}>&#x1F4ED;</span>
              <p className={styles.emptyText}>No emails here!</p>
            </div>
          ) : (
            filteredEmails.map((email) => (
              <EmailListItem key={email.id} email={email} />
            ))
          )}
        </div>
      </div>

      {/* Detail pane */}
      <div className={styles.detailPane}>
        {selectedEmail ? (
          <>
            <button
              className={styles.mobileBackButton}
              onClick={handleMobileBack}
              aria-label="Back to inbox"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M12.5 15L7.5 10L12.5 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Inbox</span>
            </button>
            <EmailDetail email={selectedEmail} />
          </>
        ) : (
          <div className={styles.noSelection}>
            <span className={styles.noSelectionIcon}>&#x1F4EC;</span>
            <p className={styles.noSelectionText}>Select an email</p>
            <p className={styles.noSelectionHint}>
              Choose an email from the list to read it here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
