import React, { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  handleRefresh = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={styles.container}>
          <div style={styles.content}>
            <div style={styles.icon}>⚠️</div>
            <h2 style={styles.title}>문제가 발생했습니다</h2>
            <p style={styles.message}>
              예기치 않은 오류가 발생했습니다.
              <br />
              잠시 후 다시 시도해주세요.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <details style={styles.details}>
                <summary style={styles.summary}>오류 상세 정보</summary>
                <pre style={styles.errorText}>
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <div style={styles.buttons}>
              <button onClick={this.handleRetry} style={styles.retryButton}>
                다시 시도
              </button>
              <button onClick={this.handleRefresh} style={styles.refreshButton}>
                새로고침
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '20px',
    backgroundColor: 'var(--color-background, #f5f5f5)',
  },
  content: {
    textAlign: 'center',
    maxWidth: '400px',
    padding: '32px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
  },
  icon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  title: {
    margin: '0 0 12px 0',
    fontSize: '20px',
    fontWeight: 600,
    color: 'var(--color-text, #333)',
  },
  message: {
    margin: '0 0 24px 0',
    fontSize: '14px',
    color: 'var(--color-text-secondary, #666)',
    lineHeight: 1.6,
  },
  details: {
    marginBottom: '24px',
    textAlign: 'left',
  },
  summary: {
    cursor: 'pointer',
    fontSize: '12px',
    color: 'var(--color-text-tertiary, #999)',
    marginBottom: '8px',
  },
  errorText: {
    fontSize: '11px',
    color: '#ef4444',
    backgroundColor: '#fef2f2',
    padding: '12px',
    borderRadius: '6px',
    overflow: 'auto',
    maxHeight: '150px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  buttons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  retryButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
    color: 'white',
    backgroundColor: 'var(--color-primary, #3b82f6)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  refreshButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--color-text, #333)',
    backgroundColor: 'var(--color-background-secondary, #f0f0f0)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};

export default ErrorBoundary;
