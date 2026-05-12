import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Locale = "en" | "ar";

type Dict = Record<string, string>;

const en: Dict = {
  "brand.name": "AssetFlow",
  "brand.tagline": "Institutional Registry",
  "nav.dashboard": "Dashboard",
  "nav.registry": "Registry",
  "nav.transfers": "Transfers",
  "nav.holdings": "Holdings",
  "nav.market": "Market",
  "nav.compliance": "Compliance",
  "nav.settings": "Settings",
  "topbar.search": "Search assets, entities, or TXIDs...",
  "topbar.notifications": "Notifications",
  "topbar.help": "Help",
  "user.role": "Registry Chief",
  "common.viewAll": "View all",
  "common.viewDetails": "View details",
  "common.export": "Export Report",
  "common.registerAsset": "Register Asset",
  "common.requestTransfer": "Request Transfer",
  "common.approve": "Approve Transfer",
  "common.reject": "Reject",
  "common.requestInfo": "Request Information",
  "common.blockAsset": "Block Asset",
  "common.search": "Search",
  "common.filter": "Filter",
  "common.status": "Status",
  "common.priority": "Priority",
  "common.all": "All",
  "common.high": "High",
  "common.medium": "Medium",
  "common.low": "Low",
  "common.created": "Created",
  "common.value": "Value",
  "common.type": "Type",
  "common.time": "Time",
  "status.pending": "Pending Review",
  "status.approved": "Approved",
  "status.rejected": "Rejected",
  "status.blocked": "Blocked",
  "status.expired": "Expired",
  "status.completed": "Completed",
  "kpi.totalAssets": "Total Assets",
  "kpi.activeHoldings": "Active Holdings",
  "kpi.pendingTransfers": "Pending Transfers",
  "kpi.complianceCases": "Compliance Cases",
  "kpi.tokenizedAssets": "Tokenized Assets",
  "dashboard.title": "Portfolio Overview",
  "dashboard.subtitle": "Real-time surveillance of institutional tokenized holdings.",
  "dashboard.allocation": "Asset Allocation",
  "dashboard.recentTransfers": "Recent Transfer Activity",
  "dashboard.complianceAlerts": "Compliance Alerts",
  "dashboard.registryHealth": "Registry Health",
  "dashboard.tokenizedPreview": "Tokenized Market Preview",
  "transfers.title": "Registry Transfer Hub",
  "transfers.subtitle": "Review, route and settle institutional ownership transfers.",
  "transfers.id": "Transfer ID",
  "transfers.asset": "Asset",
  "transfers.seller": "Seller",
  "transfers.buyer": "Buyer",
  "transfers.summary.open": "Open Transfers",
  "transfers.summary.value": "Aggregated Value",
  "transfers.summary.avgTime": "Avg. Settlement",
  "transfers.summary.flagged": "Flagged Cases",
  "transfer.title": "Transfer Case",
  "transfer.assetUnderReview": "Asset Under Review",
  "transfer.transferValue": "Transfer Value",
  "transfer.settlement": "Settlement Method",
  "transfer.sellerDetails": "Seller Details",
  "transfer.buyerDetails": "Buyer Details",
  "transfer.compliance": "Compliance Checklist",
  "transfer.documents": "Documents",
  "transfer.audit": "Audit Trail",
  "transfer.decision": "Decision Panel",
  "holding.title": "Holding Detail",
  "holding.registryId": "Registry ID",
  "holding.units": "Ownership Units",
  "holding.registryStatus": "Registry Status",
  "holding.complianceStatus": "Compliance Status",
  "holding.eligibility": "Transfer Eligibility",
  "holding.recent": "Recent Activity",
  "holding.audit": "Compliance Audit",
  "holding.governance": "Governance Rights",
  "market.modeRegistry": "Registry Mode",
  "market.modeTokenized": "Tokenized Market Mode",
  "market.title": "Tokenized Asset Market",
  "market.subtitle": "On-chain settlement layer for registered institutional assets.",
  "market.tokenPrice": "Token Price",
  "market.supply": "Available Supply",
  "market.settlement": "Settlement",
  "market.trade": "Trade Module",
  "market.orders": "Orders & Trades",
  "market.portfolio": "Tokenized Portfolio",
  "market.buy": "Buy",
  "market.sell": "Sell",
  "market.amount": "Amount",
  "market.total": "Total",
  "market.placeOrder": "Place Order",
  "footer.disclaimer":
    "This is a self-initiated frontend case study demo built to demonstrate registry transfer and tokenized asset UI workflows.",
  "lang.label": "Language",
  "theme.light": "Light",
  "theme.dark": "Dark",
};

const ar: Dict = {
  "brand.name": "أصيت فلو",
  "brand.tagline": "السجل المؤسسي",
  "nav.dashboard": "لوحة التحكم",
  "nav.registry": "السجل",
  "nav.transfers": "التحويلات",
  "nav.holdings": "الحيازات",
  "nav.market": "السوق",
  "nav.compliance": "الامتثال",
  "nav.settings": "الإعدادات",
  "topbar.search": "ابحث عن الأصول أو الجهات أو معرّفات المعاملات...",
  "topbar.notifications": "الإشعارات",
  "topbar.help": "المساعدة",
  "user.role": "رئيس السجل",
  "common.viewAll": "عرض الكل",
  "common.viewDetails": "عرض التفاصيل",
  "common.export": "تصدير التقرير",
  "common.registerAsset": "تسجيل أصل",
  "common.requestTransfer": "طلب تحويل",
  "common.approve": "قبول التحويل",
  "common.reject": "رفض",
  "common.requestInfo": "طلب معلومات",
  "common.blockAsset": "حظر الأصل",
  "common.search": "بحث",
  "common.filter": "تصفية",
  "common.status": "الحالة",
  "common.priority": "الأولوية",
  "common.all": "الكل",
  "common.high": "عالية",
  "common.medium": "متوسطة",
  "common.low": "منخفضة",
  "common.created": "تاريخ الإنشاء",
  "common.value": "القيمة",
  "common.type": "النوع",
  "common.time": "الوقت",
  "status.pending": "قيد المراجعة",
  "status.approved": "مقبول",
  "status.rejected": "مرفوض",
  "status.blocked": "محظور",
  "status.expired": "منتهي",
  "status.completed": "مكتمل",
  "kpi.totalAssets": "إجمالي الأصول",
  "kpi.activeHoldings": "الحيازات النشطة",
  "kpi.pendingTransfers": "التحويلات قيد المراجعة",
  "kpi.complianceCases": "قضايا الامتثال",
  "kpi.tokenizedAssets": "الأصول المرمّزة",
  "dashboard.title": "نظرة عامة على المحفظة",
  "dashboard.subtitle": "مراقبة لحظية للحيازات المرمّزة المؤسسية.",
  "dashboard.allocation": "توزيع الأصول",
  "dashboard.recentTransfers": "نشاط التحويلات الأخير",
  "dashboard.complianceAlerts": "تنبيهات الامتثال",
  "dashboard.registryHealth": "حالة السجل",
  "dashboard.tokenizedPreview": "معاينة السوق المرمّز",
  "transfers.title": "مركز تحويلات السجل",
  "transfers.subtitle": "مراجعة وتوجيه وتسوية تحويلات الملكية المؤسسية.",
  "transfers.id": "رقم التحويل",
  "transfers.asset": "الأصل",
  "transfers.seller": "البائع",
  "transfers.buyer": "المشتري",
  "transfers.summary.open": "التحويلات المفتوحة",
  "transfers.summary.value": "القيمة الإجمالية",
  "transfers.summary.avgTime": "متوسط زمن التسوية",
  "transfers.summary.flagged": "الحالات الموسومة",
  "transfer.title": "ملف التحويل",
  "transfer.assetUnderReview": "الأصل قيد المراجعة",
  "transfer.transferValue": "قيمة التحويل",
  "transfer.settlement": "طريقة التسوية",
  "transfer.sellerDetails": "بيانات البائع",
  "transfer.buyerDetails": "بيانات المشتري",
  "transfer.compliance": "قائمة فحوصات الامتثال",
  "transfer.documents": "المستندات",
  "transfer.audit": "سجل التدقيق",
  "transfer.decision": "لوحة القرار",
  "holding.title": "تفاصيل الحيازة",
  "holding.registryId": "معرّف السجل",
  "holding.units": "وحدات الملكية",
  "holding.registryStatus": "حالة التسجيل",
  "holding.complianceStatus": "حالة الامتثال",
  "holding.eligibility": "أهلية التحويل",
  "holding.recent": "النشاط الأخير",
  "holding.audit": "تدقيق الامتثال",
  "holding.governance": "حقوق الحوكمة",
  "market.modeRegistry": "وضع السجل",
  "market.modeTokenized": "وضع السوق المرمّز",
  "market.title": "سوق الأصول المرمّزة",
  "market.subtitle": "طبقة التسوية الرقمية للأصول المؤسسية المسجّلة.",
  "market.tokenPrice": "سعر الرمز",
  "market.supply": "العرض المتاح",
  "market.settlement": "حالة التسوية",
  "market.trade": "وحدة التداول",
  "market.orders": "الأوامر والصفقات",
  "market.portfolio": "المحفظة المرمّزة",
  "market.buy": "شراء",
  "market.sell": "بيع",
  "market.amount": "الكمية",
  "market.total": "الإجمالي",
  "market.placeOrder": "تنفيذ الأمر",
  "footer.disclaimer":
    "هذا عرض توضيحي ذاتي للواجهة الأمامية أُعدّ لإظهار سير عمل تحويلات السجل وواجهات الأصول المرمّزة.",
  "lang.label": "اللغة",
  "theme.light": "فاتح",
  "theme.dark": "داكن",
};

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
