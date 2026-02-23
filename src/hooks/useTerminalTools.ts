import { useState, useEffect } from 'react';

// Must match the key used in TerminalApp.tsx
export const TOOLS_STORAGE_KEY = 'agencyrpg_tools';

export interface AgencyTool {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: string;
  sampleOutput: string;
  runPromptHint?: string;
  outputFormat?: 'text' | 'html';
  createdAt: number;
}

function loadFromStorage(): AgencyTool[] {
  try {
    const saved = localStorage.getItem(TOOLS_STORAGE_KEY);
    return saved ? (JSON.parse(saved) as AgencyTool[]) : [];
  } catch {
    return [];
  }
}

/**
 * Returns the list of terminal tools, kept in sync with localStorage.
 * TerminalApp dispatches 'agencyrpg:tools-updated' whenever the list changes
 * so campaign views update in real time without a page refresh.
 */
export function useTerminalTools(): AgencyTool[] {
  const [tools, setTools] = useState<AgencyTool[]>(loadFromStorage);

  useEffect(() => {
    const refresh = () => setTools(loadFromStorage());

    // Fired by TerminalApp (same tab) when tools change
    window.addEventListener('agencyrpg:tools-updated', refresh);
    // Fired by other tabs/windows
    window.addEventListener('storage', refresh);

    return () => {
      window.removeEventListener('agencyrpg:tools-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  return tools;
}
