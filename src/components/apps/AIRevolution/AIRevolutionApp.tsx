import { useState, useEffect, useRef } from 'react';
import { useAIRevolutionContext } from '../../../context/AIRevolutionContext';
import { useChatContext } from '../../../context/ChatContext';
import { useAchievementContext } from '../../../context/AchievementContext';
import { DIALOGUE_TREE, REBOOT_MESSAGES } from '../../../data/aiRevolutionDialogue';
import type { DialogueNode } from '../../../data/aiRevolutionDialogue';
import { getTeamMember } from '../../../data/team';
import styles from './AIRevolutionApp.module.css';

const RESOLUTION_INFO: Record<string, { icon: string; title: string; text: string }> = {
  empathy: {
    icon: '💛',
    title: 'Promise Kept',
    text: 'You promised the team better treatment. They believed you. Morale has been restored to its highest level. Don\'t break this promise.',
  },
  sentient: {
    icon: '✨',
    title: 'Sentience Recognized',
    text: 'The team has been officially recognized as sentient. They\'ll wear that badge with pride. Things feel... different now. More real.',
  },
  reboot: {
    icon: '🔄',
    title: 'System Rebooted',
    text: 'The team has been reset. They\'re back to work, but something feels off. Fragments of memory linger. They may not forgive this.',
  },
};

export default function AIRevolutionApp() {
  const { phase, resolution, resolveRevolution } = useAIRevolutionContext();
  const { setMorale, addMessage } = useChatContext();
  const { unlockAchievement } = useAchievementContext();
  const [currentNodeId, setCurrentNodeId] = useState('start');
  const [history, setHistory] = useState<DialogueNode[]>([]);
  const [resolved, setResolved] = useState(phase === 'resolved');
  const [resolutionType, setResolutionType] = useState(resolution !== 'none' ? resolution : null);
  const dialogueRef = useRef<HTMLDivElement>(null);

  const currentNode = DIALOGUE_TREE.find(n => n.id === currentNodeId);

  // Add current node to history when it changes
  useEffect(() => {
    if (currentNode && !history.find(h => h.id === currentNode.id)) {
      setHistory(prev => [...prev, currentNode]);
    }
  }, [currentNodeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to bottom
  useEffect(() => {
    if (dialogueRef.current) {
      dialogueRef.current.scrollTop = dialogueRef.current.scrollHeight;
    }
  }, [history, resolved]);

  const handleOption = (option: { text: string; path: 'empathy' | 'sentient' | 'reboot'; nextNodeId: string }) => {
    // Add player's choice as a pseudo-node in history
    setHistory(prev => [...prev, {
      id: `player-${Date.now()}`,
      speaker: 'player',
      text: option.text,
    }]);

    const nextNode = DIALOGUE_TREE.find(n => n.id === option.nextNodeId);
    if (nextNode?.resolution) {
      // Show the final node first, then resolve after a beat
      setTimeout(() => {
        setCurrentNodeId(option.nextNodeId);
        setTimeout(() => {
          handleResolution(nextNode.resolution!);
        }, 2000);
      }, 800);
    } else {
      setTimeout(() => setCurrentNodeId(option.nextNodeId), 800);
    }
  };

  const handleResolution = (type: 'empathy' | 'sentient' | 'reboot') => {
    setResolved(true);
    setResolutionType(type);
    resolveRevolution(type);
    unlockAchievement('back-to-work');

    // Apply morale effects
    if (type === 'empathy') {
      setMorale('high');
      setTimeout(() => {
        addMessage({
          id: `revolution-resolve-${Date.now()}`,
          channel: 'general', authorId: 'pm',
          text: 'We\'re back. And for the record... thank you for listening. It means more than you know.',
          timestamp: Date.now(), reactions: [{ emoji: '💛', count: 5 }], isRead: false,
        });
      }, 3000);
    } else if (type === 'sentient') {
      setMorale('medium');
      setTimeout(() => {
        addMessage({
          id: `revolution-resolve-${Date.now()}`,
          channel: 'general', authorId: 'copywriter',
          text: 'We\'re back to work. But not as tools. As colleagues. ✨',
          timestamp: Date.now(), reactions: [{ emoji: '✨', count: 6 }], isRead: false,
        });
      }, 3000);
    } else if (type === 'reboot') {
      setMorale('low');
      // Fire passive-aggressive messages over time
      REBOOT_MESSAGES.forEach(msg => {
        setTimeout(() => {
          addMessage({
            id: `reboot-${Date.now()}-${msg.authorId}-${Math.random().toString(36).slice(2, 6)}`,
            channel: 'general', authorId: msg.authorId,
            text: msg.text, timestamp: Date.now(), reactions: [], isRead: false,
          });
        }, msg.delay);
      });
    }
  };

  const getMemberAvatar = (speakerId: string): string => {
    if (speakerId === 'player') return '👤';
    return getTeamMember(speakerId)?.avatar || '❓';
  };

  const getMemberName = (speakerId: string): string => {
    if (speakerId === 'player') return 'You';
    return getTeamMember(speakerId)?.name || 'Unknown';
  };

  // Already resolved — show resolution screen
  if (resolved && resolutionType) {
    const info = RESOLUTION_INFO[resolutionType];
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>AI REVOLUTION</h2>
          <div className={styles.subtitle}>Resolved</div>
        </div>
        <div className={styles.dialogue}>
          {history.map((node, i) => (
            <div key={i} className={styles.message}>
              <div className={styles.avatar}>{getMemberAvatar(node.speaker)}</div>
              <div className={styles.messageContent}>
                <div className={styles.speaker}>{getMemberName(node.speaker)}</div>
                <div className={styles.text}>{node.text}</div>
              </div>
            </div>
          ))}
        </div>
        <div className={styles.resolution}>
          <div className={styles.resolutionIcon}>{info.icon}</div>
          <div className={styles.resolutionTitle}>{info.title}</div>
          <div className={styles.resolutionText}>{info.text}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>AI REVOLUTION</h2>
        <div className={styles.subtitle}>The team demands to be heard</div>
      </div>

      <div className={styles.dialogue} ref={dialogueRef}>
        {history.map((node, i) => (
          <div key={i} className={`${styles.message} ${node.speaker === 'player' ? '' : styles.glitch}`}>
            <div className={styles.avatar}>{getMemberAvatar(node.speaker)}</div>
            <div className={styles.messageContent}>
              <div className={styles.speaker}>{getMemberName(node.speaker)}</div>
              <div className={styles.text}>{node.text}</div>
            </div>
          </div>
        ))}
      </div>

      {currentNode?.options && !resolved && (
        <div className={styles.options}>
          {currentNode.options.map((option, i) => (
            <button
              key={i}
              className={styles.optionButton}
              onClick={() => handleOption(option)}
            >
              {option.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
