import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useChatContext } from '../../../context/ChatContext';
import { useAgencyFunds } from '../../../context/AgencyFundsContext';
import { useReputationContext } from '../../../context/ReputationContext';
import { useEndingContext } from '../../../context/EndingContext';
import { useCampaignContext } from '../../../context/CampaignContext';
import { useWindowContext } from '../../../context/WindowContext';
import { usePortfolioContext, type PortfolioEntry } from '../../../context/PortfolioContext';
import { useCheatContext } from '../../../context/CheatContext';
import { useAchievementContext } from '../../../context/AchievementContext';
import { useEmailContext } from '../../../context/EmailContext';
import { AWARD_DEFS } from '../../../data/awards';
import { teamMembers } from '../../../data/team';
import { formatBudget } from '../../../types/campaign';
import styles from './TerminalApp.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AgencyTool {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: string;
  sampleOutput: string;
  createdAt: number;
}

type LineType = 'input' | 'output' | 'error' | 'success' | 'info' | 'ascii' | 'blank' | 'portrait';

interface TerminalLine {
  id: string;
  type: LineType;
  text: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TOOLS_STORAGE_KEY = 'agencyrpg_tools';

// Arrow-key version: ↑↑↓↓←→←→BA
const KONAMI_ARROW_SEQ = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'b', 'a',
];

// Letter version: UUDDLRLRBA
const KONAMI_LETTER_SEQ = ['u', 'u', 'd', 'd', 'l', 'r', 'l', 'r', 'b', 'a'];

const KONAMI_LENGTH = 10;

const BANNER_LINES: Array<[LineType, string]> = [
  ['info',   '╔══════════════════════════════════════════╗'],
  ['info',   '║   ✨ Agency OS Terminal  v1.0            ║'],
  ['info',   '║   Your command center for the hustle     ║'],
  ['info',   '╚══════════════════════════════════════════╝'],
  ['blank',  ''],
  ['output', 'Type "help" to see available commands.'],
  ['blank',  ''],
];

const HELP_TEXT = `Available commands:

  help                  Show this help
  status                Show agency status
  brief                 Show current campaign brief
  team                  Show current campaign team
  list                  List your saved tools
  build [description]   Build a new AI tool
  run [name]            Run a saved tool
  delete [name]         Delete a saved tool
  clear                 Clear the terminal

Tools built here appear in your campaign workspace.
Hidden: Try classic cheat codes for surprises.`;

const KONAMI_REWARD = `
  ╔══════════════════════════════════════════════════╗
  ║  🎮  KONAMI CODE ACTIVATED                      ║
  ║                                                  ║
  ║  You are a true gaming legend.                  ║
  ║  +100 creative XP. The team salutes you.        ║
  ╚══════════════════════════════════════════════════╝`.trim();

// ─── Preset Tools (idkfa unlock) ─────────────────────────────────────────────

const PRESET_TOOLS: AgencyTool[] = [
  {
    id: 'preset-brief_parser',
    name: 'brief_parser',
    icon: '📋',
    description: 'Extracts key insights from client briefs into actionable creative directions.',
    category: 'creative',
    sampleOutput: 'BRIEF ANALYSIS\n\nCore Tension: Client wants prestige appeal without alienating their mid-market audience.\nTarget Insight: 28–42yo professionals who "work hard to enjoy the finer things."\nKey Message Hook: "You\'ve earned it." — reward positioning, not aspiration.\nWhitespace: Emotional territory is wide open. Top competitors skew too technical.\nRed Flag: Timeline is aggressive. Recommend digital-first rollout.',
    createdAt: Date.now(),
  },
  {
    id: 'preset-headline_generator',
    name: 'headline_generator',
    icon: '✍️',
    description: 'Generates 10 on-brand headline options from a product brief.',
    category: 'creative',
    sampleOutput: 'HEADLINE OPTIONS (10)\n\n1. "The One Thing You\'ve Been Waiting For"\n2. "Finally, Something Worth Talking About"\n3. "Less of Everything Else. More of This."\n4. "They Said It Couldn\'t Be Done. They Were Wrong."\n5. "Bold Moves. Bolder Results."\n6. "The [Product] That Earns Its Place."\n7. "We Made It for You. You Made It Possible."\n8. "This Changes Everything. (Again.)"\n9. "Built for the Real Ones."\n10. "Because Average Was Never the Goal."',
    createdAt: Date.now(),
  },
  {
    id: 'preset-sentiment_analyzer',
    name: 'sentiment_analyzer',
    icon: '📊',
    description: 'Analyzes audience sentiment and tone alignment for campaigns.',
    category: 'analytics',
    sampleOutput: 'SENTIMENT ANALYSIS\n\nBrand Tone: Confident, Premium, Approachable (Score: 78/100)\nAudience Alignment: HIGH — messaging resonates with target demographic\nRisk Areas:\n  - "Bold" language may read as aggressive to 35+ segment\n  - Visual palette skews 8pts younger than stated audience\nRecommendation: Soften CTA, lean into heritage messaging.\nProjected Engagement Lift: +22% with suggested changes.',
    createdAt: Date.now(),
  },
  {
    id: 'preset-budget_optimizer',
    name: 'budget_optimizer',
    icon: '💰',
    description: 'Recommends optimal budget allocation across campaign channels.',
    category: 'finance',
    sampleOutput: 'BUDGET ALLOCATION REPORT\n\nRecommended Split:\n  Digital Display:  35% ─ Highest reach efficiency\n  Social Media:     28% ─ Best engagement ROI\n  Search/SEM:       20% ─ High-intent capture\n  Influencer:       12% ─ Authenticity signal\n  Contingency:       5% ─ Do not skip this line\n\nRed Flag: Any allocation >60% to a single channel = risk.\nProjected CPM: $8.40 (industry avg: $11.20)',
    createdAt: Date.now(),
  },
  {
    id: 'preset-competitive_intel',
    name: 'competitive_intel',
    icon: '🔍',
    description: 'Surfaces competitor positioning gaps and whitespace opportunities.',
    category: 'analytics',
    sampleOutput: 'COMPETITIVE LANDSCAPE\n\nCategory: Crowded (6 major players)\nWhitespace Identified: "Effortless quality" positioning is unclaimed\nCompetitor Weakness: Top 2 brands both skew technical — emotional territory wide open\nOpportunity: Own the "Made for real life" narrative before Q4\nThreat Watch: Challenger brand increasing spend 40% YoY — intercept now\nRecommendation: Move fast on lifestyle positioning. Window closes in ~2 quarters.',
    createdAt: Date.now(),
  },
];

// ─── Cheat Campaigns (panzer) ─────────────────────────────────────────────────

function getCheatCampaigns(): PortfolioEntry[] {
  const d = Date.now();
  return [
    {
      id: 'cheat-1',
      campaignName: 'Bigger Logo Initiative',
      clientName: 'MakeItPop Inc.',
      score: 98,
      rating: 5,
      tier: 'exceptional',
      feedback: 'Can we make it pop more?',
      completedAt: d - 5 * 86400000,
      conceptName: 'The Logo That Ate Manhattan',
      teamFee: 45000,
      wasUnderBudget: true,
      award: '🌟 Cannes Shortlist',
    },
    {
      id: 'cheat-2',
      campaignName: 'Synergy Summit 2026',
      clientName: 'Buzzword Corp',
      score: 94,
      rating: 5,
      tier: 'exceptional',
      feedback: "Let's take this offline and circle back.",
      completedAt: d - 4 * 86400000,
      conceptName: 'Leverage the Paradigm Shift',
      teamFee: 38000,
      wasUnderBudget: false,
      award: "🏆 Client's Choice",
    },
    {
      id: 'cheat-3',
      campaignName: 'The Pivot',
      clientName: 'Web3 Vibes LLC',
      score: 91,
      rating: 5,
      tier: 'exceptional',
      feedback: 'To the moon! (We lost everything)',
      completedAt: d - 3 * 86400000,
      conceptName: 'From Coffee to Blockchain',
      teamFee: 52000,
      wasUnderBudget: true,
      award: '📈 Above & Beyond',
    },
    {
      id: 'cheat-4',
      campaignName: 'Circle Back Campaign',
      clientName: 'Corporate Ipsum',
      score: 89,
      rating: 5,
      tier: 'exceptional',
      feedback: 'Per my last email...',
      completedAt: d - 2 * 86400000,
      conceptName: "Let's Table This",
      teamFee: 31000,
      wasUnderBudget: false,
    },
    {
      id: 'cheat-5',
      campaignName: 'Per My Last Email',
      clientName: 'PassiveAggressive.io',
      score: 96,
      rating: 5,
      tier: 'exceptional',
      feedback: 'As per our earlier conversation, this is exactly what we discussed.',
      completedAt: d - 1 * 86400000,
      conceptName: 'As Previously Stated',
      teamFee: 67000,
      wasUnderBudget: true,
      award: '🌟 Cannes Shortlist',
    },
  ];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeLine(type: LineType, text: string): TerminalLine {
  return { id: makeId(), type, text };
}

function loadTools(): AgencyTool[] {
  try {
    const saved = localStorage.getItem(TOOLS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function buildToolPrompt(description: string): string {
  return `You are generating a tool definition for a creative advertising agency simulation game called Agency OS Terminal.

The player wants: "${description}"

Generate a realistic, useful agency tool. Respond with ONLY a valid JSON object — no markdown, no explanation, no code blocks.

{
  "name": "short_tool_name_in_snake_case",
  "icon": "single_relevant_emoji",
  "description": "One sentence: what this tool does.",
  "category": "analytics|creative|client|operations|finance",
  "sampleOutput": "A realistic 3–5 sentence output that the tool would produce. Include specific data points, metrics, percentages, or strategic recommendations that feel authentic to an ad agency. You may use line breaks for structure."
}`;
}

// ─── Natural language intent detection ───────────────────────────────────────

const BUILD_INDICATORS = [
  'make me', 'make a', 'make an',
  'create a', 'create an', 'create me',
  'build me', 'build a', 'build an',
  'i want a', 'i want an', 'i need a', 'i need an',
  'give me a', 'give me an',
  'can you make', 'can you create', 'can you build',
  'generate a', 'generate an',
  'generator', 'tool that', 'tool to',
  'something that', 'something to',
  'a tool', 'new tool',
];

const RUN_PREFIXES = ['run ', 'use ', 'open ', 'start ', 'launch ', 'execute '];

function looksLikeBuildRequest(input: string): boolean {
  return BUILD_INDICATORS.some(indicator => input.includes(indicator));
}

function looksLikeRunRequest(input: string): boolean {
  return RUN_PREFIXES.some(prefix => input.startsWith(prefix));
}

function extractRunTarget(input: string): string {
  const prefix = RUN_PREFIXES.find(p => input.startsWith(p));
  return prefix ? input.slice(prefix.length).trim() : input.trim();
}

function interpretPrompt(input: string): string {
  return `You are a terminal assistant in a creative agency game called Agency OS.

The user typed: "${input}"

Determine what they want. Respond with ONLY a valid JSON object:
{
  "intent": "build" | "run" | "list" | "help" | "other",
  "toolDescription": "if build: the full natural-language description of the tool they want",
  "toolName": "if run: the name of the tool they want to run (snake_case if possible)",
  "response": "if other/help: a short, helpful terminal-style response (1-2 sentences max)"
}

Rules:
- "build" if they want to create something new (a tool, generator, checker, calculator, etc.)
- "run" if they want to use an existing tool by name
- "list" if they want to see their tools
- "help" if they seem confused or want guidance
- "other" for greetings, questions about the game, etc.`;
}

// ─── Cheat Visual Effects ─────────────────────────────────────────────────────

function triggerCheatEffect(label: string): void {
  // Screen flash
  document.body.classList.add('cheat-activated');
  setTimeout(() => document.body.classList.remove('cheat-activated'), 500);

  // Floating text
  const el = document.createElement('div');
  el.className = 'floating-cheat-text';
  el.textContent = `🎮 ${label}`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1600);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TerminalApp(): React.ReactElement {
  const { setMorale, morale, addMessage } = useChatContext();
  const { addProfit, deductFunds, state: fundsState } = useAgencyFunds();
  const { state: repState, addReputation } = useReputationContext();
  const { triggerEndingSequence, sendAcquisitionOffer } = useEndingContext();
  const { getActiveCampaigns } = useCampaignContext();
  const { addNotification, focusOrOpenWindow } = useWindowContext();
  const { entries: portfolioEntries, attachAward, addEntry } = usePortfolioContext();
  const { applyMinScore, setOneTimeMinScore, toggleNightmareMode,
    toggleBigHeadMode, setHRWatcherActive, recordCheatUsed, cheat } = useCheatContext();
  const { unlockAchievement, unlockedAchievements, incrementCounter } = useAchievementContext();
  const { addEmail } = useEmailContext();

  const [lines, setLines] = useState<TerminalLine[]>(() =>
    BANNER_LINES.map(([type, text]) => makeLine(type, text))
  );
  const [inputValue, setInputValue] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isBuilding, setIsBuilding] = useState(false);
  const [tools, setTools] = useState<AgencyTool[]>(loadTools);

  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const konamiWindowRef = useRef<string[]>([]);
  const pendingActionRef = useRef<string | null>(null);

  // Persist tools to localStorage and notify other components
  useEffect(() => {
    try {
      localStorage.setItem(TOOLS_STORAGE_KEY, JSON.stringify(tools));
      // Notify CampaignToolsPanel (and any other listeners) in real time
      window.dispatchEvent(new CustomEvent('agencyrpg:tools-updated'));
    } catch {
      // non-fatal
    }
  }, [tools]);

  // Auto-scroll output to bottom
  useEffect(() => {
    const el = outputRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  // Stable line append helpers
  const addLine = useCallback((type: LineType, text: string) => {
    setLines(prev => [...prev, makeLine(type, text)]);
  }, []);

  const addLines = useCallback((items: Array<[LineType, string]>) => {
    setLines(prev => [...prev, ...items.map(([type, text]) => makeLine(type, text))]);
  }, []);

  // Konami code detection (global keydown) — accepts arrow keys OR letter keys
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      // Normalize: single characters → lowercase, arrows/etc. keep their e.key name
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

      // Slide the window: append new key, keep only the last KONAMI_LENGTH presses
      const win = [...konamiWindowRef.current, key].slice(-KONAMI_LENGTH);
      konamiWindowRef.current = win;

      // Only check once the window is full
      if (win.length === KONAMI_LENGTH) {
        const matchesArrow  = KONAMI_ARROW_SEQ.every((k, i) => k === win[i]);
        const matchesLetter = KONAMI_LETTER_SEQ.every((k, i) => k === win[i]);
        if (matchesArrow || matchesLetter) {
          addLine('ascii', KONAMI_REWARD);
          konamiWindowRef.current = [];  // reset so it can't re-fire immediately
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [addLine]);

  // ─── Build Tool (AI) ────────────────────────────────────────────────────────

  const handleBuild = useCallback(async (description: string) => {
    setIsBuilding(true);
    addLines([
      ['info',   '─── Building Tool ───────────────────────────'],
      ['output', `🤖 Analyzing: "${description}"`],
      ['output', '⏳ Generating with AI...'],
    ]);

    try {
      const response = await fetch('/api/anthropic/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 600,
          messages: [{ role: 'user', content: buildToolPrompt(description) }],
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(`API ${response.status}: ${errText.slice(0, 100)}`);
      }

      const data = await response.json();
      const rawText: string = data.content[0].text;

      // Extract JSON object from response
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in AI response.');

      const toolDef = JSON.parse(jsonMatch[0]);
      const { name, icon, description: desc, category, sampleOutput } = toolDef;

      if (!name || !icon || !desc || !sampleOutput) {
        throw new Error('Incomplete tool definition from AI.');
      }

      const newTool: AgencyTool = {
        id: `tool-${Date.now()}`,
        name: String(name).toLowerCase().replace(/\s+/g, '_').slice(0, 32),
        icon: String(icon).slice(0, 4),
        description: String(desc),
        category: String(category || 'operations'),
        sampleOutput: String(sampleOutput),
        createdAt: Date.now(),
      };

      setTools(prev => [...prev, newTool]);

      // Tool achievements
      const newToolCount = tools.length + 1;
      if (newToolCount === 1) unlockAchievement('built-tool');
      if (newToolCount === 5) unlockAchievement('five-tools');
      if (newToolCount === 10) unlockAchievement('ten-tools');

      addLines([
        ['blank',   ''],
        ['success', `✓ Tool created: ${newTool.icon}  ${newTool.name}`],
        ['output',  `   ${newTool.description}`],
        ['output',  `   Category: [${newTool.category}]`],
        ['blank',   ''],
        ['output',  `Run it with: run ${newTool.name}`],
        ['info',    '─────────────────────────────────────────────'],
      ]);
    } catch (err) {
      addLines([
        ['error',  `✗ Build failed: ${String(err)}`],
        ['output', 'Check your API connection and try again.'],
      ]);
    } finally {
      setIsBuilding(false);
    }
  }, [addLine, addLines, tools, unlockAchievement]);

  // ─── Natural Language Interpret (AI fallback) ────────────────────────────────

  const handleInterpret = useCallback(async (input: string) => {
    const lower = input.toLowerCase();

    // Fast path: pattern matching
    if (looksLikeBuildRequest(lower)) {
      addLine('output', '🤖 Sounds like you want to build something...');
      await handleBuild(input);
      return;
    }

    if (looksLikeRunRequest(lower)) {
      const target = extractRunTarget(lower);
      const tool = tools.find(t =>
        t.name.toLowerCase() === target ||
        t.name.toLowerCase() === target.replace(/\s+/g, '_')
      );
      if (tool) {
        addLines([
          ['info',    `─── Running: ${tool.icon} ${tool.name} ──────────────`],
          ['blank',   ''],
          ['output',  tool.sampleOutput],
          ['blank',   ''],
          ['success', '✓ Done.'],
          ['info',    '─────────────────────────────────────────────'],
        ]);
      } else {
        addLines([
          ['error',  `Tool not found: "${target}"`],
          ['output', 'Use "list" to see your saved tools.'],
        ]);
      }
      return;
    }

    // Slow path: ask Claude what the user meant
    addLine('info', '🤔 Hmm, let me figure out what you mean...');
    setIsBuilding(true);

    try {
      const response = await fetch('/api/anthropic/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 300,
          messages: [{ role: 'user', content: interpretPrompt(input) }],
        }),
      });

      if (!response.ok) throw new Error(`API ${response.status}`);

      const data = await response.json();
      const rawText: string = data.content[0].text;
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON in response');

      const parsed = JSON.parse(jsonMatch[0]);
      const { intent, toolDescription, toolName, response: aiResponse } = parsed;

      if (intent === 'build' && toolDescription) {
        addLine('output', '✓ Got it — building a tool for you...');
        await handleBuild(String(toolDescription));
      } else if (intent === 'run') {
        const target = String(toolName || '').toLowerCase().replace(/\s+/g, '_');
        const tool = tools.find(t => t.name.toLowerCase() === target);
        if (tool) {
          addLines([
            ['info',    `─── Running: ${tool.icon} ${tool.name} ──────────────`],
            ['blank',   ''],
            ['output',  tool.sampleOutput],
            ['blank',   ''],
            ['success', '✓ Done.'],
            ['info',    '─────────────────────────────────────────────'],
          ]);
        } else {
          addLines([
            ['error',  `Tool not found: "${toolName}"`],
            ['output', 'Use "list" to see your saved tools.'],
          ]);
        }
      } else if (intent === 'list') {
        if (tools.length === 0) {
          addLines([
            ['output', 'No tools saved yet.'],
            ['output', 'Use "build [description]" to create your first tool.'],
          ]);
        } else {
          addLines([
            ['info', `─── Your Tools (${tools.length}) ────────────────────────`],
            ...tools.map(t => {
              const nameCol = t.name.padEnd(24);
              return ['output', `  ${t.icon}  ${nameCol} [${t.category}]`] as [LineType, string];
            }),
            ['info',   '─────────────────────────────────────────────'],
            ['output', 'Run: run [name]   |   Delete: delete [name]'],
          ]);
        }
      } else if (intent === 'help') {
        addLine('output', HELP_TEXT);
      } else {
        addLine('output', String(aiResponse || 'Not sure what you mean. Try "help" for available commands.'));
      }
    } catch {
      // AI failed — fall back to standard "not found" message
      addLines([
        ['error',  `Command not found: "${input.split(' ')[0]}"`],
        ['output', 'Type "help" to see available commands.'],
      ]);
    } finally {
      setIsBuilding(false);
    }
  }, [addLine, addLines, tools, handleBuild]);

  // ─── Command Handler ─────────────────────────────────────────────────────────

  const handleCommand = useCallback(async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    // Echo input
    addLine('input', `agency@os:~$ ${trimmed}`);

    // ─── Pending confirmation handler ───────────────────────────────────
    if (pendingActionRef.current === 'reset') {
      pendingActionRef.current = null;
      if (trimmed === 'CONFIRM') {
        addLine('success', 'All data deleted. Refreshing...');
        setTimeout(() => {
          try {
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('agencyrpg_') || key.startsWith('agencyrpg-')) {
                localStorage.removeItem(key);
              }
            });
          } catch { /* non-fatal */ }
          window.location.reload();
        }, 1500);
      } else {
        addLine('info', 'Reset cancelled.');
      }
      return;
    }

    // History tracking
    setHistory(prev => [trimmed, ...prev.filter(h => h !== trimmed).slice(0, 48)]);
    setHistoryIndex(-1);

    // Terminal Explorer: count commands
    const cmdCount = incrementCounter('terminal-commands');
    if (cmdCount === 50) unlockAchievement('terminal-explorer');

    const lower = trimmed.toLowerCase();
    const parts = trimmed.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');

    // ─── Easter eggs & cheat codes ─────────────────────────────────────────
    // Checked FIRST — prevents the NL interpreter from misidentifying them

    if (lower === 'rosebud' || lower === 'rosebud!') {
      addProfit(`cheat-rosebud-${Date.now()}`, '💰 Console: rosebud', 1000);
      triggerCheatEffect('ROSEBUD');
      const n = recordCheatUsed('rosebud');
      if (n >= 5)  unlockAchievement('serial-cheater');
      if (n >= 10) unlockAchievement('cheat-encyclopedia');
      addLines([
        ['success', '§1,000 added to agency funds. 🌹'],
        ['output',  'The Sims called. They want their cheat back.'],
      ]);
    }

    else if (lower === 'motherlode') {
      addProfit(`cheat-motherlode-${Date.now()}`, '💰 Console: motherlode', 50000);
      triggerCheatEffect('MOTHERLODE');
      const n = recordCheatUsed('motherlode');
      if (n >= 5)  unlockAchievement('serial-cheater');
      if (n >= 10) unlockAchievement('cheat-encyclopedia');
      addLines([
        ['success', '§50,000 added to agency funds. 🏠'],
        ['output',  'Business is booming. (Suspiciously.)'],
      ]);
    }

    else if (lower === 'showmethemoney') {
      addProfit(`cheat-money-${Date.now()}`, '💰 Console: showmethemoney', 1000000);
      triggerCheatEffect('SHOW ME THE MONEY');
      const n = recordCheatUsed('showmethemoney');
      if (n >= 5)  unlockAchievement('serial-cheater');
      if (n >= 10) unlockAchievement('cheat-encyclopedia');
      addLines([
        ['success', '§1,000,000 added to agency funds. 💎'],
        ['ascii',   '  Jerry Maguire approves.'],
      ]);
    }

    else if (lower === 'aspirine') {
      setMorale('high');
      triggerCheatEffect('ASPIRINE');
      const n = recordCheatUsed('aspirine');
      if (n >= 5)  unlockAchievement('serial-cheater');
      if (n >= 10) unlockAchievement('cheat-encyclopedia');
      addLines([
        ['success', '💊 Team morale set to HIGH.'],
        ['output',  'The team feels energized, focused, and ready to ship.'],
        ['output',  'Check the #general channel.'],
      ]);
    }

    else if (lower === 'coffeebreak') {
      setMorale('high');
      triggerCheatEffect('COFFEE BREAK');
      const n = recordCheatUsed('coffeebreak');
      if (n >= 5)  unlockAchievement('serial-cheater');
      if (n >= 10) unlockAchievement('cheat-encyclopedia');
      addLines([
        ['success', '☕ COFFEE BREAK taken.'],
        ['output',  'Team morale set to HIGH.'],
        ['output',  'Never underestimate the power of a good espresso.'],
      ]);
    }

    else if (lower === 'thecannesincident') {
      addLines([
        ['ascii', '  👀 THE CANNES INCIDENT [CLASSIFIED]'],
        ['blank', ''],
        ['output', '  What actually happened:'],
        ['blank', ''],
        ['output', '  It involved a stolen ice sculpture, the wrong award envelope,'],
        ['output', '  a case of mistaken identity with a very famous director,'],
        ['output', "  and an unfortunate incident with the hotel's sprinkler system."],
        ['blank', ''],
        ['output', '  The statute of limitations has expired.'],
        ['output', "  Casey maintains it was 'worth it.'"],
      ]);
    }

    else if (
      lower === 'uuddlrlrba' ||
      lower === 'up up down down left right left right b a'
    ) {
      addLine('ascii', KONAMI_REWARD);
    }

    else if (lower === 'theend') {
      addLines([
        ['success', '🏆 Triggering ending sequence...'],
        ['output',  'Cue the music.'],
      ]);
      setTimeout(() => triggerEndingSequence('voluntary'), 1500);
    }

    else if (lower === 'goodbyecruelworld') {
      addLines([
        ['success', '👋 Skipping straight to acquisition...'],
        ['output',  'The holding company thanks you for your service.'],
      ]);
      setTimeout(() => triggerEndingSequence('hostile'), 1500);
    }

    else if (lower === 'rollcredits') {
      addLines([
        ['success', '🎬 Rolling credits...'],
        ['output',  "That's a wrap."],
      ]);
      setTimeout(() => triggerEndingSequence('credits_only'), 1500);
    }

    else if (lower === 'panzer') {
      triggerCheatEffect('PANZER');
      const pn = recordCheatUsed('panzer');
      if (pn >= 5)  unlockAchievement('serial-cheater');
      if (pn >= 10) unlockAchievement('cheat-encyclopedia');

      // Add 5 fake cheat-themed campaigns to the portfolio
      const cheatCampaigns = getCheatCampaigns();
      cheatCampaigns.forEach(entry => addEntry(entry));

      // Boost reputation to 95
      const repNeeded = Math.max(0, 95 - repState.currentReputation);
      if (repNeeded > 0) addReputation(repNeeded);

      // Staggered team chat reactions — confused but impressed
      const cheatChat = [
        { authorId: 'pm',           text: '...has anyone checked the portfolio recently?',                delay: 500 },
        { authorId: 'art-director', text: "I'm sorry, WHAT. When did we do all this??",                  delay: 2000 },
        { authorId: 'copywriter',   text: "I have NO memory of writing 'The Logo That Ate Manhattan'",   delay: 3500 },
        { authorId: 'strategist',   text: 'MakeItPop Inc. is in there. WEB3 VIBES LLC is in there.',     delay: 5000 },
        { authorId: 'suit',         text: "I don't know how this happened but our numbers look incredible", delay: 6500 },
        { authorId: 'technologist', text: "I'm not asking questions. I'm just not asking questions.",    delay: 8000 },
        { authorId: 'media',        text: 'Cannes Shortlist. TWICE. 🏆🏆',                               delay: 9500 },
        { authorId: 'pm',           text: "...we're going to get an acquisition offer, aren't we.",      delay: 11000 },
      ];
      cheatChat.forEach(({ authorId, text, delay }) => {
        setTimeout(() => {
          addMessage({
            id: `panzer-chat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            channel: 'general',
            authorId,
            text,
            timestamp: Date.now(),
            reactions: [],
            isRead: false,
          });
        }, delay);
      });

      // Trigger acquisition offer after team finishes reacting
      setTimeout(() => {
        sendAcquisitionOffer();
        addNotification('📧 New Email', 'OmniPubDent Holdings Groupe has been in touch.');
      }, 13000);

      addNotification('🏆 PANZER!', '5 campaigns added to portfolio. Check #general.');
      addLines([
        ['ascii',   '🏆  P A N Z E R'],
        ['blank',   ''],
        ['success', '5 legendary campaigns added to portfolio:'],
        ['blank',   ''],
        ['output',  '  Bigger Logo Initiative       MakeItPop Inc.        98/100  🌟'],
        ['output',  '  Synergy Summit 2026          Buzzword Corp         94/100  🏆'],
        ['output',  '  The Pivot                    Web3 Vibes LLC        91/100  📈'],
        ['output',  '  Circle Back Campaign         Corporate Ipsum       89/100'],
        ['output',  '  Per My Last Email            PassiveAggressive.io  96/100  🌟'],
        ['blank',   ''],
        ['success', `Reputation: ${repState.currentReputation} → 95${repNeeded > 0 ? ` (+${repNeeded})` : ' (already there)'}`],
        ['output',  'Check #general. OmniPubDent is calling.'],
      ]);
    }

    else if (lower === 'sellout') {
      triggerCheatEffect('SELLOUT');
      const sn = recordCheatUsed('sellout');
      if (sn >= 5)  unlockAchievement('serial-cheater');
      if (sn >= 10) unlockAchievement('cheat-encyclopedia');
      sendAcquisitionOffer();
      addNotification('📧 Acquisition Offer', 'OmniPubDent Holdings Groupe is interested.');
      addLines([
        ['ascii',  '💼  S E L L O U T'],
        ['blank',  ''],
        ['output', 'The holding company has been notified of your... availability.'],
        ['output', 'Check your inbox. Theodore is waiting.'],
        ['blank',  ''],
        ['output', "Remember: it's not selling out. It's strategic value realization."],
      ]);
    }

    else if (lower === 'gesundheit') {
      triggerCheatEffect('GESUNDHEIT');
      const gn = recordCheatUsed('gesundheit');
      if (gn >= 5)  unlockAchievement('serial-cheater');
      if (gn >= 10) unlockAchievement('cheat-encyclopedia');
      // Double current agency funds by adding an equal amount
      const doubled = fundsState.totalFunds;
      addProfit(`cheat-gesundheit-${Date.now()}`, '💰 Console: gesundheit', doubled);
      addNotification('💰 Funds Doubled!', `+${formatBudget(doubled)} added to agency accounts.`);
      addLines([
        ['success', `💰 FUNDS DOUBLED — +${formatBudget(doubled)}`],
        ['output',  `Agency now holds ${formatBudget(doubled * 2)}.`],
        ['output',  'Bless you. 🤧'],
      ]);
    }

    else if (lower === 'whosyourdaddy') {
      triggerCheatEffect("WHO'S YOUR DADDY");
      const wn = recordCheatUsed('whosyourdaddy');
      if (wn >= 5)  unlockAchievement('serial-cheater');
      if (wn >= 10) unlockAchievement('cheat-encyclopedia');
      applyMinScore(75);
      addNotification("😎 Invincible Mode", 'Campaigns cannot score below 75.');
      addLines([
        ['success', "😎 WHO'S YOUR DADDY — Invincible Mode ON"],
        ['output',  'All campaigns will now score a minimum of 75.'],
        ['output',  "Client revisions still hurt. But the score won't."],
      ]);
    }

    else if (lower === 'iddqd') {
      triggerCheatEffect('IDDQD');
      const iqn = recordCheatUsed('iddqd');
      if (iqn >= 5)  unlockAchievement('serial-cheater');
      if (iqn >= 10) unlockAchievement('cheat-encyclopedia');
      applyMinScore(95);
      addNotification('💀 God Mode', 'All campaigns will score 95+.');
      addLines([
        ['success', '💀 IDDQD — God Mode ON'],
        ['output',  'Your creative vision is unquestionable.'],
        ['output',  'All campaigns will now score a minimum of 95.'],
        ['output',  'The 3pm client call still hurts though.'],
      ]);
    }

    else if (lower === 'idkfa') {
      triggerCheatEffect('IDKFA');
      const ikn = recordCheatUsed('idkfa');
      if (ikn >= 5)  unlockAchievement('serial-cheater');
      if (ikn >= 10) unlockAchievement('cheat-encyclopedia');
      // Merge preset tools into the terminal's tool list (skip already-existing ids)
      setTools(prev => {
        const existingIds = new Set(prev.map(t => t.id));
        const fresh = PRESET_TOOLS.filter(t => !existingIds.has(t.id));
        return [...prev, ...fresh];
      });
      addNotification('🔧 All Tools Unlocked', `${PRESET_TOOLS.length} agency tools added.`);
      addLines([
        ['success', '🔫 IDKFA — Full Arsenal Loaded'],
        ['blank',   ''],
        ...PRESET_TOOLS.map(t => ['output', `  ${t.icon}  ${t.name}`] as [LineType, string]),
        ['blank',   ''],
        ['output',  'Run any tool with: run [name]'],
        ['output',  'Tools also appear in your campaign workspace.'],
      ]);
    }

    else if (lower === 'xyzzy') {
      addLine('output', 'A hollow voice says "Plugh."');
    }

    else if (lower === 'cannes') {
      addReputation(5);
      addLines([
        ['ascii',   '🏆 CANNES LIONS — Grand Prix!'],
        ['output',  'The jury stands. The crowd goes wild.'],
        ['success', '+5 reputation awarded.'],
      ]);
    }

    else if (lower === 'pitchperfect') {
      triggerCheatEffect('PITCH PERFECT');
      const ppn = recordCheatUsed('pitchperfect');
      if (ppn >= 5)  unlockAchievement('serial-cheater');
      if (ppn >= 10) unlockAchievement('cheat-encyclopedia');
      setOneTimeMinScore(95);
      addNotification('🎤 Pitch Perfect!', 'Your next campaign will score 95+.');
      addLines([
        ['success', '🎤 PITCH PERFECT — One-Time Score Boost'],
        ['output',  'Your next campaign will automatically score a minimum of 95.'],
        ['output',  "The client is already nodding. Aca-believe it."],
      ]);
    }

    else if (lower === 'theclientisalwaysright') {
      triggerCheatEffect('THE CLIENT IS ALWAYS RIGHT');
      const tcn = recordCheatUsed('theclientisalwaysright');
      if (tcn >= 5)  unlockAchievement('serial-cheater');
      if (tcn >= 10) unlockAchievement('cheat-encyclopedia');
      toggleNightmareMode();
      const isOn = !cheat.nightmareMode;
      if (isOn) {
        addNotification('😈 Nightmare Mode', 'Client feedback is now impossibly vague.');
        addLines([
          ['ascii',  '😈 CLIENT NIGHTMARE MODE — ACTIVATED'],
          ['blank',  ''],
          ['output', 'All future client feedback will be... special.'],
          ['output', '"It\'s fine. But can we make it more... you know? Just... more."'],
          ['output', 'Type it again to turn it off. Good luck.'],
        ]);
      } else {
        addLines([
          ['success', '😌 Nightmare Mode deactivated.'],
          ['output',  'Clients are back to being merely unreasonable.'],
        ]);
      }
    }

    else if (lower === 'hesoyam') {
      setMorale('high');
      addProfit(`cheat-hesoyam-${Date.now()}`, '💰 Console: hesoyam', 250000);
      addReputation(10);
      triggerCheatEffect('HESOYAM');
      const n = recordCheatUsed('hesoyam');
      unlockAchievement('grove-street');
      if (n >= 5)  unlockAchievement('serial-cheater');
      if (n >= 10) unlockAchievement('cheat-encyclopedia');
      addNotification('💪 HESOYAM!', 'Full package activated. +$250,000 · +10 rep · Morale maxed.');
      addLines([
        ['ascii',   '💪  H E S O Y A M'],
        ['blank',   ''],
        ['success', 'Full package activated:'],
        ['output',  '  ☕  Team morale → HIGH'],
        ['output',  `  💰  +${formatBudget(250000)} agency funds`],
        ['output',  '  ⭐  +10 reputation'],
        ['blank',   ''],
        ['output',  '(Wrong game but we respect the classics)'],
      ]);
    }

    else if (lower === 'impulse101') {
      setTools(prev => {
        const existingIds = new Set(prev.map(t => t.id));
        const fresh = PRESET_TOOLS.filter(t => !existingIds.has(t.id));
        return [...prev, ...fresh];
      });
      addProfit(`cheat-impulse-${Date.now()}`, '💰 Console: impulse101', 100000);
      triggerCheatEffect('IMPULSE 101');
      const n = recordCheatUsed('impulse101');
      unlockAchievement('impulse');
      if (n >= 5)  unlockAchievement('serial-cheater');
      if (n >= 10) unlockAchievement('cheat-encyclopedia');
      addNotification('🔫 Impulse 101!', `${PRESET_TOOLS.length} tools + $100,000 added.`);
      addLines([
        ['success', '🔫 IMPULSE 101 — Full Arsenal'],
        ['blank',   ''],
        ...PRESET_TOOLS.map(t => ['output', `  ${t.icon}  ${t.name}`] as [LineType, string]),
        ['blank',   ''],
        ['success', `+${formatBudget(100000)} to agency funds`],
        ['output',  'Run any tool with: run [name]'],
      ]);
    }

    else if (lower === 'noclip') {
      triggerCheatEffect('NOCLIP');
      const n = recordCheatUsed('noclip');
      if (n >= 5)  unlockAchievement('serial-cheater');
      if (n >= 10) unlockAchievement('cheat-encyclopedia');
      addLines([
        ['ascii',  '👻  N O C L I P'],
        ['blank',  ''],
        ['output', 'Phase-through-walls mode activated.'],
        ['output', 'Unfortunately, client timelines are non-Euclidean.'],
        ['output', "The laws of physics don't apply. Deadlines do."],
        ['blank',  ''],
        ['output', '(Campaign phase skipping: conceptually possible, physically inadvisable.)'],
      ]);
    }

    else if (lower === 'bighead') {
      toggleBigHeadMode();
      const isOn = !cheat.bigHeadMode;
      triggerCheatEffect('BIG HEAD MODE');
      const n = recordCheatUsed('bighead');
      if (isOn) unlockAchievement('big-head');
      if (n >= 5)  unlockAchievement('serial-cheater');
      if (n >= 10) unlockAchievement('cheat-encyclopedia');
      if (isOn) {
        addNotification('🎈 Big Head Mode', 'Team avatars are now 200% more forehead.');
        addLines([
          ['ascii',  '🎈  B I G   H E A D   M O D E'],
          ['blank',  ''],
          ['success', 'Team avatars are now 200% more forehead.'],
          ['output',  'Goldeneye called. They want their cheat back.'],
          ['output',  'Type again to return to normal-sized heads.'],
        ]);
      } else {
        addLines([
          ['success', '🎈 Big Head Mode deactivated.'],
          ['output',  'Heads returned to regulation size. HR is relieved.'],
        ]);
      }
    }

    else if (lower === 'sv_cheats 1') {
      triggerCheatEffect('SV_CHEATS 1');
      const n = recordCheatUsed('sv_cheats 1');
      if (n >= 5)  unlockAchievement('serial-cheater');
      if (n >= 10) unlockAchievement('cheat-encyclopedia');
      addLines([
        ['output', '> sv_cheats 1'],
        ['output', '> "sv_cheats" changed to "1"'],
        ['blank',  ''],
        ['output', 'God help us all.'],
        ['output', 'Half-Life called. They just want their console back.'],
      ]);
    }

    else if (lower === 'awardseason') {
      const idx = Math.floor(Math.random() * AWARD_DEFS.length);
      const award = AWARD_DEFS[idx];
      addReputation(award.repBonus);
      if (portfolioEntries.length > 0) {
        attachAward(portfolioEntries[0].id, award.name);
      }
      triggerCheatEffect(award.name.toUpperCase());
      const n = recordCheatUsed('awardseason');
      unlockAchievement('award-winner');
      if (award.id === 'cannes') unlockAchievement('cannes-shortlist');
      if (n >= 5)  unlockAchievement('serial-cheater');
      if (n >= 10) unlockAchievement('cheat-encyclopedia');
      addNotification(`${award.name}!`, `+${award.repBonus} reputation. Check your portfolio.`);
      addLines([
        ['ascii',  '🏆  AND THE WINNER IS...'],
        ['blank',  ''],
        ['success', `${award.name}`],
        ['output',  award.description],
        ['success', `+${award.repBonus} reputation`],
        ['blank',  ''],
        ['output', portfolioEntries.length > 0 ? 'Award attached to your latest campaign.' : 'No campaigns in portfolio yet.'],
      ]);
    }

    else if (lower === 'extracredit') {
      addReputation(10);
      triggerCheatEffect('+10 REP');
      const n = recordCheatUsed('extracredit');
      if (n >= 5)  unlockAchievement('serial-cheater');
      if (n >= 10) unlockAchievement('cheat-encyclopedia');
      addNotification('📚 Extra Credit', '+10 reputation. Teacher\'s pet.');
      addLines([
        ['success', '📚 EXTRA CREDIT — +10 Reputation'],
        ['output',  "Teacher's pet."],
        ['output',  'Check your reputation bar.'],
      ]);
    }

    else if (lower === 'printmoney') {
      addProfit(`cheat-print-${Date.now()}`, '💰 Console: printmoney', 10000);
      triggerCheatEffect('MONEY PRINTER GO BRRR');
      const n = recordCheatUsed('printmoney');
      if (n >= 5)  unlockAchievement('serial-cheater');
      if (n >= 10) unlockAchievement('cheat-encyclopedia');
      addLines([
        ['success', `💵 BRRRRRRR — +${formatBudget(10000)}`],
        ['output',  'The Federal Reserve of Agency OS approves.'],
      ]);
    }

    else if (lower === 'hotcoffee') {
      // Step 1: visual effect + achievements
      triggerCheatEffect('HOT COFFEE');
      const n = recordCheatUsed('hotcoffee');
      unlockAchievement('hot-coffee');
      if (n >= 5)  unlockAchievement('serial-cheater');
      if (n >= 10) unlockAchievement('cheat-encyclopedia');

      // Step 2: enable HR watcher (cheat-mode cursor follower)
      setHRWatcherActive(true);

      // Step 3: HR email
      const hrEmail = {
        id: `hr-incident-${Date.now()}`,
        type: 'team_message' as const,
        from: { name: 'Pat (Human Resources)', email: 'pat@agency.internal', avatar: '👔' },
        subject: '⚠️ URGENT: Mandatory Meeting RE: Holiday Party Footage',
        isUrgent: true,
        body: `To All Staff,

It has come to our attention that footage from the 2024 holiday party has been accessed from an unauthorized terminal.

We would like to remind everyone that:

1. What happens at the holiday party stays at the holiday party
2. The karaoke footage was supposed to be deleted
3. Yes, that was Casey on the photocopier
4. No, we will not be discussing "the incident" with the ice sculpture
5. The conga line through the server room was a fire hazard

Please delete any footage you may have and report to Conference Room B for mandatory "Appropriate Workplace Behavior" training.

This is your only warning.

I will be monitoring all terminals going forward.

**— Pat**
Human Resources

*P.S. — The open bar has been permanently discontinued.*
*P.P.S. — I'm watching.*`,
        timestamp: new Date(),
        isRead: false,
        isStarred: false,
        isDeleted: false,
      };
      addEmail(hrEmail);
      addNotification('📧 HR Email!', '⚠️ Mandatory Meeting RE: Holiday Party Footage');

      // Step 4: Quick team panic in chat — fast, punchy, cause-and-effect
      const hotCoffeeChat = [
        { authorId: 'pm',           text: '...',                                                                            delay: 500 },
        { authorId: 'pm',           text: 'Did someone just access the holiday party folder?',                              delay: 1200 },
        { authorId: 'art-director', text: 'THE WHAT',                                                                      delay: 2000 },
        { authorId: 'copywriter',   text: 'oh no oh no oh no',                                                             delay: 2800 },
        { authorId: 'suit',         text: "HR just sent an email. We're all dead.",                                        delay: 3500 },
        { authorId: 'technologist', text: 'I have no memory of that photocopier.',                                        delay: 4200 },
      ];

      // Step 5: Pat joins and escalates to legal
      const patChat = [
        { authorId: 'hr',           text: 'Hello everyone.',                                                               delay: 5500 },
        { authorId: 'strategist',   text: 'Oh god.',                                                                      delay: 6500 },
        { authorId: 'hr',           text: "I'll be joining your team communications going forward. For compliance purposes.", delay: 7500 },
        { authorId: 'hr',           text: "Also — legal has been notified. You'll want to prepare your defense.",          delay: 8800 },
        { authorId: 'copywriter',   text: 'DEFENSE?!',                                                                    delay: 9500 },
        { authorId: 'hr',           text: 'A lawsuit has been filed. Good luck. 📋',                                      delay: 10500 },
      ];

      [...hotCoffeeChat, ...patChat].forEach(({ authorId, text, delay }) => {
        setTimeout(() => {
          addMessage({
            id: `hotcoffee-chat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            channel: 'general',
            authorId,
            text,
            timestamp: Date.now(),
            reactions: [],
            isRead: false,
          });
        }, delay);
      });

      // Step 6: Legal notice + deduct retainer + launch lawsuit game — hits fast
      setTimeout(() => {
        deductFunds(50000, 'Legal retainer fees');
        addNotification('⚖️ Legal Notice', 'A lawsuit has been filed! Prepare your defense.');
      }, 11000);

      setTimeout(() => {
        focusOrOpenWindow('lawsuit', 'Lawsuit Defense');
      }, 13000);

      // Step 7: Add redacted portfolio campaign
      setTimeout(() => {
        addEntry({
          id: 'cheat-hotcoffee',
          campaignName: 'Holiday Party 2024',
          clientName: '[REDACTED]',
          score: 69,
          rating: 5,
          tier: 'exceptional',
          feedback: 'This meeting could have been an email. Actually, this meeting should NOT have been anything.',
          completedAt: new Date('2024-12-15T23:47:00.000Z').getTime(),
          conceptName: '[CONTENT REMOVED BY HR]',
          teamFee: 0,
          wasUnderBudget: false,
          award: '☕ Worst Kept Secret',
        });
        addNotification('📋 Portfolio Updated', 'A new campaign has been... added to your portfolio.');
      }, 3000);

      addLines([
        ['ascii',  '☕  H O T   C O F F E E'],
        ['blank',  ''],
        ['output', 'ACCESSING HIDDEN CONTENT...'],
        ['blank',  ''],
        ['output', '[CONTENT REMOVED BY HR]'],
        ['blank',  ''],
        ['output', 'Oh no.'],
        ['blank',  ''],
        ['output', 'Pat from HR has been notified. Check your inbox.'],
        ['output', 'Legal is getting involved. Prepare yourself.'],
      ]);
    }

    else if (lower === 'jasondotcom.com') {
      triggerCheatEffect('CREDITS');
      addReputation(5);
      const n = recordCheatUsed('jasondotcom.com');
      unlockAchievement('credits');
      if (n >= 5)  unlockAchievement('serial-cheater');
      if (n >= 10) unlockAchievement('cheat-encyclopedia');
      addLines([
        ['ascii',  '✨  C R E D I T S'],
        ['blank',  ''],
        ['output', 'Created by jasondotcom.com'],
        ['blank',  ''],
        ['output', 'Built with Claude Code, way too many tokens, and an unreasonable amount of'],
        ['output', 'experience in the advertising industry.'],
        ['blank',  ''],
        ['output', '"No logos were harmed in the making of this game."'],
        ['blank',  ''],
        ['success', '+5 reputation. Thanks for playing. 🙏'],
      ]);
    }

    else if (lower === 'jason' || lower === 'jasonpickar' || lower === 'creator' || lower === 'whomadethis' || lower === 'who made this') {
      unlockAchievement('found-jason');
      addLines([
        ['portrait', '/images/jason.png'],
        ['blank',    ''],
      ]);
    }

    else if (lower === 'opentowork' || lower === 'hire' || lower === 'resume' || lower === 'linkedin' || lower === 'jobs') {
      unlockAchievement('recruiter');
      addLines([
        ['ascii',  '📢  ATTENTION RECRUITERS & HIRING MANAGERS'],
        ['blank',  ''],
        ['output', 'The creator of this game is available for work.'],
        ['blank',  ''],
        ['output', '20+ years in advertising. VP Creative Director.'],
        ['output', "Led campaigns for McDonald's, DICK'S Sporting Goods loyalty program"],
        ['output', 'and copywriting for Dr Pepper, PlayStation, Diageo, Philips and so much more.'],
        ['output', 'Now also builds games with AI for fun.'],
        ['blank',  ''],
        ['info',   'Portfolio & Resume: jasondotcom.com'],
        ['info',   'LinkedIn: /in/jasonpickar'],
        ['blank',  ''],
        ['success', '"Will concept for money."'],
      ]);
    }

    else if (lower === 'claudecode') {
      const n = recordCheatUsed('claudecode');
      unlockAchievement('ai-humor');
      if (n >= 5)  unlockAchievement('serial-cheater');
      if (n >= 10) unlockAchievement('cheat-encyclopedia');
      addLines([
        ['ascii',  '🤖  C L A U D E   C O D E'],
        ['blank',  ''],
        ['output', 'Why did the AI go to therapy?'],
        ['blank',  ''],
        ['output', 'It had too many unresolved dependencies.'],
        ['blank',  ''],
        ['output', "...I'll see myself out."],
      ]);
    }

    else if (lower === 'debugmode') {
      const n = recordCheatUsed('debugmode');
      if (n >= 5)  unlockAchievement('serial-cheater');
      if (n >= 10) unlockAchievement('cheat-encyclopedia');
      console.log('=== AGENCYRPG DEBUG ===');
      console.log('Reputation:', repState.currentReputation);
      console.log('Funds:', fundsState.totalFunds);
      console.log('Morale:', morale);
      console.log('Completed Campaigns:', repState.completedCampaigns.length);
      console.log('Portfolio Entries:', portfolioEntries.length);
      console.log('Unlocked Achievements:', unlockedAchievements);
      console.log('Used Cheats:', cheat.usedCheats);
      console.log('Active Cheats:', {
        minScore: cheat.minScore,
        nightmareMode: cheat.nightmareMode,
        bigHeadMode: cheat.bigHeadMode,
        hrWatcherActive: cheat.hrWatcherActive,
      });
      console.log('=======================');
      addLines([
        ['success', '🐛 DEBUG MODE — Check your browser console'],
        ['output',  `Reputation: ${repState.currentReputation}`],
        ['output',  `Funds: ${formatBudget(fundsState.totalFunds)}`],
        ['output',  `Morale: ${morale}`],
        ['output',  `Campaigns completed: ${repState.completedCampaigns.length}`],
        ['output',  `Achievements: ${unlockedAchievements.length} unlocked`],
        ['output',  `Cheats used: ${cheat.usedCheats.length} unique codes`],
      ]);
    }

    else if (lower === 'iamacheater') {
      const n = recordCheatUsed('iamacheater');
      unlockAchievement('cheater-admitted');
      if (n >= 5)  unlockAchievement('serial-cheater');
      if (n >= 10) unlockAchievement('cheat-encyclopedia');
      addLines([
        ['ascii',  '🎮  C H E A T   C O D E S'],
        ['blank',  ''],
        ['output', 'You asked for it:'],
        ['blank',  ''],
        ['info',   'MONEY:'],
        ['output', '  rosebud ........... +$1,000'],
        ['output', '  motherlode ........ +$50,000'],
        ['output', '  printmoney ........ +$10,000'],
        ['output', '  showmethemoney .... +$1,000,000'],
        ['output', '  gesundheit ........ Double funds'],
        ['output', '  hesoyam ........... +$250k + morale + rep'],
        ['blank',  ''],
        ['info',   'POWER:'],
        ['output', '  iddqd ............. God mode (min score 95)'],
        ['output', '  whosyourdaddy ..... Invincible (min score 75)'],
        ['output', '  pitchperfect ...... Next campaign 95+'],
        ['output', '  aspirine .......... Max morale'],
        ['output', '  coffeebreak ....... Max morale'],
        ['blank',  ''],
        ['info',   'PORTFOLIO:'],
        ['output', '  panzer ............ Fake campaigns + acquisition'],
        ['output', '  awardseason ....... Win random award'],
        ['output', '  extracredit ....... +10 reputation'],
        ['output', '  impulse101 ........ All tools + $100k'],
        ['output', '  idkfa ............. All tools unlocked'],
        ['blank',  ''],
        ['info',   'FUN:'],
        ['output', '  bighead ........... Big Head Mode'],
        ['output', '  hotcoffee ......... ☕ You\'ll see.'],
        ['output', '  theclientisalwaysright ... Nightmare feedback'],
        ['output', '  noclip ............ Phase through walls (kinda)'],
        ['blank',  ''],
        ['info',   'ENDINGS:'],
        ['output', '  sellout ........... Trigger acquisition offer'],
        ['output', '  theend ............ Voluntary ending'],
        ['output', '  goodbyecruelworld . Hostile takeover'],
        ['output', '  rollcredits ....... Just the credits'],
        ['blank',  ''],
        ['info',   'META:'],
        ['output', '  jasondotcom.com ... Creator credits'],
        ['output', '  claudecode ........ AI tells a joke'],
        ['output', '  debugmode ......... Console debug info'],
        ['output', '  iamacheater ....... (you are here)'],
        ['blank',  ''],
        ['output', '...but where\'s the fun if I just tell you everything? 😏'],
      ]);
    }

    // Anti-cheats — funny responses for obvious attempts
    else if (lower === 'howdoicheat') {
      addLine('output', 'Nice try. Figure it out yourself. 😏');
    }

    else if (lower === 'givemealltheawards') {
      addLines([
        ['output', "That's not how this works."],
        ['output', "That's not how any of this works."],
      ]);
    }

    else if (lower === 'money') {
      addLine('output', "Be more specific. We're an agency, we speak in budgets.");
    }

    else if (lower === 'help cheats') {
      addLine('output', 'Cheats? What cheats? This is a professional agency simulation.');
    }

    else if (lower === 'cheat') {
      addLine('output', "I don't know what you're talking about. This is a legitimate business.");
    }

    else if (lower === 'cheats') {
      addLine('output', 'Sir/Madam, this is an advertising agency.');
    }

    else if (lower === 'hello world' || lower === 'hello, world' || lower === 'hello, world!') {
      addLines([
        ['success', 'Hello, World! 👋'],
        ['output',  'The classic first program. You were always a developer at heart.'],
      ]);
    }

    else if (lower === '42') {
      addLines([
        ['output', '42.'],
        ['blank',  ''],
        ['output', 'The answer to the ultimate question of life, the universe,'],
        ['output', 'and everything. (Still no idea what the question is.)'],
      ]);
    }

    else if (lower === 'make the logo bigger') {
      addLines([
        ['ascii',  '📐 CLIENT REQUEST RECEIVED'],
        ['blank',  ''],
        ['output', 'Logo size: MAXIMUM.'],
        ['output', 'No wait, bigger. Even bigger. Can it be the whole page?'],
        ['blank',  ''],
        ['output', 'The creative director has gone home.'],
      ]);
    }

    else if (lower === 'pivot') {
      addLines([
        ['ascii',  '🔄 PIVOT!'],
        ['output', "We're not a creative agency anymore."],
        ['output', "We're a tech company. No wait, a lifestyle brand."],
        ['output', 'Definitely a media company. Final answer.'],
      ]);
    }

    else if (lower === 'synergy') {
      addLines([
        ['output', '📊 Synergizing cross-functional paradigms...'],
        ['output', '⚡ Leveraging core competencies...'],
        ['output', '🤝 Ideating value-add touchpoints...'],
        ['blank',  ''],
        ['output', 'Nothing happened. It never does.'],
      ]);
    }

    else if (lower === 'lorem ipsum' || lower.startsWith('lorem ipsum ')) {
      addLines([
        ['output', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'],
        ['output', 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'],
        ['blank',  ''],
        ['output', 'Every designer has typed this at 2am. You are not alone.'],
      ]);
    }

    // sudo make me a sandwich must come BEFORE the general sudo check
    else if (lower === 'sudo make me a sandwich') {
      addLines([
        ['success', '🥪 Okay.'],
        ['blank',   ''],
        ['output',  '*poof*'],
        ['blank',   ''],
        ['output',  "You're a sandwich."],
      ]);
    }

    else if (lower === 'sudo' || lower.startsWith('sudo ')) {
      addLine('error', "Nice try. You're already the boss here. 😎");
    }

    else if (lower === 'rm -rf /' || lower === 'rm -rf' || lower === 'rm -rf *') {
      addLine('error', 'The agency is still standing. Try a different strategy. 🏢');
    }

    else if (lower === 'ls' || lower === 'ls -la' || lower === 'ls -l') {
      addLines([
        ['output', 'total 42'],
        ['output', 'drwxr-xr-x  campaigns/'],
        ['output', 'drwxr-xr-x  concepts/'],
        ['output', 'drwxr-xr-x  deliverables/'],
        ['output', '-rw-r--r--  strategy.md'],
        ['output', "-rw-r--r--  .secrets  (you don't want to know)"],
      ]);
    }

    else if (lower === 'pwd') {
      addLine('output', '/agency/os/terminal');
    }

    else if (lower === 'whoami') {
      addLine('output', 'Creative Director, Agency OS');
    }

    else if (lower === 'date') {
      addLine('output', new Date().toLocaleString());
    }

    else if (lower === 'echo' || lower.startsWith('echo ')) {
      const msg = trimmed.slice(5).trim();
      addLine('output', msg || '');
    }

    else if (lower === 'git status' || lower === 'git log' || lower === 'git') {
      addLines([
        ['output', 'On branch main'],
        ['output', "Your branch is ahead of 'origin/main' by 3 campaigns."],
        ['output', ''],
        ['output', 'nothing to commit, shipping to clients'],
      ]);
    }

    else if (lower === 'npm install' || lower === 'yarn' || lower === 'pnpm install') {
      addLines([
        ['output', '⠙ Installing creativity...'],
        ['output', 'added 42 packages in 0.3s'],
        ['success', '✓ node_modules/ideas populated'],
      ]);
    }

    else if (lower === 'exit' || lower === 'quit' || lower === ':q' || lower === ':wq') {
      addLine('output', "Use the × button to close the terminal. (We're not done yet.)");
    }

    // ─── Built-in commands ─────────────────────────────────────────────────

    else if (command === 'help') {
      addLine('output', HELP_TEXT);
    }

    else if (command === 'clear') {
      setLines([]);
    }

    else if (command === 'status') {
      const activeCampaigns = getActiveCampaigns();
      const activeCampaign = activeCampaigns[0] ?? null;
      addLines([
        ['info',   '─── Agency Status ─────────────────────────'],
        ['output', `💰  Funds:      ${formatBudget(fundsState.totalFunds)}`],
        ['output', `⭐  Reputation: ${repState.currentReputation} pts (${repState.currentTier.name})`],
        ['output', `💬  Morale:     ${morale}`],
        ['output', `🛠️   Tools:      ${tools.length} saved`],
        ['output', `📋  Campaign:   ${activeCampaign ? `${activeCampaign.clientName} (${activeCampaign.phase})` : 'None active'}`],
        ['info',   '───────────────────────────────────────────'],
      ]);
    }

    else if (command === 'brief') {
      const activeCampaign = getActiveCampaigns()[0] ?? null;
      if (!activeCampaign) {
        addLines([
          ['output', 'No active campaign.'],
          ['output', 'Accept a brief from your Inbox to get started.'],
        ]);
      } else {
        const { brief, clientName, campaignName, phase, clientBudget, productionBudget, toolsUsed } = activeCampaign;
        addLines([
          ['info',   '─── Current Brief ──────────────────────────'],
          ['output', `📋  Campaign:   ${campaignName}`],
          ['output', `🏢  Client:     ${clientName}`],
          ['output', `📍  Phase:      ${phase}`],
          ['blank',  ''],
          ['output', `🎯  Challenge:  ${brief.challenge}`],
          ['output', `👥  Audience:   ${brief.audience}`],
          ['output', `💬  Message:    ${brief.message}`],
          ['output', `✨  Vibe:       ${brief.vibe}`],
          ['blank',  ''],
          ['output', `💰  Budget:     ${formatBudget(clientBudget)}`],
          ['output', `🏭  Production: ${formatBudget(productionBudget)} remaining`],
          ['output', `🔧  Tools used: ${toolsUsed?.length ?? 0}`],
          ['info',   '───────────────────────────────────────────'],
        ]);
      }
    }

    else if (command === 'team') {
      const activeCampaign = getActiveCampaigns()[0] ?? null;
      if (!activeCampaign?.conceptingTeam) {
        addLines([
          ['output', 'No team assembled yet.'],
          ['output', 'Open the Projects app and start a concepting phase.'],
        ]);
      } else {
        const members = teamMembers.filter(m =>
          activeCampaign.conceptingTeam!.memberIds.includes(m.id)
        );
        addLines([
          ['info',   `─── Team: ${activeCampaign.clientName} ──────────────────`],
          ...members.map(m =>
            ['output', `  ${m.avatar}  ${m.name.padEnd(14)} ${m.role}`] as [LineType, string]
          ),
          ['blank',  ''],
          ['output', `Morale: ${morale}  |  Fee: ${formatBudget(activeCampaign.teamFee)}`],
          ['info',   '───────────────────────────────────────────'],
        ]);
      }
    }

    else if (command === 'list') {
      if (tools.length === 0) {
        addLines([
          ['output', 'No tools saved yet.'],
          ['output', 'Use "build [description]" to create your first tool.'],
        ]);
      } else {
        addLines([
          ['info', `─── Your Tools (${tools.length}) ────────────────────────`],
          ...tools.map(t => {
            const nameCol = t.name.padEnd(24);
            return ['output', `  ${t.icon}  ${nameCol} [${t.category}]`] as [LineType, string];
          }),
          ['info',   '─────────────────────────────────────────────'],
          ['output', 'Run: run [name]   |   Delete: delete [name]'],
        ]);
      }
    }

    else if (command === 'build') {
      if (!args) {
        addLines([
          ['error',  'Usage: build [description of the tool you want]'],
          ['output', 'Example: build a tool that tracks client sentiment scores'],
        ]);
      } else {
        await handleBuild(args);
      }
    }

    else if (command === 'run') {
      if (!args) {
        addLine('error', 'Usage: run [tool-name]');
      } else {
        const tool = tools.find(t =>
          t.name.toLowerCase() === args.toLowerCase() ||
          t.name.toLowerCase() === args.toLowerCase().replace(/\s+/g, '_')
        );
        if (!tool) {
          addLines([
            ['error',  `Tool not found: ${args}`],
            ['output', 'Use "list" to see your tools.'],
          ]);
        } else {
          // Used a tool during an active campaign
          if (getActiveCampaigns().length > 0) unlockAchievement('used-tool-on-campaign');
          addLines([
            ['info',    `─── Running: ${tool.icon} ${tool.name} ──────────────`],
            ['blank',   ''],
            ['output',  tool.sampleOutput],
            ['blank',   ''],
            ['success', '✓ Done.'],
            ['info',    '─────────────────────────────────────────────'],
          ]);
        }
      }
    }

    else if (command === 'delete') {
      if (!args) {
        addLine('error', 'Usage: delete [tool-name]');
      } else {
        const idx = tools.findIndex(t =>
          t.name.toLowerCase() === args.toLowerCase() ||
          t.name.toLowerCase() === args.toLowerCase().replace(/\s+/g, '_')
        );
        if (idx === -1) {
          addLines([
            ['error',  `Tool not found: ${args}`],
            ['output', 'Use "list" to see your tools.'],
          ]);
        } else {
          const deleted = tools[idx];
          setTools(prev => prev.filter((_, i) => i !== idx));
          addLine('success', `✓ Deleted: ${deleted.icon} ${deleted.name}`);
        }
      }
    }

    // ─── Game reset ───────────────────────────────────────────────────────

    else if (['reset', 'wipe', 'startover', 'deletesave', 'startfresh', 'deletealldata'].includes(command)) {
      pendingActionRef.current = 'reset';
      addLines([
        ['ascii',   '⚠️  WARNING'],
        ['blank',   ''],
        ['output',  'This will permanently delete all saved data including:'],
        ['output',  '  - Your portfolio'],
        ['output',  '  - Achievements'],
        ['output',  '  - Budget & reputation'],
        ['output',  '  - All progress'],
        ['blank',   ''],
        ['error',   "Type 'CONFIRM' to proceed or anything else to cancel."],
      ]);
    }

    // ─── Natural language fallback ────────────────────────────────────────

    else {
      await handleInterpret(trimmed);
    }
  }, [
    addLine, addLines, tools, fundsState, repState, morale,
    addProfit, setMorale, handleBuild, handleInterpret,
    triggerEndingSequence, sendAcquisitionOffer, getActiveCampaigns, addReputation,
    addNotification, portfolioEntries, attachAward, addEntry, addMessage, addEmail,
    applyMinScore, setOneTimeMinScore, toggleNightmareMode,
    toggleBigHeadMode, setHRWatcherActive, recordCheatUsed, cheat,
    unlockAchievement, unlockedAchievements, incrementCounter,
  ]);

  // ─── Input handlers ──────────────────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isBuilding) return;
    const cmd = inputValue;
    setInputValue('');
    handleCommand(cmd);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIndex = Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(newIndex);
      if (history[newIndex] !== undefined) setInputValue(history[newIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIndex = Math.max(historyIndex - 1, -1);
      setHistoryIndex(newIndex);
      setInputValue(newIndex === -1 ? '' : (history[newIndex] ?? ''));
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Tab completion for tool names
      if (inputValue.toLowerCase().startsWith('run ') || inputValue.toLowerCase().startsWith('delete ')) {
        const prefix = inputValue.split(' ')[0] + ' ';
        const partial = inputValue.slice(prefix.length).toLowerCase();
        const match = tools.find(t => t.name.toLowerCase().startsWith(partial));
        if (match) setInputValue(prefix + match.name);
      }
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div
      className={styles.terminal}
      onClick={() => inputRef.current?.focus()}
    >
      <div className={styles.outputArea} ref={outputRef} role="log" aria-live="polite" aria-label="Terminal output">
        {lines.map(line => {
          if (line.type === 'portrait') {
            return (
              <div key={line.id} className={styles.portraitBlock}>
                <img src={line.text} className={styles.portraitImg} alt="Jason Pickar" />
                <div className={styles.portraitInfo}>
                  <div className={styles.portraitName}>JASON PICKAR</div>
                  <div className={styles.portraitRole}>VP Creative Director</div>
                  <div className={styles.portraitLink}>jasondotcom.com</div>
                  <div className={styles.portraitTagline}>"Will concept for money."</div>
                </div>
              </div>
            );
          }
          return (
            <div
              key={line.id}
              className={`${styles.line} ${styles[line.type]}`}
            >
              {line.text}
            </div>
          );
        })}
        {isBuilding && (
          <div className={`${styles.line} ${styles.info} ${styles.blinking}`}>
            ⏳ Building tool...
          </div>
        )}
      </div>

      <form className={styles.inputRow} onSubmit={handleSubmit}>
        <span className={styles.prompt}>agency@os:~$</span>
        <input
          ref={inputRef}
          className={styles.input}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isBuilding}
          placeholder={isBuilding ? 'Building... please wait' : ''}
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </form>
    </div>
  );
}
