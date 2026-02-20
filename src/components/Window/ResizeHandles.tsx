import styles from './ResizeHandles.module.css';

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

interface ResizeHandlesProps {
  getHandleProps: (direction: ResizeDirection) => {
    onMouseDown: (e: React.MouseEvent) => void;
    style: React.CSSProperties;
  };
}

export default function ResizeHandles({ getHandleProps }: ResizeHandlesProps) {
  return (
    <>
      {/* Corners */}
      <div
        className={`${styles.resizeHandle} ${styles.handleNW}`}
        {...getHandleProps('nw')}
      />
      <div
        className={`${styles.resizeHandle} ${styles.handleNE}`}
        {...getHandleProps('ne')}
      />
      <div
        className={`${styles.resizeHandle} ${styles.handleSW}`}
        {...getHandleProps('sw')}
      />
      <div
        className={`${styles.resizeHandle} ${styles.handleSE}`}
        {...getHandleProps('se')}
      />

      {/* Edges */}
      <div
        className={`${styles.resizeHandle} ${styles.handleN}`}
        {...getHandleProps('n')}
      />
      <div
        className={`${styles.resizeHandle} ${styles.handleS}`}
        {...getHandleProps('s')}
      />
      <div
        className={`${styles.resizeHandle} ${styles.handleW}`}
        {...getHandleProps('w')}
      />
      <div
        className={`${styles.resizeHandle} ${styles.handleE}`}
        {...getHandleProps('e')}
      />
    </>
  );
}
