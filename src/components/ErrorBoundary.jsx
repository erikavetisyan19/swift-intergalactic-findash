import React from 'react';
import { AlertTriangle, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Application Render Error caught by Global Boundary:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-darker)', color: 'white', padding: '2rem', textAlign: 'center' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', display: 'grid', placeItems: 'center', marginBottom: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <AlertTriangle size={32} />
                    </div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: 600 }}>Something went wrong.</h1>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', marginBottom: '2rem', lineHeight: 1.6 }}>
                        The application encountered an unexpected error while loading this page.
                        {this.state.error && this.state.error.message.includes('Loading chunk') &&
                            " A background update may have occurred. Please refresh the page."}
                    </p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn btn-outline" onClick={() => window.location.reload()}>
                            Refresh Page
                        </button>
                        <button className="btn btn-primary" onClick={() => window.location.href = '/'}>
                            <Home size={18} />
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
