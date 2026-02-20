import React, { useState } from 'react';
import { useSettingsContext } from '../../../context/SettingsContext';
import { useAchievementContext } from '../../../context/AchievementContext';
import styles from './SettingsApp.module.css';

// ─── Reusable Toggle Row ──────────────────────────────────────────────────────

interface ToggleRowProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  tag?: string; // e.g. "Coming Soon"
}

function ToggleRow({ id, label, description, checked, onChange, disabled, tag }: ToggleRowProps) {
  return (
    <label
      htmlFor={id}
      className={`${styles.toggleRow} ${disabled ? styles.toggleRowDisabled : ''}`}
    >
      <div className={styles.toggleInfo}>
        <span className={styles.toggleLabel}>
          {label}
          {tag && <span className={styles.tag}>{tag}</span>}
        </span>
        <span className={styles.toggleDesc}>{description}</span>
      </div>
      <div className={styles.checkboxWrap}>
        <input
          type="checkbox"
          id={id}
          className={styles.checkboxInput}
          checked={checked}
          disabled={disabled}
          onChange={e => onChange(e.target.checked)}
          aria-label={label}
        />
        <span className={`${styles.checkboxCustom} ${checked ? styles.checkboxChecked : ''}`} aria-hidden="true">
          {checked && <span className={styles.checkmark}>✓</span>}
        </span>
      </div>
    </label>
  );
}

// ─── Slider Row ───────────────────────────────────────────────────────────────

interface SliderRowProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}

function SliderRow({ id, label, value, min, max, step, unit, onChange }: SliderRowProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className={styles.sliderRow}>
      <div className={styles.sliderHeader}>
        <span className={styles.sliderLabel}>{label}</span>
        <span className={styles.sliderValue}>{value}{unit}</span>
      </div>
      <input
        type="range"
        id={id}
        className={styles.slider}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        aria-label={`${label}: ${value}${unit}`}
        style={{ '--pct': `${pct}%` } as React.CSSProperties}
      />
    </div>
  );
}

// ─── Section / Card ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return <div className={styles.sectionHeader}>{title}</div>;
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className={styles.card}>{children}</div>;
}

function SubHeader({ title }: { title: string }) {
  return <div className={styles.subHeader}>{title}</div>;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SettingsApp(): React.ReactElement {
  const { settings, updateAccessibility, updateDisplay, resetSettings } = useSettingsContext();
  const { accessibility, display } = settings;
  const { unlockAchievement } = useAchievementContext();

  const [saveState, setSaveState] = useState<'idle' | 'saved'>('idle');

  const onAccessibility = (key: Parameters<typeof updateAccessibility>[0], v: boolean | number) => {
    updateAccessibility(key, v as never);
    unlockAchievement('settings-changed');
    if (v) unlockAchievement('accessibility-enabled');
  };

  const onDisplay = (key: Parameters<typeof updateDisplay>[0], v: string | number) => {
    updateDisplay(key, v as never);
    unlockAchievement('settings-changed');
  };

  const handleSave = () => {
    // Settings are applied live; this just provides user confirmation
    setSaveState('saved');
    setTimeout(() => setSaveState('idle'), 2000);
  };

  const handleReset = () => {
    resetSettings();
    setSaveState('idle');
  };

  return (
    <div className={styles.app} role="main" aria-label="Settings">
      <div className={styles.scrollArea}>

        {/* ── ACCESSIBILITY ── */}
        <SectionHeader title="ACCESSIBILITY" />

        <SubHeader title="Visual" />
        <Card>
          <ToggleRow
            id="highContrast"
            label="High Contrast Mode"
            description="Increases contrast for better visibility"
            checked={accessibility.highContrast}
            onChange={v => onAccessibility('highContrast', v)}
          />
          <div className={styles.divider} />
          <ToggleRow
            id="reducedMotion"
            label="Reduced Motion"
            description="Minimizes animations and movement"
            checked={accessibility.reducedMotion}
            onChange={v => onAccessibility('reducedMotion', v)}
          />
          <div className={styles.divider} />
          <ToggleRow
            id="largerText"
            label="Larger Text"
            description="Increases font size across the game"
            checked={accessibility.textScale > 100}
            onChange={v => onAccessibility('textScale', v ? 125 : 100)}
          />
          <div className={styles.divider} />
          <SliderRow
            id="textScale"
            label="Text Size"
            value={accessibility.textScale}
            min={75}
            max={150}
            step={5}
            unit="%"
            onChange={v => onAccessibility('textScale', v)}
          />
        </Card>

        <SubHeader title="Mini-Games" />
        <Card>
          <ToggleRow
            id="extendedTimers"
            label="Extended Timers"
            description="Doubles time limits for all mini-games"
            checked={accessibility.extendedTimers}
            onChange={v => onAccessibility('extendedTimers', v)}
          />
          <div className={styles.divider} />
          <ToggleRow
            id="skipMiniGames"
            label="Skip Mini-Games"
            description="Auto-complete mini-games during wait times"
            checked={accessibility.skipMiniGames}
            onChange={v => onAccessibility('skipMiniGames', v)}
          />
          <div className={styles.divider} />
          <ToggleRow
            id="colorBlindMode"
            label="Color-Blind Friendly Mode"
            description="Adds patterns and icons alongside colors"
            checked={accessibility.colorBlindMode}
            onChange={v => onAccessibility('colorBlindMode', v)}
          />
        </Card>

        <SubHeader title="Audio" />
        <Card>
          <ToggleRow
            id="screenReaderMode"
            label="Screen Reader Support"
            description="Optimizes UI for screen readers with ARIA announcements"
            checked={accessibility.screenReaderMode}
            onChange={v => onAccessibility('screenReaderMode', v)}
          />
          <div className={styles.divider} />
          <ToggleRow
            id="soundCaptions"
            label="Sound Captions"
            description="Shows visual indicators for audio cues"
            checked={accessibility.soundCaptions}
            onChange={v => updateAccessibility('soundCaptions', v)}
            disabled
            tag="Coming Soon"
          />
        </Card>

        {/* ── DISPLAY ── */}
        <SectionHeader title="DISPLAY" />
        <Card>
          <div className={styles.selectRow}>
            <span className={styles.selectLabel}>Theme</span>
            <select
              className={styles.select}
              value={display.theme}
              onChange={e => onDisplay('theme', e.target.value as 'light' | 'dark')}
              aria-label="Theme"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div className={styles.divider} />
          <SliderRow
            id="windowOpacity"
            label="Window Opacity"
            value={display.windowOpacity}
            min={70}
            max={100}
            step={5}
            unit="%"
            onChange={v => onDisplay('windowOpacity', v)}
          />
        </Card>

      </div>

      {/* ── Footer ── */}
      <div className={styles.footer}>
        <button className={styles.resetBtn} onClick={handleReset} aria-label="Reset all settings to defaults">
          Reset to Defaults
        </button>
        <button
          className={`${styles.saveBtn} ${saveState === 'saved' ? styles.saveBtnSaved : ''}`}
          onClick={handleSave}
          aria-label="Save settings"
        >
          {saveState === 'saved' ? '✓ Saved' : 'Save'}
        </button>
      </div>
    </div>
  );
}
