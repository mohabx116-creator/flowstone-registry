import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { isAuthenticated } from "@/lib/auth-storage";
import { useI18n } from "@/lib/i18n";

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const { t } = useI18n();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate({ to: "/" });
      return;
    }

    setAuthChecked(true);
  }, [navigate]);

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <h1 className="font-display text-xl font-semibold">
            FlowStone Registry
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Checking your session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar open={open} onClose={() => setOpen(false)} />

      <div className="lg:ps-64">
        <Topbar onMenu={() => setOpen(true)} />

        <main className="mx-auto max-w-[1440px] space-y-8 px-4 py-6 md:px-6 lg:px-8">
          {children}
        </main>

        <footer className="mt-12 border-t border-border px-4 py-6 text-xs text-muted-foreground md:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-2 md:flex-row">
            <p>© FlowStone Registry — Demo</p>
            <p className="md:max-w-2xl md:text-end">
              {t("footer.disclaimer")}
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}