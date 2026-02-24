import React, { useMemo } from 'react';
import { hapticTap } from '../../../utils/haptics';
import styles from './MobileCommandBar.module.css';

const ALL_COMMANDS = [
  'help', 'status', 'brief', 'team', 'list',
  'build', 'run', 'delete', 'clear',
];

const AUTO_EXECUTE = new Set(['help', 'status', 'clear', 'brief', 'team', 'list']);

const CATEGORIES = [
  { label: 'Quick', commands: ['help', 'status', 'clear'] },
  { label: 'Campaign', commands: ['brief', 'team', 'list'] },
  { label: 'Tools', commands: ['build', 'run', 'delete'] },
];

interface MobileCommandBarProps {
  inputValue: string;
  onSelectCommand: (command: string) => void;
  onExecuteCommand: (command: string) => void;
  toolNames: string[];
}

export default function MobileCommandBar({
  inputValue,
  onSelectCommand,
  onExecuteCommand,
  toolNames,
}: MobileCommandBarProps): React.ReactElement {
  const trimmed = inputValue.trim().toLowerCase();

  const suggestions = useMemo(() => {
    if (!trimmed) return null; // Use categories instead

    const matches: string[] = [];

    for (const cmd of ALL_COMMANDS) {
      if (cmd.startsWith(trimmed) && cmd !== trimmed) {
        matches.push(cmd);
      }
    }

    if (trimmed.startsWith('run ') || trimmed.startsWith('delete ')) {
      const prefix = trimmed.split(' ')[0] + ' ';
      const partial = trimmed.slice(prefix.length);
      for (const name of toolNames) {
        if (!partial || name.toLowerCase().startsWith(partial)) {
          matches.push(`${prefix}${name}`);
        }
      }
    } else {
      for (const name of toolNames) {
        if (name.toLowerCase().startsWith(trimmed)) {
          matches.push(`run ${name}`);
        }
      }
    }

    return matches.slice(0, 8);
  }, [trimmed, toolNames]);

  const handleTap = (cmd: string) => {
    hapticTap();
    if (AUTO_EXECUTE.has(cmd)) {
      onExecuteCommand(cmd);
    } else {
      onSelectCommand(cmd);
    }
  };

  // When input is empty, show categorized pills
  if (!trimmed) {
    return (
      <div className={styles.commandBar}>
        <div className={styles.commandScroll}>
          {CATEGORIES.map(cat => (
            <React.Fragment key={cat.label}>
              <span className={styles.categoryLabel}>{cat.label}</span>
              {cat.commands.map(cmd => (
                <button
                  key={cmd}
                  className={styles.commandPill}
                  onClick={() => handleTap(cmd)}
                  type="button"
                >
                  {cmd}
                </button>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  // When typing, show filtered suggestions
  if (!suggestions || suggestions.length === 0) return <></>;

  return (
    <div className={styles.commandBar}>
      <div className={styles.commandScroll}>
        {suggestions.map((cmd) => (
          <button
            key={cmd}
            className={styles.commandPill}
            onClick={() => handleTap(cmd)}
            type="button"
          >
            {cmd}
          </button>
        ))}
      </div>
    </div>
  );
}
