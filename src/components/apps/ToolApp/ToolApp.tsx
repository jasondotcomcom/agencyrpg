import React, { useState, useCallback, useRef, useEffect } from 'react';
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

  if (isHtml) {
    return `You are running the "${tool.name.replace(/_/g, ' ')}" tool inside Agency OS — a creative advertising agency simulation.

TOOL PURPOSE: ${hint}

${contextBlock}

Generate a COMPLETE, self-contained HTML document for this tool. Rules:
- Output ONLY the HTML — no markdown, no code fences, no explanation
- Start with <!DOCTYPE html> or <html>
- Include all CSS inline (in a <style> tag) and any JS inline (in a <script> tag)
- Use modern, clean design — soft colors, good typography, responsive layout
- Be SPECIFIC to this exact campaign/client — use their actual name, challenge, audience, and data
- Make it visually polished and immediately useful
- If interactive (form, calculator, generator), make the interactions work with inline JS
- Each run should produce fresh, varied output`;
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
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [output, setOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tool = tools.find(t => t.id === toolId);
  const isHtmlTool = tool?.outputFormat === 'html';

  // Detect HTML in output
  const outputIsHtml = isHtmlTool || (output ? /^\s*<!DOCTYPE|^\s*<html/i.test(output.trim()) : false);

  // Write HTML to iframe when output changes
  useEffect(() => {
    if (!outputIsHtml || !output || !iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;

    let html = output;
    const fenceMatch = html.match(/```(?:html)?\s*\n([\s\S]*?)```/);
    if (fenceMatch) html = fenceMatch[1];

    doc.open();
    doc.write(html);
    doc.close();
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
          max_tokens: isHtmlTool ? 4000 : 800,
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
                ref={iframeRef}
                className={styles.outputHtml}
                sandbox="allow-scripts"
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
