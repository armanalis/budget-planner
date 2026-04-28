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
    noAccountYet: "New here?",
    createAccountLink: "Create an account",
    signUpTitle: "Create account",
    signUpSubtitle:
      "One quick step: we send a single email with a link to verify your address.",
    displayName: "Your name",
    displayNamePlaceholder: "e.g. Alex",
    householdName: "Household name",
    householdNamePlaceholder: "e.g. Home Budget",
    confirmPassword: "Confirm password",
    signUpButton: "Create account",
    creatingAccount: "Creating account…",
    checkEmailTitle: "Check your email",
    checkEmailBody:
      "We sent a verification link. Open it once to activate your account, then sign in.",
    alreadyHaveAccount: "Already have an account?",
    signInInstead: "Sign in",
    passwordsMustMatch: "Passwords must match.",
    passwordTooShort: "Password must be at least 6 characters.",
    signUpFailed: "Could not create account. Try again.",
    signUpCallbackFailed:
      "We could not finish sign-in from that link. Try signing in with your password.",
    signUpProvisionFailed:
      "Account created, but we could not set up your household profile. Please try signing in again.",
    backToSignIn: "Back to sign in",
    noHousehold: "No household profile found for this account.",
    loading: "Loading…",
    pendingTitle: "Waiting for approval",
    pendingBody:
      "We sent your request to join {household} to its owner. You'll be in as soon as they approve.",
    pendingNoHousehold: "Your join request is pending.",
    pendingRefresh: "Check again",
    pendingSignOut: "Sign out",
    notificationsTitle: "Notifications",
    notificationsEmpty: "No notifications yet.",
    notificationMarkRead: "Mark as read",
    notificationApprove: "Approve",
    notificationReject: "Reject",
    notificationJoinRequestReceived:
      "{name} ({email}) wants to join {household}.",
    notificationJoinRequestApproved:
      "You're in! Your request to join {household} was approved.",
    notificationJoinRequestRejected:
      "Your request to join {household} was declined.",
    notificationActionFailed: "Could not complete that action.",
    navNotifications: "Inbox",
    unread: "Unread",
    membersTitle: "Household members",
    noMembers: "No members yet.",
    householdLabel: "Household",
    ownerBadge: "Owner",
    youBadge: "You",
    membersCount: "{count} member",
    membersCountPlural: "{count} members",
    inviteHint:
      "Share this household name so new members type it on sign-up to request to join.",
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
    note: "Note",
    actions: "Actions",
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
    navSettings: "Settings",
    settingsTitle: "Settings",
    settingsAccountSection: "Account",
    settingsAccountSubtitle: "How you appear and sign in.",
    settingsSecuritySection: "Security",
    settingsSecuritySubtitle: "Update your password to keep your account safe.",
    settingsPreferencesSection: "Preferences",
    settingsPreferencesSubtitle: "Theme and language.",
    settingsDisplayName: "Display name",
    settingsEmail: "Email",
    changePasswordTitle: "Change password",
    currentPassword: "Current password",
    newPassword: "New password",
    confirmNewPassword: "Confirm new password",
    updatePassword: "Update password",
    updatingPassword: "Updating…",
    passwordUpdated: "Password updated.",
    currentPasswordWrong: "Current password is incorrect.",
    passwordUpdateFailed: "Could not update password. Try again.",
    newPasswordSameAsCurrent: "New password must differ from the current one.",
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
    noAccountYet: "İlk kez mi?",
    createAccountLink: "Hesap oluştur",
    signUpTitle: "Hesap oluştur",
    signUpSubtitle:
      "Tek adım: adresini doğrulamak için bir e-posta gönderiyoruz.",
    displayName: "Adın",
    displayNamePlaceholder: "ör. Ayşe",
    householdName: "Hane adı",
    householdNamePlaceholder: "ör. Ev Bütçesi",
    confirmPassword: "Şifre (tekrar)",
    signUpButton: "Hesap oluştur",
    creatingAccount: "Hesap oluşturuluyor…",
    checkEmailTitle: "E-postanı kontrol et",
    checkEmailBody:
      "Doğrulama bağlantısı gönderdik. Hesabı açmak için bir kez tıkla, sonra buradan giriş yap.",
    alreadyHaveAccount: "Zaten hesabın var mı?",
    signInInstead: "Giriş yap",
    passwordsMustMatch: "Şifreler eşleşmiyor.",
    passwordTooShort: "Şifre en az 6 karakter olmalı.",
    signUpFailed: "Hesap oluşturulamadı. Tekrar dene.",
    signUpCallbackFailed:
      "Bağlantıyla giriş tamamlanamadı. Şifrenle giriş yapmayı dene.",
    signUpProvisionFailed:
      "Hesap oluşturuldu ama hane profili hazırlanamadı. Lütfen tekrar giriş yapmayı dene.",
    backToSignIn: "Girişe dön",
    noHousehold: "Bu hesap için bir hane profili bulunamadı.",
    loading: "Yükleniyor…",
    pendingTitle: "Onay bekleniyor",
    pendingBody:
      "{household} hanesine katılma isteğin sahibine gönderildi. Onaylar onaylamaz erişimin açılır.",
    pendingNoHousehold: "Katılma isteğin onay bekliyor.",
    pendingRefresh: "Tekrar kontrol et",
    pendingSignOut: "Çıkış",
    notificationsTitle: "Bildirimler",
    notificationsEmpty: "Henüz bildirim yok.",
    notificationMarkRead: "Okundu işaretle",
    notificationApprove: "Onayla",
    notificationReject: "Reddet",
    notificationJoinRequestReceived:
      "{name} ({email}) {household} hanesine katılmak istiyor.",
    notificationJoinRequestApproved:
      "Hoş geldin! {household} hanesine katılma isteğin onaylandı.",
    notificationJoinRequestRejected:
      "{household} hanesine katılma isteğin reddedildi.",
    notificationActionFailed: "İşlem tamamlanamadı.",
    navNotifications: "Bildirimler",
    unread: "Okunmamış",
    membersTitle: "Hane üyeleri",
    noMembers: "Henüz üye yok.",
    householdLabel: "Hane",
    ownerBadge: "Sahibi",
    youBadge: "Sen",
    membersCount: "{count} üye",
    membersCountPlural: "{count} üye",
    inviteHint:
      "Yeni üyelerin katılma isteği gönderebilmesi için kayıt sırasında bu hane adını yazmasını söyle.",
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
    note: "Not",
    actions: "İşlemler",
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
    navSettings: "Ayarlar",
    settingsTitle: "Ayarlar",
    settingsAccountSection: "Hesap",
    settingsAccountSubtitle: "Görünüşün ve giriş bilgilerin.",
    settingsSecuritySection: "Güvenlik",
    settingsSecuritySubtitle: "Hesabını güvende tutmak için şifreni güncelle.",
    settingsPreferencesSection: "Tercihler",
    settingsPreferencesSubtitle: "Tema ve dil.",
    settingsDisplayName: "Görünen ad",
    settingsEmail: "E-posta",
    changePasswordTitle: "Şifre değiştir",
    currentPassword: "Mevcut şifre",
    newPassword: "Yeni şifre",
    confirmNewPassword: "Yeni şifre (tekrar)",
    updatePassword: "Şifreyi güncelle",
    updatingPassword: "Güncelleniyor…",
    passwordUpdated: "Şifre güncellendi.",
    currentPasswordWrong: "Mevcut şifre hatalı.",
    passwordUpdateFailed: "Şifre güncellenemedi. Tekrar dene.",
    newPasswordSameAsCurrent: "Yeni şifre, mevcut şifreyle aynı olamaz.",
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
    noAccountYet: "Prima volta?",
    createAccountLink: "Crea un account",
    signUpTitle: "Crea account",
    signUpSubtitle:
      "Un solo passaggio: inviamo un’email con un link per verificare il tuo indirizzo.",
    displayName: "Il tuo nome",
    displayNamePlaceholder: "es. Alex",
    householdName: "Nome famiglia",
    householdNamePlaceholder: "es. Budget Casa",
    confirmPassword: "Conferma password",
    signUpButton: "Crea account",
    creatingAccount: "Creazione account…",
    checkEmailTitle: "Controlla l’email",
    checkEmailBody:
      "Ti abbiamo inviato un link di verifica. Aprilo una volta per attivare l’account, poi accedi qui.",
    alreadyHaveAccount: "Hai già un account?",
    signInInstead: "Accedi",
    passwordsMustMatch: "Le password non coincidono.",
    passwordTooShort: "La password deve avere almeno 6 caratteri.",
    signUpFailed: "Impossibile creare l’account. Riprova.",
    signUpCallbackFailed:
      "Impossibile completare l’accesso da quel link. Prova ad accedere con la password.",
    signUpProvisionFailed:
      "Account creato, ma non siamo riusciti a configurare il profilo famiglia. Prova ad accedere di nuovo.",
    backToSignIn: "Torna all’accesso",
    noHousehold: "Nessun profilo famiglia trovato per questo account.",
    loading: "Caricamento…",
    pendingTitle: "In attesa di approvazione",
    pendingBody:
      "Abbiamo inviato la richiesta di unirti a {household} al proprietario. Avrai accesso non appena approverà.",
    pendingNoHousehold: "La tua richiesta è in attesa.",
    pendingRefresh: "Ricontrolla",
    pendingSignOut: "Esci",
    notificationsTitle: "Notifiche",
    notificationsEmpty: "Ancora nessuna notifica.",
    notificationMarkRead: "Segna come letta",
    notificationApprove: "Approva",
    notificationReject: "Rifiuta",
    notificationJoinRequestReceived:
      "{name} ({email}) vuole unirsi a {household}.",
    notificationJoinRequestApproved:
      "Sei dentro! La tua richiesta per {household} è stata approvata.",
    notificationJoinRequestRejected:
      "La tua richiesta per unirti a {household} è stata rifiutata.",
    notificationActionFailed: "Non è stato possibile completare l’operazione.",
    navNotifications: "Notifiche",
    unread: "Non lette",
    membersTitle: "Membri della famiglia",
    noMembers: "Nessun membro ancora.",
    householdLabel: "Famiglia",
    ownerBadge: "Proprietario",
    youBadge: "Tu",
    membersCount: "{count} membro",
    membersCountPlural: "{count} membri",
    inviteHint:
      "Condividi questo nome famiglia: i nuovi membri devono digitarlo in fase di iscrizione per richiedere l’accesso.",
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
    note: "Nota",
    actions: "Azioni",
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
    navSettings: "Impostazioni",
    settingsTitle: "Impostazioni",
    settingsAccountSection: "Account",
    settingsAccountSubtitle: "Come appari e accedi.",
    settingsSecuritySection: "Sicurezza",
    settingsSecuritySubtitle:
      "Aggiorna la password per tenere l'account al sicuro.",
    settingsPreferencesSection: "Preferenze",
    settingsPreferencesSubtitle: "Tema e lingua.",
    settingsDisplayName: "Nome visualizzato",
    settingsEmail: "Email",
    changePasswordTitle: "Cambia password",
    currentPassword: "Password attuale",
    newPassword: "Nuova password",
    confirmNewPassword: "Conferma nuova password",
    updatePassword: "Aggiorna password",
    updatingPassword: "Aggiornamento…",
    passwordUpdated: "Password aggiornata.",
    currentPasswordWrong: "La password attuale non è corretta.",
    passwordUpdateFailed: "Impossibile aggiornare la password. Riprova.",
    newPasswordSameAsCurrent:
      "La nuova password deve essere diversa da quella attuale.",
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
