import React, { useRef, useEffect } from 'react';
import { getHtmlPreview } from '../../../utils/htmlPreviewStore';
import styles from './HtmlPreview.module.css';

interface Props {
  previewId: string;
}

export default function HtmlPreview({ previewId }: Props): React.ReactElement {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const preview = getHtmlPreview(previewId);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !preview) return;

    const doc = iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(preview.html);
    doc.close();
  }, [preview]);

  if (!preview) {
    return (
      <div className={styles.container}>
        <div className={styles.toolbar}>
          <span className={styles.title}>Preview expired</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <span className={styles.title}>{preview.title}</span>
        <span className={styles.badge}>Preview</span>
      </div>
      <iframe
        ref={iframeRef}
        className={styles.iframe}
        sandbox="allow-scripts"
        title={preview.title || 'HTML Preview'}
      />
    </div>
  );
}
