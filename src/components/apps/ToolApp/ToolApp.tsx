import React, { useState, useCallback, useMemo } from 'react';
import { useTerminalTools } from '../../../hooks/useTerminalTools';
import type { AgencyTool } from '../../../hooks/useTerminalTools';
import { useCampaignContext } from '../../../context/CampaignContext';
import { useAgencyFunds } from '../../../context/AgencyFundsContext';
import { useReputationContext } from '../../../context/ReputationContext';
import { useChatContext } from '../../../context/ChatContext';
import { teamMembers } from '../../../data/team';
import { formatBudget } from '../../../types/campaign';
import styles from './ToolApp.module.css';

// ─── Prompt builder ──────────────────────────────────────────────────────────

function buildContextBlock(
  campaign: ReturnType<ReturnType<typeof useCampaignContext>['getActiveCampaigns']>[0] | null,
  fundsTotal: number,
  repPoints: number,
  tierName: string,
  morale: string,
): string {
  if (campaign) {
    const { brief, clientName, campaignName, phase, clientBudget, productionBudget, productionSpent } = campaign;
    const members = campaign.conceptingTeam
      ? teamMembers.filter(m => campaign.conceptingTeam!.memberIds.includes(m.id))
      : [];
    const teamDesc = members.length > 0
      ? members.map(m => `${m.name} (${m.role} — ${m.specialty})`).join(', ')
      : 'No team assigned yet';

    return `CURRENT CAMPAIGN:
- Campaign: ${campaignName}
- Client: ${clientName}
- Phase: ${phase}
- Challenge: ${brief.challenge}
- Target Audience: ${brief.audience}
- Key Message: ${brief.message}
- Vibe / Tone: ${brief.vibe}
- Total Budget: $${clientBudget.toLocaleString()}
- Production Budget Remaining: $${(productionBudget - productionSpent).toLocaleString()}
- Timeline: ${brief.timeline}
- Team: ${teamDesc}`;
  }

  return `AGENCY STATUS:
- Funds: $${fundsTotal.toLocaleString()}
- Reputation: ${repPoints} pts (${tierName})
- Team Morale: ${morale}
- Available Team: ${teamMembers.map(m => `${m.name} (${m.role})`).join(', ')}`;
}

function buildPrompt(tool: AgencyTool, contextBlock: string): string {
  const hint = tool.runPromptHint || tool.description;
  const isHtml = tool.outputFormat === 'html';
  const isGame = /game|arcade|playable/i.test(tool.name) || /game|arcade|playable/i.test(hint);

  if (isHtml && isGame) {
    return `You are a game developer. Generate a complete, self-contained, PLAYABLE HTML game. Output ONLY the raw HTML code — no explanation, no markdown, no code fences.

GAME TO BUILD: "${tool.name.replace(/_/g, ' ')}" — ${hint}

${contextBlock}

CRITICAL RULES:
1. Your response must start with <!DOCTYPE html> — no other text before it
2. Include ALL CSS in a <style> tag and ALL JavaScript in a <script> tag
3. The game must be fully self-contained and render in an iframe with sandbox="allow-scripts"
4. Use canvas or DOM elements for game graphics — retro/arcade style is fine
5. Include real game mechanics: player controls (arrow keys/WASD/mouse/touch), collision detection, scoring, win/lose states
6. Include a start screen, active gameplay, and game over screen with restart option
7. Use the campaign data above for theming if relevant (client names, challenges, etc.)
8. Make it actually FUN and PLAYABLE — not a mockup, wireframe, or description
9. Keep it simple but functional — think retro arcade games
10. Support both keyboard and touch/click controls for mobile
11. The very first character of your response must be < (the start of the HTML tag)
12. Do NOT output markdown, code fences, explanations, or descriptions — ONLY raw HTML`;
  }

  if (isHtml) {
    return `You are a code generator. Your ONLY job is to output raw, working HTML code. Do NOT describe what the page would look like. Do NOT explain your approach. Output ONLY the code itself.

Generate a complete, self-contained HTML page for: "${tool.name.replace(/_/g, ' ')}" — ${hint}

${contextBlock}

CRITICAL RULES:
1. Your response must start with <!DOCTYPE html> — no other text before it
2. Include ALL CSS in a <style> tag and ALL JavaScript in a <script> tag
3. The page must be fully self-contained and render in an iframe
4. Use the actual campaign data above — real client names, real challenges, real audiences
5. Make it visually polished: modern design, good typography, soft colors, responsive
6. If interactive (forms, calculators, generators), the JS must actually work
7. Do NOT output markdown, code fences, explanations, or descriptions — ONLY raw HTML
8. The very first character of your response must be < (the start of the HTML tag)`;
  }

  return `You are running the "${tool.name.replace(/_/g, ' ')}" tool inside Agency OS — a creative advertising agency simulation.

TOOL PURPOSE: ${hint}

${contextBlock}

Generate output for this tool based on the context above. Rules:
- Be SPECIFIC to this exact campaign/client — use their actual name, challenge, audience, and data
- Format cleanly with line breaks and structure — but no markdown headers (no # or **)
- Include concrete data points, metrics, recommendations, or creative options as appropriate
- Keep output focused and useful — 8-20 lines max
- Each run should produce fresh, varied output`;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  toolId: string;
}

export default function ToolApp({ toolId }: Props): React.ReactElement {
  const tools = useTerminalTools();
  const { getActiveCampaigns, recordToolUsed } = useCampaignContext();
  const { state: fundsState } = useAgencyFunds();
  const { state: repState } = useReputationContext();
  const { morale } = useChatContext();
  const [output, setOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tool = tools.find(t => t.id === toolId);
  const isHtmlTool = tool?.outputFormat === 'html';

  // Detect HTML in output
  const outputIsHtml = isHtmlTool || (output ? /^\s*<!DOCTYPE|^\s*<html/i.test(output.trim()) : false);

  // Clean HTML for iframe srcdoc
  const cleanHtml = useMemo(() => {
    if (!outputIsHtml || !output) return '';
    let html = output;
    const fenceMatch = html.match(/```(?:html)?\s*\n([\s\S]*?)```/);
    if (fenceMatch) html = fenceMatch[1];
    return html.trim();
  }, [output, outputIsHtml]);

  const handleRun = useCallback(async () => {
    if (!tool || isRunning) return;
    setIsRunning(true);
    setError(null);
    setOutput(null);

    const activeCampaign = getActiveCampaigns()[0] ?? null;
    const contextBlock = buildContextBlock(
      activeCampaign,
      fundsState.totalFunds,
      repState.currentReputation,
      repState.currentTier.name,
      morale,
    );
    const prompt = buildPrompt(tool, contextBlock);

    try {
      const response = await fetch('/api/anthropic/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: isHtmlTool ? (/game|arcade|playable/i.test(tool.name) || /game|arcade|playable/i.test(tool.runPromptHint || '') ? 8000 : 4000) : 800,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) throw new Error(`API ${response.status}`);

      const data = await response.json();
      setOutput(data.content[0].text);

      if (activeCampaign) {
        recordToolUsed(activeCampaign.id, tool.id);
      }
    } catch {
      setError('Live mode unavailable — showing cached output');
      setOutput(tool.sampleOutput);
    } finally {
      setIsRunning(false);
    }
  }, [tool, isRunning, isHtmlTool, getActiveCampaigns, recordToolUsed, fundsState.totalFunds, repState.currentReputation, repState.currentTier.name, morale]);

  if (!tool) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>Tool not found. It may have been deleted.</div>
      </div>
    );
  }

  const activeCampaign = getActiveCampaigns()[0] ?? null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.toolIcon}>{tool.icon}</span>
        <div className={styles.headerText}>
          <div className={styles.toolName}>{tool.name.replace(/_/g, ' ')}</div>
          <div className={styles.toolDesc}>{tool.description}</div>
        </div>
      </div>

      <div className={styles.context}>
        {activeCampaign ? (
          <span>📋 {activeCampaign.campaignName} — {activeCampaign.phase}</span>
        ) : (
          <span>No active campaign — will use general agency context</span>
        )}
      </div>

      <div className={styles.actions}>
        <button
          className={styles.runButton}
          onClick={handleRun}
          disabled={isRunning}
        >
          {isRunning ? '⏳ Running...' : output ? '🔄 Run Again' : '▶ Run'}
        </button>
        {isHtmlTool && <span className={styles.htmlBadge}>HTML</span>}
      </div>

      {error && <div className={styles.error}>⚠ {error}</div>}

      {output && (
        <div className={styles.output}>
          {outputIsHtml ? (
            <>
              <div className={styles.outputHeader}>Live Preview</div>
              <iframe
                className={styles.outputHtml}
                sandbox="allow-scripts"
                srcDoc={cleanHtml}
                title={tool.name}
              />
            </>
          ) : (
            <>
              <div className={styles.outputHeader}>Output</div>
              <pre className={styles.outputText}>{output}</pre>
            </>
          )}
        </div>
      )}

      <div className={styles.footer}>
        <span className={styles.category}>{tool.category}</span>
        {activeCampaign && (
          <span className={styles.budget}>
            Budget: {formatBudget(activeCampaign.productionBudget - activeCampaign.productionSpent)} remaining
          </span>
        )}
      </div>
    </div>
  );
}
