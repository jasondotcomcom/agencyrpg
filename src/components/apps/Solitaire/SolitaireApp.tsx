import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAchievementContext } from '../../../context/AchievementContext';
import styles from './SolitaireApp.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
type Color = 'red' | 'black';

interface Card {
  suit: Suit;
  rank: number; // 1=A, 2-10, 11=J, 12=Q, 13=K
  faceUp: boolean;
  id: string;
}

interface DragState {
  cards: Card[];
  sourceType: 'tableau' | 'waste';
  sourceIndex: number;
  offsetX: number;
  offsetY: number;
}

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const DRAG_THRESHOLD = 5;

function suitColor(s: Suit): Color {
  return s === 'hearts' || s === 'diamonds' ? 'red' : 'black';
}

function suitSymbol(s: Suit): string {
  return { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }[s];
}

function rankLabel(r: number): string {
  if (r === 1) return 'A';
  if (r === 11) return 'J';
  if (r === 12) return 'Q';
  if (r === 13) return 'K';
  return String(r);
}

function makeDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({ suit, rank, faceUp: false, id: `${suit}-${rank}` });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function getXY(e: MouseEvent | TouchEvent): { clientX: number; clientY: number } {
  if ('touches' in e) {
    const t = e.touches[0] || e.changedTouches[0];
    return { clientX: t.clientX, clientY: t.clientY };
  }
  return { clientX: e.clientX, clientY: e.clientY };
}

// ─── Win Animation (bouncing cards) ──────────────────────────────────────────

interface BouncingCard {
  card: Card;
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
}

function WinAnimation({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    const W = canvas.width;
    const H = canvas.height;
    const CARD_W = 50;
    const CARD_H = 70;
    const GRAVITY = 0.5;
    const BOUNCE = 0.7;
    const SPAWN_INTERVAL = 12;

    const allCards: Card[] = [];
    for (let rank = 13; rank >= 1; rank--) {
      for (const suit of SUITS) {
        allCards.push({ suit, rank, faceUp: true, id: `${suit}-${rank}` });
      }
    }

    const pileSpacing = Math.min((CARD_W + 16), (W - 40) / 4);
    const pilesStartX = W - 4 * pileSpacing - 10;
    const pilePositions = SUITS.map((_, i) => pilesStartX + i * pileSpacing);

    const activeCards: BouncingCard[] = [];
    let spawnIndex = 0;
    let frameCount = 0;
    let animId: number;

    const trailCanvas = document.createElement('canvas');
    trailCanvas.width = W;
    trailCanvas.height = H;
    const trailCtx = trailCanvas.getContext('2d')!;

    const drawCard = (ctx: CanvasRenderingContext2D, card: Card, x: number, y: number) => {
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x, y, CARD_W, CARD_H, 4);
      ctx.fill();
      ctx.stroke();
      const color = suitColor(card.suit) === 'red' ? '#e74c3c' : '#2c3e50';
      ctx.fillStyle = color;
      ctx.font = 'bold 14px Quicksand, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(rankLabel(card.rank), x + 4, y + 16);
      ctx.font = '16px serif';
      ctx.fillText(suitSymbol(card.suit), x + 4, y + 34);
    };

    const loop = () => {
      frameCount++;
      if (frameCount % SPAWN_INTERVAL === 0 && spawnIndex < allCards.length) {
        const card = allCards[spawnIndex];
        const pileIndex = SUITS.indexOf(card.suit);
        const startX = pilePositions[pileIndex];
        const baseVx = (pileIndex < 2 ? -1 : 1) * (2 + Math.random() * 3);
        const vx = baseVx + (Math.random() - 0.5) * 2;
        activeCards.push({ card, x: startX, y: 10, vx, vy: 0, active: true });
        spawnIndex++;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(trailCanvas, 0, 0);
      for (const bc of activeCards) {
        if (!bc.active) continue;
        drawCard(trailCtx, bc.card, bc.x, bc.y);
        bc.vy += GRAVITY;
        bc.x += bc.vx;
        bc.y += bc.vy;
        if (bc.y + CARD_H >= H) {
          bc.y = H - CARD_H;
          bc.vy = -Math.abs(bc.vy) * BOUNCE;
          if (Math.abs(bc.vy) < 1) {
            bc.active = false;
            drawCard(trailCtx, bc.card, bc.x, bc.y);
            continue;
          }
        }
        if (bc.x > W + CARD_W || bc.x < -CARD_W * 2) {
          bc.active = false;
          continue;
        }
        drawCard(ctx, bc.card, bc.x, bc.y);
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [containerRef]);

  return <canvas ref={canvasRef} className={styles.winCanvas} />;
}

// ─── Game Component ──────────────────────────────────────────────────────────

export default function SolitaireApp() {
  const { unlockAchievement } = useAchievementContext();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const floatingRef = useRef<HTMLDivElement | null>(null);
  const startTimeRef = useRef(Date.now());

  // Game state
  const [stock, setStock] = useState<Card[]>([]);
  const [waste, setWaste] = useState<Card[]>([]);
  const [foundations, setFoundations] = useState<Card[][]>([[], [], [], []]);
  const [tableau, setTableau] = useState<Card[][]>([[], [], [], [], [], [], []]);
  const [won, setWon] = useState(false);

  // Drag state
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);

  // Keep latest game state in refs for event handlers
  const stateRef = useRef({ stock, waste, foundations, tableau, dragState });
  stateRef.current = { stock, waste, foundations, tableau, dragState };

  // Initialize game
  const initGame = useCallback(() => {
    const deck = makeDeck();
    const tab: Card[][] = [[], [], [], [], [], [], []];
    let idx = 0;
    for (let col = 0; col < 7; col++) {
      for (let row = 0; row <= col; row++) {
        const card = { ...deck[idx++] };
        card.faceUp = row === col;
        tab[col].push(card);
      }
    }
    const remaining = deck.slice(idx).map(c => ({ ...c, faceUp: false }));
    setStock(remaining);
    setWaste([]);
    setFoundations([[], [], [], []]);
    setTableau(tab);
    setWon(false);
    setDragState(null);
    setDragPos(null);
    setIsDragging(false);
    startTimeRef.current = Date.now();
  }, []);

  useEffect(() => { initGame(); }, [initGame]);

  // Check win
  useEffect(() => {
    if (foundations.every(f => f.length === 13) && !won) {
      setWon(true);
      unlockAchievement('solitaire-champion');
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      if (elapsed < 180) unlockAchievement('card-shark');
    }
  }, [foundations, won, unlockAchievement]);

  // ─── Draw 3 from stock ──────────────────────────────────────────────────────

  const drawCards = useCallback(() => {
    if (stock.length === 0) {
      setStock(waste.map(c => ({ ...c, faceUp: false })).reverse());
      setWaste([]);
    } else {
      const count = Math.min(3, stock.length);
      const drawn = stock.slice(-count).map(c => ({ ...c, faceUp: true }));
      setStock(prev => prev.slice(0, -count));
      setWaste(prev => [...prev, ...drawn]);
    }
  }, [stock, waste]);

  // ─── Foundation helper ──────────────────────────────────────────────────────

  const tryFoundation = useCallback((card: Card): number | null => {
    for (let i = 0; i < 4; i++) {
      const pile = foundations[i];
      if (pile.length === 0 && card.rank === 1) return i;
      if (pile.length > 0) {
        const top = pile[pile.length - 1];
        if (top.suit === card.suit && card.rank === top.rank + 1) return i;
      }
    }
    return null;
  }, [foundations]);

  // ─── Double-click: auto-move to foundation ─────────────────────────────────

  const handleTableauDoubleClick = useCallback((colIdx: number) => {
    const col = tableau[colIdx];
    if (col.length === 0) return;
    const card = col[col.length - 1];
    if (!card.faceUp) return;

    const fi = tryFoundation(card);
    if (fi !== null) {
      setFoundations(prev => {
        const next = prev.map(p => [...p]);
        next[fi].push(card);
        return next;
      });
      setTableau(prev => {
        const next = prev.map(p => [...p]);
        next[colIdx] = next[colIdx].slice(0, -1);
        const newCol = next[colIdx];
        if (newCol.length > 0 && !newCol[newCol.length - 1].faceUp) {
          newCol[newCol.length - 1] = { ...newCol[newCol.length - 1], faceUp: true };
        }
        return next;
      });
    }
  }, [tableau, tryFoundation]);

  const handleWasteDoubleClick = useCallback(() => {
    if (waste.length === 0) return;
    const card = waste[waste.length - 1];

    const fi = tryFoundation(card);
    if (fi !== null) {
      setFoundations(prev => {
        const next = prev.map(p => [...p]);
        next[fi].push(card);
        return next;
      });
      setWaste(prev => prev.slice(0, -1));
      return;
    }

    // Try tableau
    for (let col = 0; col < 7; col++) {
      const colCards = tableau[col];
      if (colCards.length === 0 && card.rank === 13) {
        setTableau(prev => {
          const next = prev.map(p => [...p]);
          next[col].push({ ...card, faceUp: true });
          return next;
        });
        setWaste(prev => prev.slice(0, -1));
        return;
      }
      if (colCards.length > 0) {
        const top = colCards[colCards.length - 1];
        if (top.faceUp && suitColor(top.suit) !== suitColor(card.suit) && card.rank === top.rank - 1) {
          setTableau(prev => {
            const next = prev.map(p => [...p]);
            next[col].push({ ...card, faceUp: true });
            return next;
          });
          setWaste(prev => prev.slice(0, -1));
          return;
        }
      }
    }
  }, [waste, tableau, tryFoundation]);

  // ─── Drag and Drop ──────────────────────────────────────────────────────────

  const beginDrag = useCallback((
    cards: Card[],
    sourceType: 'tableau' | 'waste',
    sourceIndex: number,
    clientX: number,
    clientY: number,
    el: Element,
  ) => {
    const rect = el.getBoundingClientRect();
    setDragState({
      cards,
      sourceType,
      sourceIndex,
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top,
    });
    setDragPos({ x: clientX, y: clientY });
    dragStartPos.current = { x: clientX, y: clientY };
    isDraggingRef.current = false;
  }, []);

  // Tableau card mouse/touch down
  const handleCardPointerDown = useCallback((
    e: React.MouseEvent | React.TouchEvent,
    colIdx: number,
    cardIdx: number,
  ) => {
    const col = tableau[colIdx];
    const card = col[cardIdx];
    if (!card.faceUp) return;

    const { clientX, clientY } = 'touches' in e
      ? { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }
      : { clientX: e.clientX, clientY: e.clientY };

    const cards = col.slice(cardIdx);
    beginDrag(cards, 'tableau', colIdx, clientX, clientY, e.currentTarget);
    e.preventDefault();
  }, [tableau, beginDrag]);

  // Waste card mouse/touch down
  const handleWastePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (waste.length === 0) return;
    const card = waste[waste.length - 1];

    const { clientX, clientY } = 'touches' in e
      ? { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }
      : { clientX: e.clientX, clientY: e.clientY };

    beginDrag([card], 'waste', 0, clientX, clientY, e.currentTarget);
    e.preventDefault();
  }, [waste, beginDrag]);

  // Execute a validated drop
  const executeMove = useCallback((
    ds: DragState,
    targetType: 'foundation' | 'tableau',
    targetIndex: number,
  ) => {
    const { cards: dragCards, sourceType, sourceIndex } = ds;

    if (targetType === 'foundation') {
      setFoundations(prev => {
        const next = prev.map(p => [...p]);
        next[targetIndex].push(dragCards[0]);
        return next;
      });
    }

    if (targetType === 'tableau') {
      setTableau(prev => {
        const next = prev.map(p => [...p]);
        // Remove from source if tableau
        if (sourceType === 'tableau') {
          const srcCol = next[sourceIndex];
          next[sourceIndex] = srcCol.slice(0, srcCol.length - dragCards.length);
          const newSrc = next[sourceIndex];
          if (newSrc.length > 0 && !newSrc[newSrc.length - 1].faceUp) {
            newSrc[newSrc.length - 1] = { ...newSrc[newSrc.length - 1], faceUp: true };
          }
        }
        next[targetIndex] = [...next[targetIndex], ...dragCards.map(c => ({ ...c, faceUp: true }))];
        return next;
      });
    }

    if (targetType === 'foundation' && sourceType === 'tableau') {
      setTableau(prev => {
        const next = prev.map(p => [...p]);
        next[sourceIndex] = next[sourceIndex].slice(0, -1);
        const newSrc = next[sourceIndex];
        if (newSrc.length > 0 && !newSrc[newSrc.length - 1].faceUp) {
          newSrc[newSrc.length - 1] = { ...newSrc[newSrc.length - 1], faceUp: true };
        }
        return next;
      });
    }

    if (sourceType === 'waste') {
      setWaste(prev => prev.slice(0, -1));
    }
  }, []);

  // Global drag move + drop listeners
  useEffect(() => {
    if (!dragState) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const { clientX, clientY } = getXY(e);
      setDragPos({ x: clientX, y: clientY });

      if (!isDraggingRef.current && dragStartPos.current) {
        const dx = clientX - dragStartPos.current.x;
        const dy = clientY - dragStartPos.current.y;
        if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
          isDraggingRef.current = true;
          setIsDragging(true);
        }
      }
    };

    const handleUp = (e: MouseEvent | TouchEvent) => {
      const { clientX, clientY } = getXY(e);
      const ds = stateRef.current.dragState;

      if (!ds) {
        setDragState(null);
        setDragPos(null);
        return;
      }

      if (isDraggingRef.current) {
        // Hide floating to find element underneath
        const floating = floatingRef.current;
        if (floating) floating.style.visibility = 'hidden';
        const el = document.elementFromPoint(clientX, clientY);
        if (floating) floating.style.visibility = '';

        const target = (el as HTMLElement)?.closest('[data-drop]') as HTMLElement | null;
        const dropId = target?.dataset.drop;
        let moved = false;

        if (dropId) {
          const { foundations: founds, tableau: tab } = stateRef.current;

          if (dropId.startsWith('foundation-') && ds.cards.length === 1) {
            const fi = parseInt(dropId.split('-')[1]);
            const card = ds.cards[0];
            const pile = founds[fi];
            let valid = false;
            if (pile.length === 0 && card.rank === 1) valid = true;
            if (pile.length > 0 && pile[pile.length - 1].suit === card.suit && card.rank === pile[pile.length - 1].rank + 1) valid = true;
            if (valid) {
              executeMove(ds, 'foundation', fi);
              moved = true;
            }
          } else if (dropId.startsWith('tableau-')) {
            const colIdx = parseInt(dropId.split('-')[1]);
            // Don't drop on same source column
            if (!(ds.sourceType === 'tableau' && ds.sourceIndex === colIdx)) {
              const destCol = tab[colIdx];
              const firstDrag = ds.cards[0];
              let valid = false;
              if (destCol.length === 0 && firstDrag.rank === 13) {
                valid = true;
              } else if (destCol.length > 0) {
                const top = destCol[destCol.length - 1];
                if (top.faceUp && suitColor(top.suit) !== suitColor(firstDrag.suit) && firstDrag.rank === top.rank - 1) {
                  valid = true;
                }
              }
              if (valid) {
                executeMove(ds, 'tableau', colIdx);
                moved = true;
              }
            }
          }
        }
        void moved; // drop silently fails if invalid
      }

      setDragState(null);
      setDragPos(null);
      isDraggingRef.current = false;
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [dragState, executeMove]);

  // Double-tap detection for mobile
  const lastTapRef = useRef<{ time: number; id: string }>({ time: 0, id: '' });

  const checkDoubleTap = useCallback((tapId: string, handler: () => void): boolean => {
    const now = Date.now();
    if (now - lastTapRef.current.time < 350 && lastTapRef.current.id === tapId) {
      // Cancel any pending drag from first tap
      setDragState(null);
      setDragPos(null);
      isDraggingRef.current = false;
      setIsDragging(false);
      handler();
      lastTapRef.current = { time: 0, id: '' };
      return true;
    }
    lastTapRef.current = { time: now, id: tapId };
    return false;
  }, []);

  // Set of card IDs currently being dragged (for visual hiding in source)
  const draggingIds = new Set(isDragging && dragState ? dragState.cards.map(c => c.id) : []);

  // Waste visible cards (top 3 for draw-3 fan display)
  const wasteVisible = waste.slice(-3);

  if (won) {
    return (
      <div ref={containerRef} className={styles.container}>
        <WinAnimation containerRef={containerRef} />
        <div className={styles.winOverlay}>
          <div className={styles.winText}>You Win!</div>
          <button className={styles.newGameBtn} onClick={initGame}>Play Again</button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={styles.container}>
      {/* Top row: stock, waste, foundations */}
      <div className={styles.topRow}>
        {/* Stock */}
        <div className={styles.cardSlot} onClick={drawCards}>
          {stock.length > 0 ? (
            <div className={styles.cardBack}>
              <span className={styles.cardBackDesign}>✦</span>
            </div>
          ) : (
            <div className={styles.emptySlot}>↺</div>
          )}
        </div>

        {/* Waste — show up to 3 cards fanned */}
        <div className={styles.wasteSlot}>
          {wasteVisible.length === 0 && <div className={styles.emptySlot} />}
          {wasteVisible.map((card, i) => {
            const isTop = i === wasteVisible.length - 1;
            const hidden = isTop && draggingIds.has(card.id);
            return (
              <div
                key={card.id}
                className={`${styles.wasteCard} ${hidden ? styles.cardGhost : ''}`}
                style={{ left: i * 16 }}
                onMouseDown={isTop ? (e) => {
                  if (!checkDoubleTap('waste', handleWasteDoubleClick)) {
                    handleWastePointerDown(e);
                  }
                } : undefined}
                onTouchStart={isTop ? (e) => {
                  if (!checkDoubleTap('waste', handleWasteDoubleClick)) {
                    handleWastePointerDown(e);
                  }
                } : undefined}
                onDoubleClick={isTop ? handleWasteDoubleClick : undefined}
              >
                <CardView card={card} />
              </div>
            );
          })}
        </div>

        <div className={styles.topSpacer} />

        {/* Foundations */}
        {foundations.map((pile, i) => (
          <div
            key={i}
            className={styles.cardSlot}
            data-drop={`foundation-${i}`}
          >
            {pile.length > 0 ? (
              <CardView card={pile[pile.length - 1]} />
            ) : (
              <div className={styles.emptySlot}>
                <span className={styles.foundationHint}>{suitSymbol(SUITS[i])}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tableau */}
      <div className={styles.tableauRow}>
        {tableau.map((col, colIdx) => (
          <div
            key={colIdx}
            className={styles.tableauCol}
            data-drop={`tableau-${colIdx}`}
          >
            {col.length === 0 ? (
              <div className={styles.emptySlot}>K</div>
            ) : (
              col.map((card, cardIdx) => {
                const hidden = draggingIds.has(card.id);
                return (
                  <div
                    key={card.id}
                    className={`${styles.tableauCard} ${hidden ? styles.cardGhost : ''}`}
                    style={{ top: cardIdx * (card.faceUp ? 22 : 8) }}
                    onMouseDown={card.faceUp ? (e) => {
                      const tapId = `tab-${colIdx}-${cardIdx}`;
                      const isLast = cardIdx === col.length - 1;
                      if (isLast && checkDoubleTap(tapId, () => handleTableauDoubleClick(colIdx))) return;
                      handleCardPointerDown(e, colIdx, cardIdx);
                    } : undefined}
                    onTouchStart={card.faceUp ? (e) => {
                      const tapId = `tab-${colIdx}-${cardIdx}`;
                      const isLast = cardIdx === col.length - 1;
                      if (isLast && checkDoubleTap(tapId, () => handleTableauDoubleClick(colIdx))) return;
                      handleCardPointerDown(e, colIdx, cardIdx);
                    } : undefined}
                    onDoubleClick={cardIdx === col.length - 1 ? () => handleTableauDoubleClick(colIdx) : undefined}
                  >
                    {card.faceUp ? (
                      <CardView card={card} />
                    ) : (
                      <div className={styles.cardBack}>
                        <span className={styles.cardBackDesign}>✦</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ))}
      </div>

      {/* Floating drag overlay */}
      {dragState && dragPos && isDragging && (
        <div
          ref={floatingRef}
          className={styles.floatingCards}
          style={{
            left: dragPos.x - dragState.offsetX,
            top: dragPos.y - dragState.offsetY,
          }}
        >
          {dragState.cards.map((card, i) => (
            <div key={card.id} className={styles.floatingCard} style={{ top: i * 22 }}>
              <CardView card={card} />
            </div>
          ))}
        </div>
      )}

      <button className={styles.newGameBtnSmall} onClick={initGame}>New Deal</button>
    </div>
  );
}

// ─── Card View ────────────────────────────────────────────────────────────────

function CardView({ card }: { card: Card }) {
  const isRed = suitColor(card.suit) === 'red';
  return (
    <div className={`${styles.card} ${isRed ? styles.cardRed : styles.cardBlack}`}>
      <div className={styles.cardRank}>{rankLabel(card.rank)}</div>
      <div className={styles.cardSuit}>{suitSymbol(card.suit)}</div>
      <div className={styles.cardCenter}>{suitSymbol(card.suit)}</div>
    </div>
  );
}
