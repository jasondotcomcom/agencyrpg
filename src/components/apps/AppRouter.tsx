import React, { lazy, Suspense } from 'react';
import { isMobile } from '../../utils/deviceDetection';
import { InboxApp } from './Inbox';
import { ProjectsApp } from './Projects';
import { ChatApp } from './Chat';
import PortfolioApp from './Portfolio/PortfolioApp';
import SettingsApp from './Settings/SettingsApp';
import TerminalApp from './Terminal/TerminalApp';
import NotesApp from './Notes/NotesApp';
import CalendarApp from './Calendar/CalendarApp';
import SolitaireApp from './Solitaire/SolitaireApp';
import MinesweeperApp from './Minesweeper/MinesweeperApp';
import HRTrainingApp from './HRTraining/HRTrainingApp';

const SkiFreeApp = lazy(() => import('./SkiFree/SkiFreeApp'));
const LawsuitApp = lazy(() => import('./Lawsuit/LawsuitApp'));
const ToolApp = lazy(() => import('./ToolApp/ToolApp'));
const HtmlPreview = lazy(() => import('./HtmlPreview/HtmlPreview'));
const AIRevolutionApp = lazy(() => import('./AIRevolution/AIRevolutionApp'));

const LoadingFallback = ({ text = 'Loading...' }: { text?: string }) => (
  <div style={{ padding: 24, textAlign: 'center' }}>{text}</div>
);

// Placeholder content for apps not yet implemented
function PlaceholderContent({ appId }: { appId: string }) {
  const baseStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
    padding: '24px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: '700',
    marginBottom: '8px',
    color: '#5a5a5a',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#888888',
    lineHeight: '1.6',
  };

  const emojiStyle: React.CSSProperties = {
    fontSize: '48px',
    marginBottom: '16px',
  };

  const contents: Record<string, React.ReactElement> = {
    chat: (
      <div style={baseStyle}>
        <span style={emojiStyle}>💬</span>
        <p style={titleStyle}>Chat</p>
        <p style={subtitleStyle}>Talk to the team<br/>about the work.</p>
      </div>
    ),
    files: (
      <div style={baseStyle}>
        <span style={emojiStyle}>📁</span>
        <p style={titleStyle}>My Files</p>
        <p style={subtitleStyle}>Your files will appear here.<br/>Drop something in!</p>
      </div>
    ),
    terminal: (
      <div style={{
        backgroundColor: '#2d2d2d',
        color: '#a8e6cf',
        padding: '16px',
        height: '100%',
        fontFamily: 'monospace',
        fontSize: '13px',
        borderRadius: '8px',
        lineHeight: '1.6',
      }}>
        <p style={{ color: '#c3aed6' }}>✨ Agency OS Terminal v1.0</p>
        <p style={{ marginTop: '12px', color: '#a8d8ea' }}>Ready when you are, boss.</p>
        <p style={{ marginTop: '8px' }}>
          <span style={{ color: '#ffb7b2' }}>~</span> <span style={{ color: '#a8e6cf' }}>&gt;</span> _
        </p>
      </div>
    ),
    notes: (
      <div style={baseStyle}>
        <span style={emojiStyle}>📝</span>
        <p style={titleStyle}>Notes</p>
        <p style={subtitleStyle}>Jot down your thoughts<br/>and ideas here!</p>
      </div>
    ),
    calendar: (
      <div style={baseStyle}>
        <span style={emojiStyle}>📅</span>
        <p style={titleStyle}>Calendar</p>
        <p style={subtitleStyle}>No events scheduled.<br/>Time to plan something fun!</p>
      </div>
    ),
    settings: (
      <div style={baseStyle}>
        <span style={emojiStyle}>⚙️</span>
        <p style={titleStyle}>Settings</p>
        <p style={subtitleStyle}>Customize your experience<br/>just the way you like it.</p>
      </div>
    ),
    help: (
      <div style={{...baseStyle, alignItems: 'flex-start', textAlign: 'left'}}>
        <span style={{...emojiStyle, alignSelf: 'center'}}>📖</span>
        <p style={{...titleStyle, alignSelf: 'center', marginBottom: '16px'}}>Welcome to Agency OS!</p>
        <div style={{ ...subtitleStyle, lineHeight: '2' }}>
          {isMobile() ? (
            <>
              <p>👆 <strong>Tap</strong> app icons to open apps</p>
              <p>◀️ <strong>Back button</strong> switches between apps</p>
              <p>🏠 <strong>Home button</strong> returns to home screen</p>
              <p>⬇️ <strong>Swipe down</strong> from the top for notifications</p>
            </>
          ) : (
            <>
              <p>🖱️ <strong>Double-click</strong> icons to open apps</p>
              <p>✋ <strong>Drag</strong> title bars to move windows</p>
              <p>↔️ <strong>Drag corners</strong> to resize</p>
              <p>🔘 Use the <strong>colorful buttons</strong> to minimize, maximize, or close</p>
            </>
          )}
        </div>
      </div>
    ),
  };

  return contents[appId] || contents.help;
}

declare const __APP_VERSION__: string;

function AboutContent() {
  const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0-dev';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100%', textAlign: 'center', padding: '32px', gap: '16px',
      fontFamily: 'inherit',
    }}>
      <div style={{ fontSize: '3rem' }}>✨</div>
      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#5a5a5a' }}>Agency RPG</div>
      <div style={{ fontSize: '0.8125rem', color: '#888', lineHeight: 1.8 }}>
        <p>A browser-based creative agency simulator.</p>
        <p style={{ marginTop: 12 }}>
          <strong>Built by</strong>{' '}
          <a href="https://jasondotcom.com" target="_blank" rel="noopener noreferrer"
            style={{ color: '#667eea', textDecoration: 'underline' }}>
            Jasondotcom.com
          </a><br/>
          <strong>Powered by</strong> Claude (Anthropic)<br/>
          <strong>Made with</strong> React, Vite, Claude and way too many tokens.
        </p>
        <p style={{ marginTop: 8, fontSize: '0.75rem', color: '#999', lineHeight: 1.6 }}>
          Available for creative direction, team leadership,<br/>
          AI team training and fun collabs.
        </p>
        <p style={{ marginTop: 4 }}>
          <a href="mailto:jason@jasondotcom.com"
            style={{ color: '#667eea', textDecoration: 'none', fontSize: '0.8125rem' }}>
            📧 jason@jasondotcom.com
          </a>
        </p>
        <p style={{ marginTop: 16, fontSize: '0.75rem', color: '#aaa' }}>
          v{version} &middot; 2026
        </p>
      </div>
    </div>
  );
}

/**
 * Shared app router — maps appId to React component.
 * Used by both desktop Window.tsx and mobile MobileAppContainer.
 */
export default function AppRouter({ appId }: { appId: string }) {
  switch (appId) {
    case 'inbox':
      return <InboxApp />;
    case 'projects':
      return <ProjectsApp />;
    case 'chat':
      return <ChatApp />;
    case 'portfolio':
      return <PortfolioApp />;
    case 'settings':
      return <SettingsApp />;
    case 'terminal':
      return <TerminalApp />;
    case 'notes':
      return <NotesApp />;
    case 'calendar':
      return <CalendarApp />;
    case 'solitaire':
      return <SolitaireApp />;
    case 'minesweeper':
      return <MinesweeperApp />;
    case 'skifree':
      return <Suspense fallback={<LoadingFallback text="Loading SkiFree..." />}><SkiFreeApp /></Suspense>;
    case 'hrtraining':
      return <HRTrainingApp />;
    case 'lawsuit':
      return <Suspense fallback={<LoadingFallback />}><LawsuitApp /></Suspense>;
    case 'ai-revolution':
      return <Suspense fallback={<LoadingFallback />}><AIRevolutionApp /></Suspense>;
    case 'about':
      return <AboutContent />;
    default:
      if (appId.startsWith('tool:')) {
        return <Suspense fallback={<LoadingFallback text="Loading tool..." />}><ToolApp toolId={appId.slice(5)} /></Suspense>;
      }
      if (appId.startsWith('preview:')) {
        return <Suspense fallback={<LoadingFallback text="Loading preview..." />}><HtmlPreview previewId={appId.slice(8)} /></Suspense>;
      }
      return <PlaceholderContent appId={appId} />;
  }
}
