import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {error: Error | null}> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return React.createElement('div', {style: {color: '#ff6b6b', padding: 40, background: '#1a1a2e', minHeight: '100vh', fontFamily: 'monospace'}},
        React.createElement('h1', {style: {color: 'white', marginBottom: 20}}, 'App crashed:'),
        React.createElement('pre', {style: {whiteSpace: 'pre-wrap', fontSize: 14}}, this.state.error.message),
        React.createElement('pre', {style: {whiteSpace: 'pre-wrap', fontSize: 12, marginTop: 10, color: '#999'}}, this.state.error.stack)
      );
    }
    return this.props.children;
  }
}

import App from './app/App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
