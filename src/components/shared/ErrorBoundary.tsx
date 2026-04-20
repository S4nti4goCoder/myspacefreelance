import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fullScreen?: boolean;
  resetKeys?: unknown[];
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: Props) {
    if (!this.state.hasError || !this.props.resetKeys) return;
    const changed = this.props.resetKeys.some(
      (key, i) => key !== prevProps.resetKeys?.[i],
    );
    if (changed) this.setState({ hasError: false });
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  reset = () => this.setState({ hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;

    const containerClass = this.props.fullScreen
      ? "flex h-screen items-center justify-center bg-background"
      : "flex min-h-[60vh] items-center justify-center p-6";

    return (
      <div className={containerClass}>
        <div className="flex flex-col items-center gap-4 max-w-sm text-center">
          <div className="bg-destructive/10 rounded-full p-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Algo salió mal</h1>
          <p className="text-sm text-muted-foreground">
            Ocurrió un error inesperado en esta sección. Puedes intentar de
            nuevo o recargar la página.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={this.reset}>
              Reintentar
            </Button>
            <Button onClick={() => window.location.reload()}>
              Recargar página
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
