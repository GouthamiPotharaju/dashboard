import { createFileRoute, Outlet, redirect, useNavigate, Link } from "@tanstack/react-router";
import { clearToken, getToken } from "@/lib/api";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: () => {
    if (typeof document === "undefined") return;
    if (!getToken()) {
      throw redirect({ to: "/login" });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  const navigate = useNavigate();
  function onLogout() {
    clearToken();
    navigate({ to: "/login" });
  }
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Link
            to="/"
            aria-label="Go Business home"
            className="font-extrabold text-2xl tracking-tight text-primary"
          >
            Go Business
          </Link>
          <nav aria-label="Primary" className="flex items-center gap-3">
            <a
              href="#try"
              className="inline-flex items-center rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Try for free
            </a>
            <button
              onClick={onLogout}
              className="inline-flex items-center rounded-full border border-destructive/40 text-destructive px-5 py-2 text-sm font-semibold hover:bg-destructive/10 transition-colors"
            >
              Log out
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-card mt-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <p className="font-extrabold text-lg text-primary">Go Business</p>
          <nav aria-label="Footer" className="flex gap-6 text-sm text-muted-foreground">
            <a href="#about" className="hover:text-foreground">About</a>
            <a href="#contact" className="hover:text-foreground">Contact</a>
            <a href="#privacy" className="hover:text-foreground">Privacy</a>
            <a href="#terms" className="hover:text-foreground">Terms</a>
          </nav>
          <p className="text-xs text-muted-foreground">© 2024 Go Business Inc.</p>
        </div>
      </footer>
    </div>
  );
}