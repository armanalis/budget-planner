"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Language = "en" | "tr" | "it";

const LANGUAGE_STORAGE_KEY = "budget-planner-language";

const dictionary = {
  en: {
    appTitle: "Budget Planner",
    chooseUser: "Choose a user to continue.",
    loginAsAli: "Log in as Ali",
    loginAsZeynep: "Log in as Zeynep",
    signInTitle: "Sign in",
    signInSubtitle: "Use your household credentials.",
    email: "Email",
    password: "Password",
    signInButton: "Sign in",
    signingIn: "Signing in…",
    signInFailed: "Sign in failed. Check your credentials.",
    noHousehold: "No household profile found for this account.",
    loading: "Loading…",
    membersTitle: "Household members",
    noMembers: "No members yet.",
    logout: "Logout",
    activeMonth: "Active month",
    navDashboard: "Dashboard",
    navAddEntry: "Add Entry",
    navMembers: "Members",
    navAli: "Ali",
    navZeynep: "Zeynep",
    navJoint: "Joint",
    jointAccountTitle: "Joint Account",
    budgetTracker: "Budget Tracker",
    totalSpent: "Total Spent",
    jointTotal: "Joint Total",
    userTotal: "{name}'s Total",
    jointExpenses: "Joint Expenses",
    userExpenses: "{name}'s Expenses",
    noDataYet: "No data yet.",
    noNote: "No note added.",
    viewOnly: "View Only",
    noExpensesThisMonth: "No expenses for this month.",
    deleteExpense: "Delete expense",
    addExpense: "Add Expense",
    amount: "Amount",
    currency: "Currency",
    currencyEur: "EUR (€)",
    currencyTry: "TRY (₺)",
    exchangeRateTryEur: "Exchange Rate (TRY to EUR)",
    fetchingLiveRate: "Fetching live rate...",
    usingFallbackRate: "Using fallback rate.",
    liveRateLoaded: "Live rate loaded.",
    ledger: "Ledger",
    category: "Category",
    date: "Date",
    noteOptional: "Note (optional)",
    notePlaceholder: "Add a short note",
    saveExpense: "Save Expense",
    themeToggle: "Toggle color theme",
    language: "Language",
    category_movie_subscriptions: "Movie subscriptions",
    category_gym: "Gym",
    category_phone_plans: "Phone plans",
    category_rent: "Rent",
    category_groceries: "Groceries",
    category_eating_out: "Eating out",
    category_entertainment: "Entertainment",
    category_additional_expenses: "Additional expenses",
  },
  tr: {
    appTitle: "Bütçe Planlayıcı",
    chooseUser: "Devam etmek için bir kullanıcı seçin.",
    loginAsAli: "Ali olarak giriş yap",
    loginAsZeynep: "Zeynep olarak giriş yap",
    signInTitle: "Giriş yap",
    signInSubtitle: "Hane bilgilerinle giriş yap.",
    email: "E-posta",
    password: "Şifre",
    signInButton: "Giriş yap",
    signingIn: "Giriş yapılıyor…",
    signInFailed: "Giriş başarısız. Bilgileri kontrol et.",
    noHousehold: "Bu hesap için bir hane profili bulunamadı.",
    loading: "Yükleniyor…",
    membersTitle: "Hane üyeleri",
    noMembers: "Henüz üye yok.",
    logout: "Çıkış",
    activeMonth: "Aktif ay",
    navDashboard: "Panel",
    navAddEntry: "Kayıt ekle",
    navMembers: "Üyeler",
    navAli: "Ali",
    navZeynep: "Zeynep",
    navJoint: "Ortak",
    jointAccountTitle: "Ortak hesap",
    budgetTracker: "Bütçe takibi",
    totalSpent: "Toplam harcama",
    jointTotal: "Ortak toplam",
    userTotal: "{name} toplamı",
    jointExpenses: "Ortak giderler",
    userExpenses: "{name} giderleri",
    noDataYet: "Henüz veri yok.",
    noNote: "Not eklenmedi.",
    viewOnly: "Sadece goruntuleme",
    noExpensesThisMonth: "Bu ay için gider yok.",
    deleteExpense: "Gideri sil",
    addExpense: "Gider ekle",
    amount: "Tutar",
    currency: "Para birimi",
    currencyEur: "EUR (€)",
    currencyTry: "TRY (₺)",
    exchangeRateTryEur: "Kur (TRY → EUR)",
    fetchingLiveRate: "Canlı kur alınıyor...",
    usingFallbackRate: "Yedek kur kullanılıyor.",
    liveRateLoaded: "Canlı kur yüklendi.",
    ledger: "Kullanici",
    category: "Kategori",
    date: "Tarih",
    noteOptional: "Not (isteğe bağlı)",
    notePlaceholder: "Kısa bir not ekleyin",
    saveExpense: "Gideri kaydet",
    themeToggle: "Tema değiştir",
    language: "Dil",
    category_movie_subscriptions: "Film abonelikleri",
    category_gym: "Spor salonu",
    category_phone_plans: "Telefon faturalari",
    category_rent: "Kira",
    category_groceries: "Market",
    category_eating_out: "Disarida yeme",
    category_entertainment: "Eglence",
    category_additional_expenses: "Ekstra harcamalar",
  },
  it: {
    appTitle: "Pianificatore budget",
    chooseUser: "Scegli un utente per continuare.",
    loginAsAli: "Accedi come Ali",
    loginAsZeynep: "Accedi come Zeynep",
    signInTitle: "Accedi",
    signInSubtitle: "Usa le credenziali della tua famiglia.",
    email: "Email",
    password: "Password",
    signInButton: "Accedi",
    signingIn: "Accesso in corso…",
    signInFailed: "Accesso non riuscito. Controlla le credenziali.",
    noHousehold: "Nessun profilo famiglia trovato per questo account.",
    loading: "Caricamento…",
    membersTitle: "Membri della famiglia",
    noMembers: "Nessun membro ancora.",
    logout: "Esci",
    activeMonth: "Mese attivo",
    navDashboard: "Cruscotto",
    navAddEntry: "Aggiungi voce",
    navMembers: "Membri",
    navAli: "Ali",
    navZeynep: "Zeynep",
    navJoint: "Congiunto",
    jointAccountTitle: "Conto congiunto",
    budgetTracker: "Monitoraggio budget",
    totalSpent: "Totale speso",
    jointTotal: "Totale congiunto",
    userTotal: "Totale di {name}",
    jointExpenses: "Spese congiunte",
    userExpenses: "Spese di {name}",
    noDataYet: "Nessun dato ancora.",
    noNote: "Nessuna nota.",
    viewOnly: "Sola lettura",
    noExpensesThisMonth: "Nessuna spesa per questo mese.",
    deleteExpense: "Elimina spesa",
    addExpense: "Aggiungi spesa",
    amount: "Importo",
    currency: "Valuta",
    currencyEur: "EUR (€)",
    currencyTry: "TRY (₺)",
    exchangeRateTryEur: "Tasso di cambio (TRY → EUR)",
    fetchingLiveRate: "Recupero tasso in tempo reale...",
    usingFallbackRate: "Uso tasso di riserva.",
    liveRateLoaded: "Tasso live caricato.",
    ledger: "Registro",
    category: "Categoria",
    date: "Data",
    noteOptional: "Nota (facoltativa)",
    notePlaceholder: "Aggiungi una breve nota",
    saveExpense: "Salva spesa",
    themeToggle: "Cambia tema",
    language: "Lingua",
    category_movie_subscriptions: "Abbonamenti film",
    category_gym: "Palestra",
    category_phone_plans: "Piani telefonici",
    category_rent: "Affitto",
    category_groceries: "Spesa",
    category_eating_out: "Mangiare fuori",
    category_entertainment: "Intrattenimento",
    category_additional_expenses: "Spese aggiuntive",
  },
} as const;

export type TranslationKey = keyof typeof dictionary.en;

/** English values persisted on `Expense.category` */
export const EXPENSE_CATEGORY_ENGLISH = [
  "Movie subscriptions",
  "Gym",
  "Phone plans",
  "Rent",
  "Groceries",
  "Eating out",
  "Entertainment",
  "Additional expenses",
] as const;

export type ExpenseCategoryEnglish = (typeof EXPENSE_CATEGORY_ENGLISH)[number];

export const CATEGORY_TO_I18N_KEY: Record<
  ExpenseCategoryEnglish,
  TranslationKey
> = {
  "Movie subscriptions": "category_movie_subscriptions",
  Gym: "category_gym",
  "Phone plans": "category_phone_plans",
  Rent: "category_rent",
  Groceries: "category_groceries",
  "Eating out": "category_eating_out",
  Entertainment: "category_entertainment",
  "Additional expenses": "category_additional_expenses",
};

export function translateExpenseCategory(
  t: (key: TranslationKey, vars?: Record<string, string>) => string,
  storedCategory: string,
): string {
  const key = CATEGORY_TO_I18N_KEY[storedCategory as ExpenseCategoryEnglish];
  if (key) {
    return t(key);
  }
  return storedCategory;
}

type LanguageContextValue = {
  currentLanguage: Language;
  setCurrentLanguage: (lang: Language) => void;
  t: (key: TranslationKey, vars?: Record<string, string>) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);

function interpolate(
  template: string,
  vars?: Record<string, string>,
): string {
  if (!vars) {
    return template;
  }

  return Object.entries(vars).reduce((acc, [key, value]) => {
    const pattern = `{${key}}`;
    return acc.split(pattern).join(value);
  }, template);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguageState] = useState<Language>(() => {
    if (typeof window === "undefined") {
      return "en";
    }

    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === "en" || saved === "tr" || saved === "it") {
      return saved;
    }

    return "en";
  });

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);
  }, [currentLanguage]);

  const setCurrentLanguage = useCallback((lang: Language) => {
    setCurrentLanguageState(lang);
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string>) => {
      const table = dictionary[currentLanguage];
      const fallback = dictionary.en[key] ?? key;
      const raw = (table[key] as string | undefined) ?? fallback;
      return interpolate(raw, vars);
    },
    [currentLanguage],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      currentLanguage,
      setCurrentLanguage,
      t,
    }),
    [currentLanguage, setCurrentLanguage, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
