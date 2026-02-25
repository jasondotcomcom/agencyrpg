import React, { useMemo } from 'react';
import { getHtmlPreview } from '../../../utils/htmlPreviewStore';
import styles from './HtmlPreview.module.css';

interface Props {
  previewId: string;
}

export default function HtmlPreview({ previewId }: Props): React.ReactElement {
  const preview = getHtmlPreview(previewId);

  // Strip markdown code fences if the AI wrapped its output
  const cleanHtml = useMemo(() => {
    if (!preview) return '';
    let html = preview.html;
    const fenceMatch = html.match(/```(?:html)?\s*\n([\s\S]*?)```/);
    if (fenceMatch) html = fenceMatch[1];
    return html.trim();
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
        className={styles.iframe}
        sandbox="allow-scripts"
        srcDoc={cleanHtml}
        title={preview.title || 'HTML Preview'}
      />
    </div>
  );
}
