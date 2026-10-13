import { Component } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, retryKey: 0 };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Page error caught by ErrorBoundary:", error, info);
  }

  // When parent changes key (e.g. page navigation), clear error automatically
  componentDidUpdate(prevProps) {
    if (prevProps.children !== this.props.children && this.state.error) {
      this.setState({ error: null });
    }
  }

  handleRetry = () => {
    this.setState((s) => ({ error: null, retryKey: s.retryKey + 1 }));
  };

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <div className="max-w-sm w-full rounded-2xl border border-rose-500/20 bg-rose-500/5 backdrop-blur-xl p-6 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/10 flex items-center justify-center mb-4">
              <AlertTriangle size={22} className="text-rose-400" />
            </div>
            <h3 className="text-white font-semibold mb-1">Something went wrong</h3>
            <p className="text-sm text-slate-400 mb-5">
              This section hit an unexpected error. Click Try again — you will not lose the rest of the app.
            </p>
            <button onClick={this.handleRetry} className="btn-primary mx-auto">
              <RotateCcw size={14} /> Try again
            </button>
          </div>
        </div>
      );
    }
    // retryKey forces children to remount cleanly after error
    return <div key={this.state.retryKey}>{this.props.children}</div>;
  }
}
