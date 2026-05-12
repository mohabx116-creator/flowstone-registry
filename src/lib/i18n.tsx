import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Locale = "en" | "ar";

type Dict = Record<string, string>;

import { en } from "@/messages/en";
import { ar } from "@/messages/ar";

const dictionaries: Record<Locale, Dict> = { en, ar };

interface I18nCtx {
  locale: Locale;
  dir: "ltr" | "rtl";
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return "en";
    return (localStorage.getItem("af.locale") as Locale) || "en";
  });

  const dir: "ltr" | "rtl" = locale === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    localStorage.setItem("af.locale", locale);
  }, [locale, dir]);

  const value = useMemo<I18nCtx>(
    () => ({
      locale,
      dir,
      setLocale: setLocaleState,
      t: (key) => dictionaries[locale][key] ?? dictionaries.en[key] ?? key,
    }),
    [locale, dir],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
