import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          padding: 32,
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#e0e0e0',
          background: '#1a1a2e',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}>
          <div style={{ fontSize: 48 }}>💥</div>
          <h2 style={{ margin: 0, fontSize: 20 }}>Something went wrong</h2>
          <p style={{ margin: 0, fontSize: 14, color: '#999', maxWidth: 400 }}>
            Agency RPG hit an unexpected error. Try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 8,
              padding: '10px 24px',
              borderRadius: 8,
              border: 'none',
              background: '#a8e6cf',
              color: '#1a1a2e',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Refresh
          </button>
          {this.state.error && (
            <details style={{ marginTop: 16, fontSize: 12, color: '#666', maxWidth: 500 }}>
              <summary style={{ cursor: 'pointer' }}>Error details</summary>
              <pre style={{ textAlign: 'left', whiteSpace: 'pre-wrap', marginTop: 8 }}>
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Lightweight boundary for individual windows/panels — shows inline error
 * instead of crashing the whole app.
 */
export class WindowErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[WindowErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: 24,
          textAlign: 'center',
          color: '#999',
          fontSize: 13,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ fontSize: 28 }}>⚠️</span>
          <span>This app crashed. Try reopening it.</span>
          {this.state.error && (
            <span style={{ fontSize: 11, color: '#666' }}>{this.state.error.message}</span>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
