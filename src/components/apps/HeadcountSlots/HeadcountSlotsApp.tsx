// ─── Headcount Slots ──────────────────────────────────────────────────────────
// AI3.0's "complimentary spins." The reels are your team. Every cut pays out
// like a jackpot, swaps a face for a 🤖, and pays a little less than the last.
// Once every reel is AI, every pull wins. Every win pays $12.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLayoffsContext } from '../../../context/LayoffsContext';
import { useAchievementContext } from '../../../context/AchievementContext';
import { useWindowContext } from '../../../context/WindowContext';
import { teamMembers } from '../../../data/team';
import { CORE_ROLES, currentMargin, updateLayoffs } from '../../../utils/layoffsStore';
import {
  AI_ONLY_PAYOUT, BASE_PAYOUTS, CONSOLATION_CHIP, FIRST_NAMES, LINKEDIN_POST,
} from '../../../data/layoffsDialogue';
import styles from './HeadcountSlotsApp.module.css';

type Sym = { kind: 'person'; id: string; glyph: string } | { kind: 'ai'; glyph: string } | { kind: 'golden'; glyph: string };

interface Offer {
  id: string;
  payout: number;
  tags: string[];
}

const SPIN_TICK_MS = 70;
const STOP_TIMES = [900, 1350, 1850];

// ─── Tiny casino audio (WebAudio, no assets) ──────────────────────────────────

let audioCtx: AudioContext | null = null;
function blip(freq: number, ms = 60, type: OscillatorType = 'square', gain = 0.03) {
  try {
    audioCtx = audioCtx ?? new AudioContext();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = gain;
    o.connect(g).connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + ms / 1000);
  } catch { /* audio unavailable */ }
}
function fanfare() {
  [523, 659, 784, 1046, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 120, 'triangle', 0.05), i * 110));
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HeadcountSlotsApp() {
  const { layoffs, streamline, payoutSpin } = useLayoffsContext();
  const { unlockAchievement } = useAchievementContext();
  const { addNotification } = useWindowContext();

  const [reels, setReels] = useState<Sym[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [banner, setBanner] = useState<string>('');
  const [nearMiss, setNearMiss] = useState(false);
  const [coins, setCoins] = useState<number[]>([]);
  const [linkedIn, setLinkedIn] = useState<string | null>(null);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [muted, setMuted] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(t => clearTimeout(t as ReturnType<typeof setTimeout>)), []);

  const cutCount = layoffs.cut.length;
  const allGone = cutCount >= CORE_ROLES.length;

  // The strip: real faces for people who are still here, 🤖 for anyone cut,
  // and a Golden AI wild that shows up more the more you cut.
  const strip = useMemo<Sym[]>(() => {
    const syms: Sym[] = CORE_ROLES.map(id => {
      if (layoffs.cut.includes(id)) return { kind: 'ai', glyph: '🤖' } as Sym;
      const m = teamMembers.find(t => t.id === id);
      return { kind: 'person', id, glyph: m?.avatar ?? '👤' } as Sym;
    });
    for (let i = 0; i < 1 + Math.floor(cutCount / 2); i++) syms.push({ kind: 'golden', glyph: '🌟' });
    return syms;
  }, [layoffs.cut, cutCount]);

  // Before the first pull, show the first three faces on the strip
  const shownReels = reels.length > 0 ? reels : [strip[0], strip[1 % strip.length], strip[2 % strip.length]];

  const randomSym = useCallback(() => strip[Math.floor(Math.random() * strip.length)], [strip]);

  const sound = useCallback((fn: () => void) => { if (!muted) fn(); }, [muted]);

  const rain = useCallback((n: number) => {
    setCoins(Array.from({ length: n }, (_, i) => i + Date.now()));
    const t = setTimeout(() => setCoins([]), 2200);
    timers.current.push(t);
  }, []);

  const evaluate = useCallback((final: Sym[]) => {
    const persons = final.filter((s): s is Extract<Sym, { kind: 'person' }> => s.kind === 'person');
    const golden = final.filter(s => s.kind === 'golden').length;

    // Every reel is AI. Every pull wins. Every win pays $12.
    if (persons.length === 0) {
      const amount = AI_ONLY_PAYOUT * (golden > 0 ? 2 : 1);
      payoutSpin(amount, 'Headcount Slots win');
      updateLayoffs(s => ({ efficiencyPoints: s.efficiencyPoints + 1 }));
      setLastWin(amount);
      setBanner(golden > 0 ? '🌟 GOLDEN AI 🌟 WINNER!!' : '🎉 WINNER!! 🎉');
      sound(fanfare);
      rain(14);
      return;
    }

    // Who's the target? Most frequent face, center reel breaks ties.
    const counts = new Map<string, number>();
    persons.forEach(p => counts.set(p.id, (counts.get(p.id) ?? 0) + 1));
    const center = final[1].kind === 'person' ? final[1].id : null;
    let target = persons[0].id;
    counts.forEach((c, id) => {
      const best = counts.get(target) ?? 0;
      if (c > best || (c === best && id === center)) target = id;
    });
    const matches = (counts.get(target) ?? 1) + golden;

    let mult = 1;
    const tags: string[] = [];
    if (matches >= 3) { mult = 10; tags.push('SYNERGY 10x'); }
    else if (matches === 2) { mult = 2; tags.push('2x'); }
    if (golden > 0) { mult += 3; tags.push('🌟 GOLDEN AI +3x'); }
    if (Math.random() < 0.2) { const b = Math.random() < 0.5 ? 2 : 3; mult *= b; tags.push(`BONUS ${b}x`); }
    if (layoffs.streak >= 1) { mult *= 2; tags.push('🔥 HOT STREAK 2x'); }

    // The achievement is for hitting it, whether or not you take the deal.
    if (matches >= 3) unlockAchievement('synergy-jackpot');
    setNearMiss(matches === 2);
    const base = BASE_PAYOUTS[Math.min(cutCount, BASE_PAYOUTS.length - 1)];
    setOffer({ id: target, payout: base * mult, tags });
    sound(() => blip(880, 140, 'triangle', 0.05));
  }, [cutCount, layoffs.streak, payoutSpin, rain, sound, unlockAchievement]);

  const pull = useCallback(() => {
    if (spinning || offer) return;
    setSpinning(true);
    setBanner('');
    setNearMiss(false);
    setLinkedIn(null);
    setLastWin(null);
    updateLayoffs(s => ({ spins: s.spins + 1 }));

    const final: Sym[] = [randomSym(), randomSym(), randomSym()];
    const stopped = [false, false, false];
    const tick = setInterval(() => {
      setReels(prev => (prev.length ? prev : final).map((s, i) => (stopped[i] ? s : randomSym())));
      sound(() => blip(220 + Math.random() * 220, 25, 'square', 0.015));
    }, SPIN_TICK_MS);
    timers.current.push(tick);

    STOP_TIMES.forEach((ms, i) => {
      const t = setTimeout(() => {
        stopped[i] = true;
        setReels(prev => (prev.length ? prev : final).map((s, j) => (j === i ? final[i] : s)));
        sound(() => blip(330, 80, 'triangle', 0.04));
        if (i === STOP_TIMES.length - 1) {
          clearInterval(tick);
          setSpinning(false);
          evaluate(final);
        }
      }, ms);
      timers.current.push(t);
    });
  }, [spinning, offer, randomSym, evaluate, sound]);

  const accept = useCallback(() => {
    if (!offer) return;
    const first = FIRST_NAMES[offer.id] ?? 'them';
    const ok = streamline(offer.id, offer.payout);
    if (!ok) { setOffer(null); return; }
    const points = Math.floor(100 + Math.random() * 900) * (offer.tags.length + 1);
    updateLayoffs(s => ({ efficiencyPoints: s.efficiencyPoints + points }));
    setBanner(offer.tags.includes('SYNERGY 10x') ? '💰 S Y N E R G Y 💰' : '💰 JACKPOT 💰');
    setLastWin(offer.payout);
    setLinkedIn(LINKEDIN_POST(first));
    sound(fanfare);
    rain(28);
    setOffer(null);
  }, [offer, streamline, sound, rain]);

  const decline = useCallback(() => {
    payoutSpin(CONSOLATION_CHIP, 'Consolation chip');
    setLastWin(CONSOLATION_CHIP);
    setBanner('Consolation chip! Spin again?');
    setOffer(null);
    setNearMiss(false);
  }, [payoutSpin]);

  const postLinkedIn = useCallback(() => {
    const reactions = 12 + Math.floor(Math.random() * 300);
    addNotification('💼 Posted to LinkedIn', `${reactions} reactions. 3 people said "Insightful."`);
    setLinkedIn(null);
  }, [addNotification]);

  const offerName = offer ? (teamMembers.find(m => m.id === offer.id)?.name ?? FIRST_NAMES[offer.id]) : '';

  return (
    <div className={styles.container}>
      <div className={styles.marquee}>
        <span className={styles.bulbs} aria-hidden />
        <div className={styles.brand}>AI3.0 presents</div>
        <div className={styles.title}>HEADCOUNT SLOTS</div>
        <div className={styles.sub}>Complimentary spins · Creativity, finally scalable</div>
      </div>

      <div className={styles.stats}>
        <div><span className={styles.statLabel}>Efficiency pts</span><span className={styles.statValue}>{layoffs.efficiencyPoints.toLocaleString()}</span></div>
        <div><span className={styles.statLabel}>Total payout</span><span className={styles.statValue}>${layoffs.totalPayout.toLocaleString()}</span></div>
        <div><span className={styles.statLabel}>Margin</span><span className={styles.statValue}>{currentMargin()}%</span></div>
      </div>

      <div className={styles.machine}>
        <div className={styles.reels}>
          {shownReels.map((s, i) => (
            <div key={i} className={`${styles.reel} ${spinning ? styles.reelSpinning : ''} ${s?.kind === 'golden' ? styles.reelGolden : ''}`}>
              <span className={styles.glyph}>{s?.glyph}</span>
            </div>
          ))}
        </div>

        <button
          className={`${styles.lever} ${!spinning && !offer ? styles.leverReady : ''}`}
          onClick={pull}
          disabled={spinning || !!offer}
          aria-label="Pull the lever"
        >
          <span className={styles.leverKnob} />
          <span className={styles.leverStick} />
        </button>
      </div>

      <div className={styles.feedback}>
        {banner && <div className={styles.banner}>{banner}</div>}
        {lastWin !== null && !offer && <div className={styles.win}>+${lastWin.toLocaleString()}</div>}
        {nearMiss && offer && <div className={styles.nearMiss}>So close to a 3x!</div>}

        {offer && (
          <div className={styles.offer}>
            <div className={styles.offerTags}>
              {offer.tags.map(t => <span key={t} className={styles.tag}>{t}</span>)}
            </div>
            <div className={styles.offerText}>
              Streamline <strong>{offerName}</strong>?
            </div>
            <div className={styles.offerPayout}>Payout: ${offer.payout.toLocaleString()}</div>
            <div className={styles.offerButtons}>
              <button className={styles.declineBtn} onClick={decline}>Not now</button>
              <button className={styles.acceptBtn} onClick={accept}>💰 Streamline</button>
            </div>
          </div>
        )}

        {!offer && !spinning && !banner && (
          <div className={styles.hint}>{allGone ? 'Every pull wins!' : 'Pull the lever. Nobody has to know.'}</div>
        )}

        {linkedIn && (
          <div className={styles.linkedIn}>
            <div className={styles.linkedInHead}>💼 Draft post ready</div>
            <div className={styles.linkedInBody}>{linkedIn}</div>
            <button className={styles.linkedInBtn} onClick={postLinkedIn}>Post</button>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <span>Spins: {layoffs.spins}</span>
        <button className={styles.mute} onClick={() => setMuted(m => !m)}>{muted ? '🔇' : '🔊'}</button>
      </div>

      {coins.map((c, i) => (
        <span key={c} className={styles.coin} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 7) * 0.08}s` }}>🪙</span>
      ))}
    </div>
  );
}
