import React, { useState } from 'react';
import type { Campaign } from '../../../types/campaign';
import { useTerminalTools } from '../../../hooks/useTerminalTools';
import type { AgencyTool } from '../../../hooks/useTerminalTools';
import { useCampaignContext } from '../../../context/CampaignContext';
import styles from './CampaignToolsPanel.module.css';

// ─── Phase-to-keyword mapping for smart suggestions ──────────────────────────

const PHASE_KEYWORDS: Record<string, string[]> = {
  concepting: [
    'headline', 'tagline', 'name', 'brainstorm', 'idea', 'concept',
    'audience', 'persona', 'angle', 'hook', 'slogan', 'theme',
  ],
  executing: [
    'copy', 'script', 'caption', 'hashtag', 'cta', 'post', 'write',
    'text', 'ad', 'body', 'content',
  ],
  reviewing: [
    'score', 'predict', 'analyze', 'rate', 'review', 'feedback', 'improve',
  ],
};

function getSuggested(tools: AgencyTool[], phase: string): AgencyTool[] {
  const keywords = PHASE_KEYWORDS[phase] || [];
  return tools.filter(tool =>
    keywords.some(k =>
      tool.name.toLowerCase().includes(k) ||
      tool.description.toLowerCase().includes(k)
    )
  );
}

// ─── Contextual prompt builder ────────────────────────────────────────────────

function buildContextualPrompt(tool: AgencyTool, campaign: Campaign): string {
  const { brief } = campaign;
  return `You are running the "${tool.name.replace(/_/g, ' ')}" tool (${tool.description}) for a creative advertising agency.

CURRENT CAMPAIGN BRIEF:
- Client: ${brief.clientName}
- The Challenge: ${brief.challenge}
- Target Audience: ${brief.audience}
- Key Message: ${brief.message}
- Vibe / Tone: ${brief.vibe}
- Budget: $${brief.budget.toLocaleString()}
- Timeline: ${brief.timeline}

Run the tool with this specific brief as context. Generate output tailored to this exact client and challenge. Be specific — use the client's name, reference their actual brief, give concrete results. Format the output clearly and make it immediately useful.`;
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

interface Props {
  campaign: Campaign;
}

export default function CampaignToolsPanel({ campaign }: Props): React.ReactElement | null {
  const tools = useTerminalTools();
  const { recordToolUsed } = useCampaignContext();

  const [isOpen, setIsOpen] = useState(false);
  const [runningToolId, setRunningToolId] = useState<string | null>(null);
  const [activeResult, setActiveResult] = useState<{ tool: AgencyTool; output: string } | null>(null);

  if (tools.length === 0) return null;

  const suggested = getSuggested(tools, campaign.phase);
  const other = tools.filter(t => !suggested.some(s => s.id === t.id));

  const handleUseOnBrief = async (tool: AgencyTool) => {
    if (runningToolId) return;
    setRunningToolId(tool.id);

    try {
      const response = await fetch('/api/anthropic/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 700,
          messages: [{ role: 'user', content: buildContextualPrompt(tool, campaign) }],
        }),
      });

      if (!response.ok) throw new Error(`API ${response.status}`);

      const data = await response.json();
      const output: string = data.content[0].text;

      recordToolUsed(campaign.id, tool.id);
      setActiveResult({ tool, output });
    } catch {
      setActiveResult({ tool, output: '⚠️ Could not run tool — check your API connection.' });
    } finally {
      setRunningToolId(null);
    }
  };

  return (
    <div className={styles.panel}>
      <button
        className={styles.toggle}
        onClick={() => setIsOpen(v => !v)}
        aria-expanded={isOpen}
      >
        <span className={styles.toggleChevron}>{isOpen ? '▾' : '▸'}</span>
        <span className={styles.toggleLabel}>🔧 Your Tools</span>
        <span className={styles.toggleCount}>{tools.length}</span>
        {suggested.length > 0 && (
          <span className={styles.suggestedBadge}>
            {suggested.length} suggested
          </span>
        )}
        {(campaign.toolsUsed?.length ?? 0) > 0 && (
          <span className={styles.usedBadge}>
            {campaign.toolsUsed!.length} used this campaign
          </span>
        )}
      </button>

      {isOpen && (
        <div className={styles.body}>
          {suggested.length > 0 && (
            <div className={styles.group}>
              <div className={styles.groupLabel}>✨ Suggested for this phase</div>
              <div className={styles.grid}>
                {suggested.map(tool => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    isRunning={runningToolId === tool.id}
                    wasUsed={campaign.toolsUsed?.includes(tool.id) ?? false}
                    onUse={() => handleUseOnBrief(tool)}
                    highlighted
                  />
                ))}
              </div>
            </div>
          )}

          {other.length > 0 && (
            <div className={styles.group}>
              {suggested.length > 0 && <div className={styles.divider} />}
              <div className={styles.groupLabel}>All tools</div>
              <div className={styles.grid}>
                {other.map(tool => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    isRunning={runningToolId === tool.id}
                    wasUsed={campaign.toolsUsed?.includes(tool.id) ?? false}
                    onUse={() => handleUseOnBrief(tool)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeResult && (
        <ToolResultModal
          result={activeResult}
          onClose={() => setActiveResult(null)}
        />
      )}
    </div>
  );
}

// ─── Tool Card ────────────────────────────────────────────────────────────────

interface ToolCardProps {
  tool: AgencyTool;
  isRunning: boolean;
  wasUsed: boolean;
  onUse: () => void;
  highlighted?: boolean;
}

function ToolCard({ tool, isRunning, wasUsed, onUse, highlighted }: ToolCardProps) {
  return (
    <div className={`${styles.card} ${highlighted ? styles.cardHighlighted : ''}`}>
      <div className={styles.cardIcon}>{tool.icon}</div>
      <div className={styles.cardName}>{tool.name.replace(/_/g, ' ')}</div>
      <div className={styles.cardDesc}>{tool.description}</div>
      <div className={styles.cardFooter}>
        {wasUsed && <span className={styles.wasUsed}>✓ used</span>}
        <button
          className={styles.useButton}
          onClick={onUse}
          disabled={isRunning}
        >
          {isRunning ? '⏳ Running...' : 'Use on Brief →'}
        </button>
      </div>
    </div>
  );
}

// ─── Result Modal ─────────────────────────────────────────────────────────────

interface ResultModalProps {
  result: { tool: AgencyTool; output: string };
  onClose: () => void;
}

function ToolResultModal({ result, onClose }: ResultModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(result.output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleRow}>
            <span className={styles.modalIcon}>{result.tool.icon}</span>
            <span className={styles.modalTitle}>
              {result.tool.name.replace(/_/g, ' ')}
            </span>
          </div>
          <div className={styles.modalSubtitle}>Applied to current brief</div>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className={styles.modalOutput}>
          {result.output}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.copyButton} onClick={handleCopy}>
            {copied ? '✓ Copied!' : '📋 Copy to Clipboard'}
          </button>
          <button className={styles.doneButton} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
