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
    navMessages: "Messages",
    messagesTitle: "Household chat",
    messagesEmpty: "No messages yet. Be the first to say hi.",
    messageInputPlaceholder: "Write a message…",
    sendMessage: "Send",
    sendingMessage: "Sending…",
    deleteMessage: "Delete message",
    unknownMember: "Unknown member",
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
    main_housing: "Housing",
    main_food: "Food",
    main_entertainment: "Entertainment",
    main_saving: "Saving",
    main_other: "Other",
    expenseMainCategory: "Main category",
    expenseSubCategory: "Sub-category",
    expenseNoSubcategory: "No sub-category",
    expenseSubcategoryOptional: "Optional for overflow categories like Other.",
    navSettings: "Settings",
    settingsTitle: "Settings",
    settingsAccountSection: "Account",
    settingsAccountSubtitle: "How you appear and sign in.",
    settingsHouseholdSection: "Household",
    settingsHouseholdSubtitle: "Update the household name everyone sees.",
    settingsHouseholdOwnerOnly: "Only the household owner can change the name.",
    settingsRenameHousehold: "Save",
    settingsRenamingHousehold: "Saving…",
    settingsHouseholdRenamed: "Household name updated.",
    settingsHouseholdRenameFailed: "Could not update the household name.",
    settingsHouseholdNameUnchanged: "Pick a new name to save.",
    settingsHouseholdNameTaken: "Another household already uses that name.",
    settingsDeleteHousehold: "Delete household",
    settingsDeletingHousehold: "Deleting…",
    settingsDeleteHouseholdWarning:
      "This permanently deletes the active household and all its expenses, messages, budgets, recurring rules, and memberships.",
    settingsDeleteHouseholdConfirm:
      "Type DELETE to confirm household deletion.",
    settingsDeleteHouseholdConfirmLabel: "Confirmation",
    settingsDeleteHouseholdConfirmPlaceholder: "DELETE",
    settingsDeleteHouseholdFailed: "Could not delete the household.",
    settingsMoreHouseholdsSection: "Multiple households",
    settingsMoreHouseholdsBody:
      "Your account can belong to several households at once—for example separate homes or budgets. Open the dropdown next to your household name (sidebar on desktop, header on mobile) to switch. Add or join another one using the button below.",
    settingsMembershipSummary: "Household memberships: {count}",
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
    balancesTitle: "Balances",
    balancesEmpty: "No joint expenses for this month yet.",
    balancesFairShare: "Fair share / person",
    balancesPaidLabel: "Paid",
    balanceOwes: "Owes",
    balanceIsOwed: "Is Owed",
    balanceSettledUp: "Settled Up",
    exportDataTitle: "Export Data",
    exportDataSubtitle:
      "Download every expense as a CSV file you can open in Excel or Google Sheets.",
    downloadCSV: "Download CSV",
    exportEmpty: "No expenses to export yet.",
    trendsTitle: "Spending Trends",
    trendsTotalLabel: "Total",
    trendsEmpty: "No trend data available",
    budgetsTitle: "Budgets",
    budgetsSubtitle:
      "Set a monthly limit per category. Bars on the dashboard track your spending against each limit.",
    budgetMainCategoriesTitle: "Main category limits",
    budgetSubcategoriesTitle: "Sub-category limits",
    budgetSubcategoryName: "Sub-category name",
    budgetSubcategoryLimit: "Sub-category limit",
    budgetAddSubcategory: "Add sub-category",
    budgetNoSubcategories: "No sub-categories yet.",
    budgetAllocated: "Allocated",
    budgetMainLimitExceeded:
      "Main category limit must be greater than or equal to all sub-category limits.",
    budgetSubLimitExceeded:
      "Sub-category limits cannot exceed their main category limit.",
    budgetOverflowOtherHint:
      "Other works as an overflow bucket and does not need planned sub-categories.",
    budgetsDashboardSubtitle:
      "Spending this month against your set limits.",
    setLimit: "Set Limit",
    saving: "Saving…",
    overBudget: "Over Budget!",
    spentLabel: "Spent",
    ofLabel: "of",
    budgetsEmpty: "No budgets set yet. Add one from Settings.",
    recurringMakeMonthly: "Make this a monthly recurring expense",
    recurringSectionTitle: "Recurring Expenses",
    recurringSectionSubtitle:
      "Subscriptions and bills that repeat each month. Run the processor on the 1st of the month to auto-create the next batch of expenses.",
    recurringProcessButton: "Process Recurring",
    recurringProcessing: "Processing…",
    recurringProcessSuccess: "Recurring expenses processed successfully",
    recurringProcessNothing: "No recurring expenses are due right now.",
    recurringProcessFailed: "Could not process recurring expenses.",
    recurringEmpty: "No recurring expenses yet.",
    recurringNextRun: "Next run",
    recurringDelete: "Delete recurring expense",
    switchHousehold: "Switch Household",
    createOrJoinAnother: "Create or Join another household",
    activeBadge: "Active",
    onboardingTitle: "Add another household",
    onboardingSubtitle:
      "You can belong to as many households as you like and switch between them at any time.",
    onboardingCreateTitle: "Create new household",
    onboardingCreateSubtitle:
      "Start a fresh shared budget. You'll automatically become its owner.",
    onboardingCreateAction: "Create household",
    onboardingCreating: "Creating…",
    onboardingJoinTitle: "Join with household name",
    onboardingJoinSubtitle:
      "Type the exact household name. If it exists, you'll join and switch to it.",
    onboardingJoinPlaceholder: "Household name",
    onboardingJoinNamePlaceholder: "e.g. Home Budget",
    onboardingJoinAction: "Join household",
    onboardingJoining: "Joining…",
    onboardingJoinNameRequired: "Please write a household name.",
    onboardingMultipleHouseholdsFound:
      "More than one household uses that name. Ask the owner to rename theirs to something unique.",
    onboardingHouseholdNotFound:
      "We couldn't find a household with that name. Check the spelling with the owner.",
    onboardingAlreadyMember:
      "You're already a member of this household. Switching to it now.",
    onboardingNameTaken: "That household name is already in use.",
    onboardingCreateFailed: "Could not create the household. Try again.",
    onboardingJoinFailed: "Could not join the household. Try again.",
    onboardingNamePlaceholder: "Household name",
    onboardingBackToApp: "Back to dashboard",
  },
  tr: {
    appTitle: "Bütçe Planlayıcı",
    signInTitle: "Giriş yap",
    signInSubtitle: "Hesap bilgilerinle giriş yap.",
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
    householdName: "Ev adı",
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
      "Hesap oluşturuldu ama ev profili hazırlanamadı. Lütfen tekrar giriş yapmayı dene.",
    backToSignIn: "Girişe dön",
    noHousehold: "Bu hesap için bir ev profili bulunamadı.",
    loading: "Yükleniyor…",
    pendingTitle: "Onay bekleniyor",
    pendingBody:
      "{household} evine katılma isteğin sahibine gönderildi. Onaylar onaylamaz erişimin açılır.",
    pendingNoHousehold: "Katılma isteğin onay bekliyor.",
    pendingRefresh: "Tekrar kontrol et",
    pendingSignOut: "Çıkış",
    notificationsTitle: "Bildirimler",
    notificationsEmpty: "Henüz bildirim yok.",
    notificationMarkRead: "Okundu işaretle",
    notificationApprove: "Onayla",
    notificationReject: "Reddet",
    notificationJoinRequestReceived:
      "{name} ({email}) {household} evine katılmak istiyor.",
    notificationJoinRequestApproved:
      "Hoş geldin! {household} evine katılma isteğin onaylandı.",
    notificationJoinRequestRejected:
      "{household} evine katılma isteğin reddedildi.",
    notificationActionFailed: "İşlem tamamlanamadı.",
    navNotifications: "Bildirimler",
    unread: "Okunmamış",
    navMessages: "Mesajlar",
    messagesTitle: "Ev sohbeti",
    messagesEmpty: "Henüz mesaj yok. İlk merhabayı sen söyle.",
    messageInputPlaceholder: "Bir mesaj yaz…",
    sendMessage: "Gönder",
    sendingMessage: "Gönderiliyor…",
    deleteMessage: "Mesajı sil",
    unknownMember: "Bilinmeyen üye",
    membersTitle: "Ev üyeleri",
    noMembers: "Henüz üye yok.",
    householdLabel: "Ev",
    ownerBadge: "Sahibi",
    youBadge: "Sen",
    membersCount: "{count} üye",
    membersCountPlural: "{count} üye",
    inviteHint:
      "Yeni üyelerin katılma isteği gönderebilmesi için kayıt sırasında bu ev adını yazmasını söyle.",
    logout: "Çıkış",
    activeMonth: "Aktif ay",
    navDashboard: "Panel",
    navAddEntry: "Kayıt ekle",
    navMembers: "Üyeler",
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
    viewOnly: "Sadece görüntüleme",
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
    ledger: "Kullanıcı",
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
    category_phone_plans: "Telefon faturaları",
    category_rent: "Kira",
    category_groceries: "Market",
    category_eating_out: "Dışarıda yemek",
    category_entertainment: "Eğlence",
    category_additional_expenses: "Ekstra harcamalar",
    navSettings: "Ayarlar",
    settingsTitle: "Ayarlar",
    settingsAccountSection: "Hesap",
    settingsAccountSubtitle: "Görünüşün ve giriş bilgilerin.",
    settingsHouseholdSection: "Ev",
    settingsHouseholdSubtitle: "Herkesin gördüğü ev adını güncelle.",
    settingsHouseholdOwnerOnly: "Yalnızca evin sahibi adı değiştirebilir.",
    settingsRenameHousehold: "Kaydet",
    settingsRenamingHousehold: "Kaydediliyor…",
    settingsHouseholdRenamed: "Ev adı güncellendi.",
    settingsHouseholdRenameFailed: "Ev adı güncellenemedi.",
    settingsHouseholdNameUnchanged: "Kaydetmek için yeni bir ad seç.",
    settingsHouseholdNameTaken: "Bu adı başka bir ev kullanıyor.",
    settingsDeleteHousehold: "Evi sil",
    settingsDeletingHousehold: "Siliniyor…",
    settingsDeleteHouseholdWarning:
      "Bu işlem aktif evi ve içindeki tüm giderleri, mesajları, bütçeleri, düzenli harcama kurallarını ve üyelikleri kalıcı olarak siler.",
    settingsDeleteHouseholdConfirm:
      "Ev silmeyi onaylamak için DELETE yazın.",
    settingsDeleteHouseholdConfirmLabel: "Onay",
    settingsDeleteHouseholdConfirmPlaceholder: "DELETE",
    settingsDeleteHouseholdFailed: "Ev silinemedi.",
    settingsMoreHouseholdsSection: "Birden fazla ev",
    settingsMoreHouseholdsBody:
      "Hesabın aynı anda birden fazla evde olabilir (örneğin farklı evler veya bütçeler). Masaüstünde yan menüde, mobilde üst başlıkta yer alan eve tıklayarak seçim yap. Aşağıdan yeni ev oluştur veya kimlik (UUID) ile katıl.",
    settingsMembershipSummary: "Bağlı ev sayısı: {count}",
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
    balancesTitle: "Bakiyeler",
    balancesEmpty: "Bu ay için henüz ortak gider yok.",
    balancesFairShare: "Kişi başı pay",
    balancesPaidLabel: "Ödedi",
    balanceOwes: "Borcu var",
    balanceIsOwed: "Alacaklı",
    balanceSettledUp: "Ödeşildi",
    exportDataTitle: "Verileri Dışa Aktar",
    exportDataSubtitle:
      "Tüm giderleri Excel veya Google Sheets'te açabileceğin bir CSV dosyası olarak indir.",
    downloadCSV: "CSV İndir",
    exportEmpty: "Henüz dışa aktarılacak gider yok.",
    trendsTitle: "Harcama Trendleri",
    trendsTotalLabel: "Toplam",
    trendsEmpty: "Trend verisi yok",
    budgetsTitle: "Bütçeler",
    budgetsSubtitle:
      "Her kategori için aylık limit belirle. Panodaki çubuklar harcamanı bu limitlere göre gösterir.",
    budgetsDashboardSubtitle:
      "Bu ayki harcamaların belirlediğin limitlere karşı.",
    setLimit: "Limit Belirle",
    saving: "Kaydediliyor…",
    overBudget: "Bütçe Aşıldı!",
    spentLabel: "Harcanan",
    ofLabel: "/",
    budgetsEmpty: "Henüz bütçe belirlenmedi. Ayarlardan ekleyebilirsin.",
    recurringMakeMonthly: "Bunu aylık düzenli harcama yap",
    recurringSectionTitle: "Düzenli Harcamalar",
    recurringSectionSubtitle:
      "Her ay tekrarlayan abonelik ve faturalar. Ayın 1'inde işleyiciyi çalıştırınca sonraki harcamalar otomatik oluşturulur.",
    recurringProcessButton: "Düzenli Harcamaları İşle",
    recurringProcessing: "İşleniyor…",
    recurringProcessSuccess: "Düzenli harcamalar başarıyla işlendi",
    recurringProcessNothing: "Şu an işlenmesi gereken düzenli harcama yok.",
    recurringProcessFailed: "Düzenli harcamalar işlenemedi.",
    recurringEmpty: "Henüz düzenli harcama yok.",
    recurringNextRun: "Sıradaki ay",
    recurringDelete: "Düzenli harcamayı sil",
    switchHousehold: "Ev Değiştir",
    createOrJoinAnother: "Başka bir ev oluştur veya katıl",
    activeBadge: "Aktif",
    onboardingTitle: "Başka bir ev ekle",
    onboardingSubtitle:
      "İstediğiniz kadar eve üye olabilir ve dilediğiniz zaman aralarında geçiş yapabilirsiniz.",
    onboardingCreateTitle: "Yeni ev oluştur",
    onboardingCreateSubtitle:
      "Sıfırdan paylaşılan bir bütçe başlatın. Otomatik olarak sahibi olursunuz.",
    onboardingCreateAction: "Ev oluştur",
    onboardingCreating: "Oluşturuluyor…",
    onboardingJoinTitle: "Ev adıyla katıl",
    onboardingJoinSubtitle:
      "Ev adını aynen yazın. Varsa katılır ve otomatik olarak o eve geçersiniz.",
    onboardingJoinPlaceholder: "Ev adı",
    onboardingJoinNamePlaceholder: "örn. Ev Bütçesi",
    onboardingJoinAction: "Eve katıl",
    onboardingJoining: "Katılıyor…",
    onboardingJoinNameRequired: "Lütfen bir ev adı yazın.",
    onboardingMultipleHouseholdsFound:
      "Bu adı birden fazla ev kullanıyor. Ev sahibinden adı benzersiz yapmasını isteyin.",
    onboardingHouseholdNotFound:
      "Bu adla bir ev bulamadık. Yazımı ev sahibiyle birlikte kontrol edin.",
    onboardingAlreadyMember:
      "Zaten bu evin üyesisiniz. Şimdi ona geçiliyor.",
    onboardingNameTaken: "Bu ev adı zaten kullanımda.",
    onboardingCreateFailed: "Ev oluşturulamadı. Tekrar deneyin.",
    onboardingJoinFailed: "Eve katılınamadı. Tekrar deneyin.",
    onboardingNamePlaceholder: "Ev adı",
    onboardingBackToApp: "Panele dön",
  },
  it: {
    appTitle: "Pianificatore budget",
    signInTitle: "Accedi",
    signInSubtitle: "Usa le tue credenziali.",
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
    householdName: "Nome della casa",
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
      "Account creato, ma non siamo riusciti a configurare il profilo della casa. Prova ad accedere di nuovo.",
    backToSignIn: "Torna all’accesso",
    noHousehold: "Nessun profilo casa trovato per questo account.",
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
    unread: "Nuova",
    navMessages: "Messaggi",
    messagesTitle: "Chat di casa",
    messagesEmpty: "Ancora nessun messaggio. Inizia tu la conversazione.",
    messageInputPlaceholder: "Scrivi un messaggio…",
    sendMessage: "Invia",
    sendingMessage: "Invio…",
    deleteMessage: "Elimina messaggio",
    unknownMember: "Membro sconosciuto",
    membersTitle: "Membri della casa",
    noMembers: "Nessun membro ancora.",
    householdLabel: "Casa",
    ownerBadge: "Proprietario",
    youBadge: "Tu",
    membersCount: "{count} membro",
    membersCountPlural: "{count} membri",
    inviteHint:
      "Condividi questo nome: i nuovi membri devono digitarlo in fase di iscrizione per richiedere di unirsi alla casa.",
    logout: "Esci",
    activeMonth: "Mese attivo",
    navDashboard: "Cruscotto",
    navAddEntry: "Aggiungi voce",
    navMembers: "Membri",
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
    settingsHouseholdSection: "Casa",
    settingsHouseholdSubtitle: "Aggiorna il nome della casa visibile a tutti.",
    settingsHouseholdOwnerOnly: "Solo il proprietario può cambiare il nome.",
    settingsRenameHousehold: "Salva",
    settingsRenamingHousehold: "Salvataggio…",
    settingsHouseholdRenamed: "Nome della casa aggiornato.",
    settingsHouseholdRenameFailed: "Impossibile aggiornare il nome della casa.",
    settingsHouseholdNameUnchanged: "Scegli un nuovo nome per salvare.",
    settingsHouseholdNameTaken: "Un'altra casa usa già questo nome.",
    settingsDeleteHousehold: "Elimina casa",
    settingsDeletingHousehold: "Eliminazione…",
    settingsDeleteHouseholdWarning:
      "Questa azione elimina definitivamente la casa attiva e tutte le sue spese, i messaggi, i budget, le regole ricorrenti e le appartenenze.",
    settingsDeleteHouseholdConfirm:
      "Scrivi DELETE per confermare l'eliminazione della casa.",
    settingsDeleteHouseholdConfirmLabel: "Conferma",
    settingsDeleteHouseholdConfirmPlaceholder: "DELETE",
    settingsDeleteHouseholdFailed: "Impossibile eliminare la casa.",
    settingsMoreHouseholdsSection: "Più case",
    settingsMoreHouseholdsBody:
      "Il tuo account può appartenere a più case contemporaneamente (es. case diverse o budget diversi). Apri il menu accanto al nome nella barra laterale sul desktop o nell’header su mobile per cambiare. Aggiungi o unisciti a un'altra casa con il pulsante sotto.",
    settingsMembershipSummary: "Appartenenze alla casa: {count}",
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
    balancesTitle: "Saldi",
    balancesEmpty: "Nessuna spesa congiunta per questo mese.",
    balancesFairShare: "Quota equa / persona",
    balancesPaidLabel: "Pagato",
    balanceOwes: "Deve",
    balanceIsOwed: "Deve ricevere",
    balanceSettledUp: "In pari",
    exportDataTitle: "Esporta Dati",
    exportDataSubtitle:
      "Scarica tutte le spese come file CSV apribile in Excel o Google Sheets.",
    downloadCSV: "Scarica CSV",
    exportEmpty: "Nessuna spesa da esportare per ora.",
    trendsTitle: "Tendenze di Spesa",
    trendsTotalLabel: "Totale",
    trendsEmpty: "Nessun dato sulle tendenze",
    budgetsTitle: "Budget",
    budgetsSubtitle:
      "Imposta un limite mensile per categoria. Le barre nel cruscotto mostrano la tua spesa rispetto a ciascun limite.",
    budgetsDashboardSubtitle:
      "Spese di questo mese rispetto ai limiti impostati.",
    setLimit: "Imposta Limite",
    saving: "Salvataggio…",
    overBudget: "Fuori Budget!",
    spentLabel: "Speso",
    ofLabel: "di",
    budgetsEmpty: "Nessun budget ancora. Aggiungilo dalle Impostazioni.",
    recurringMakeMonthly: "Rendi questa una spesa mensile ricorrente",
    recurringSectionTitle: "Spese Ricorrenti",
    recurringSectionSubtitle:
      "Abbonamenti e bollette che si ripetono ogni mese. Avvia l'elaborazione il 1° del mese per creare automaticamente il prossimo lotto di spese.",
    recurringProcessButton: "Elabora Spese Ricorrenti",
    recurringProcessing: "Elaborazione…",
    recurringProcessSuccess: "Spese ricorrenti elaborate con successo",
    recurringProcessNothing: "Nessuna spesa ricorrente da elaborare ora.",
    recurringProcessFailed: "Impossibile elaborare le spese ricorrenti.",
    recurringEmpty: "Nessuna spesa ricorrente ancora.",
    recurringNextRun: "Prossimo mese",
    recurringDelete: "Elimina spesa ricorrente",
    switchHousehold: "Cambia Casa",
    createOrJoinAnother: "Crea o unisciti a un'altra casa",
    activeBadge: "Attivo",
    onboardingTitle: "Aggiungi un'altra casa",
    onboardingSubtitle:
      "Puoi appartenere a quante case desideri e passare dall'una all'altra in qualsiasi momento.",
    onboardingCreateTitle: "Crea una nuova casa",
    onboardingCreateSubtitle:
      "Avvia un nuovo budget condiviso. Ne diventerai automaticamente il proprietario.",
    onboardingCreateAction: "Crea casa",
    onboardingCreating: "Creazione…",
    onboardingJoinTitle: "Unisciti tramite nome casa",
    onboardingJoinSubtitle:
      "Scrivi il nome esatto della casa. Se esiste, entrerai e passerai a quella casa.",
    onboardingJoinPlaceholder: "Nome casa",
    onboardingJoinNamePlaceholder: "es. Budget Casa",
    onboardingJoinAction: "Unisciti alla casa",
    onboardingJoining: "Unione in corso…",
    onboardingJoinNameRequired: "Scrivi un nome casa.",
    onboardingMultipleHouseholdsFound:
      "Più case usano questo nome. Chiedi al proprietario di renderlo univoco.",
    onboardingHouseholdNotFound:
      "Non abbiamo trovato nessuna casa con questo nome. Controlla l'ortografia con il proprietario.",
    onboardingAlreadyMember:
      "Sei già membro di questa casa. Passaggio in corso.",
    onboardingNameTaken: "Questo nome casa è già in uso.",
    onboardingCreateFailed: "Impossibile creare la casa. Riprova.",
    onboardingJoinFailed: "Impossibile unirsi alla casa. Riprova.",
    onboardingNamePlaceholder: "Nome casa",
    onboardingBackToApp: "Torna alla dashboard",
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

export const MAIN_CATEGORY_ENGLISH = [
  "Housing",
  "Food",
  "Entertainment",
  "Saving",
  "Other",
] as const;

export type MainCategoryEnglish = (typeof MAIN_CATEGORY_ENGLISH)[number];

export const MAIN_CATEGORY_TO_I18N_KEY: Record<
  MainCategoryEnglish,
  TranslationKey
> = {
  Housing: "main_housing",
  Food: "main_food",
  Entertainment: "main_entertainment",
  Saving: "main_saving",
  Other: "main_other",
};

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

export function translateMainCategory(
  t: (key: TranslationKey, vars?: Record<string, string>) => string,
  mainCategory: string,
): string {
  const key = MAIN_CATEGORY_TO_I18N_KEY[mainCategory as MainCategoryEnglish];
  if (key) return t(key);
  return mainCategory;
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
      const table = dictionary[currentLanguage] as Partial<
        Record<TranslationKey, string>
      >;
      const fallback = dictionary.en[key] ?? key;
      const raw = table[key] ?? fallback;
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
