import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);

    this.state = {
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React render error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <main className="listings-page">
          <section className="state-panel error-panel" role="alert">
            <p>Something went wrong while rendering the page.</p>
            <button type="button" onClick={this.handleReset}>
              Try Again
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
