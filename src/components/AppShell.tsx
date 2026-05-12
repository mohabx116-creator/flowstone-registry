import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useI18n } from "@/lib/i18n";

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="lg:ps-64">
        <Topbar onMenu={() => setOpen(true)} />
        <main className="px-4 md:px-6 lg:px-8 py-6 max-w-[1440px] mx-auto space-y-8">
          {children}
        </main>
        <footer className="px-4 md:px-6 lg:px-8 py-6 text-xs text-muted-foreground border-t border-border mt-12">
          <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row gap-2 justify-between">
            <p>© AssetFlow Registry — Demo</p>
            <p className="md:max-w-2xl md:text-end">{t("footer.disclaimer")}</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
