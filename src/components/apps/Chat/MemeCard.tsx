import { useState, useEffect, useRef } from 'react';
import type { MemeData } from '../../../types/chat';
import { generateMemeImage } from '../../../utils/memeImageGenerator';
import styles from './MemeCard.module.css';

interface MemeCardProps {
  data: MemeData;
}

export default function MemeCard({ data }: MemeCardProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
    let cancelled = false;

    generateMemeImage(data).then(src => {
      if (!cancelled) {
        setImgSrc(src);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [data]);

  if (loading) {
    return (
      <div className={styles.memeSkeleton}>
        <span className={styles.skeletonEmoji}>🎨</span>
        <span className={styles.skeletonText}>generating meme...</span>
      </div>
    );
  }

  return (
    <img
      className={styles.memeImage}
      src={imgSrc ?? undefined}
      alt={`${data.template} meme`}
      loading="lazy"
    />
  );
}
