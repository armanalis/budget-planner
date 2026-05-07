"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Expense } from "@/types";

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
    forgotPassword: "Forgot password?",
    forgotPasswordSending: "Sending reset email…",
    forgotPasswordEnterEmail: "Enter your email first, then try again.",
    forgotPasswordEmailSent:
      "Password reset email sent. Open your inbox and follow the link.",
    forgotPasswordFailed: "Could not send reset email. Try again.",
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
    notificationDismiss: "Dismiss",
    notificationApprove: "Approve",
    notificationReject: "Reject",
    notificationJoinRequestReceived:
      "{name} ({email}) wants to join {household}.",
    notificationJoinRequestApproved:
      "You're in! Your request to join {household} was approved.",
    notificationJoinRequestRejected:
      "Your request to join {household} was declined.",
    notificationBudgetOverLimit:
      "Heads up: your spending in {category} reached €{spent} and exceeded the limit of €{limit}.",
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
    undoLastExpenseSectionTitle: "Undo last entry",
    undoLastExpenseSectionBody:
      "Just saved something by mistake (wrong amount, category, or date)? Remove the last expense you added in this household. Only works for your own entries until you add another or switch households.",
    undoLastExpenseButton: "Remove last expense",
    undoLastExpenseUnavailable:
      "Save an expense first — then you can remove your latest entry here.",
    undoLastExpenseWorking: "Removing…",
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
    main_transportation: "Transportation",
    main_utilities: "Utilities",
    main_shopping: "Shopping",
    main_entertainment: "Entertainment",
    main_health: "Health",
    main_education: "Education",
    main_investment: "Investment",
    main_savings: "Savings",
    main_other: "Other",
    expenseMainCategory: "Main category",
    expenseSubCategory: "Sub-category",
    expenseNoSubcategory: "No sub-category",
    expenseSubcategoryOptional: "Optional for overflow categories like Other.",
    expenseCategoryLegacy: "Category",
    dbSchemaLegacyExpenseHint:
      "Your Supabase project is missing new expense columns (e.g. main_category). Run the latest database_schema.sql so joint and personal expenses save correctly with sub-categories.",
    settingsSubcategoryBudgetNeedsMigration:
      "Sub-category budget caps require the subcategory_budgets table from database_schema.sql.",
    navSettings: "Settings",
    settingsTitle: "Settings",
    settingsAccountSection: "Account",
    settingsAccountSubtitle: "How you appear and sign in.",
    settingsHouseholdSection: "Household",
    settingsHouseholdSubtitle: "Update the household name everyone sees.",
    settingsHouseholdOwnerOnly: "Only the household owner can change the name.",
    settingsOnlyOwnersCanDeleteHousehold:
      "Only owners can delete this household.",
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
    householdDeletedSuccessfully: "Household deleted successfully.",
    settingsMoreHouseholdsSection: "Multiple households",
    settingsMoreHouseholdsBody:
      "Your account can belong to several households at once—for example separate homes or budgets. Open the dropdown next to your household name (sidebar on desktop, header on mobile) to switch. Add or join another one using the button below. Joining uses the household’s unique name; the owner approves your request.",
    settingsMembershipSummary: "Household memberships: {count}",
    settingsSecuritySection: "Security",
    settingsSecuritySubtitle: "Update your password to keep your account safe.",
    settingsPreferencesSection: "Preferences",
    settingsPreferencesSubtitle: "Theme and language.",
    settingsDisplayName: "Display name",
    settingsEmail: "Email",
    changePasswordTitle: "Change password",
    resetPasswordTitle: "Reset password",
    resetPasswordSubtitle:
      "Set a new password after opening your recovery email link.",
    resetPasswordSuccess: "Password reset successfully.",
    resetPasswordFailed: "Could not reset password. Try opening the email link again.",
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
    createOrJoin: "Create or Join",
    createOrJoinAnother: "Create or Join another household",
    deleteHousehold: "Delete Household",
    roleOwner: "Owner",
    roleMember: "Member",
    householdType: "Household type",
    householdTypeRomantic: "Romantic relationship",
    householdTypeHousemates: "Housemates",
    householdTypeFamily: "Family",
    householdTypeOther: "Other",
    cannotJoinHouseholdNotExists:
      "Cannot join, household does not exist",
    activeBadge: "Active",
    onboardingTitle: "Add another household",
    onboardingSubtitle:
      "You can belong to as many households as you like and switch between them at any time.",
    onboardingCreateTitle: "Create new household",
    onboardingCreateSubtitle:
      "Start a fresh shared budget. You'll automatically become its owner.",
    onboardingCreateAction: "Create household",
    onboardingCreating: "Creating…",
    onboardingJoinTitle: "Join an existing household",
    onboardingJoinSubtitle:
      "Enter the household’s unique name (the same one the owner chose). The owner gets a notification and must approve you before you can access that household.",
    onboardingJoinPlaceholder: "Household name",
    onboardingJoinNamePlaceholder: "e.g. Our shared budget",
    onboardingJoinAction: "Send join request",
    onboardingJoining: "Sending request…",
    onboardingJoinNameRequired: "Please enter the household name.",
    onboardingMultipleHouseholdsFound:
      "More than one household uses that name. Ask the owner to rename theirs to something unique.",
    onboardingHouseholdNotFound:
      "No household uses that exact name. Check spelling with the owner.",
    onboardingJoinPendingDuplicate:
      "You already have a pending request to join this household.",
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
    forgotPassword: "Şifremi unuttum",
    forgotPasswordSending: "Sıfırlama e-postası gönderiliyor…",
    forgotPasswordEnterEmail: "Önce e-posta adresinizi girin.",
    forgotPasswordEmailSent:
      "Şifre sıfırlama e-postası gönderildi. Gelen kutunuzu kontrol edin.",
    forgotPasswordFailed: "Sıfırlama e-postası gönderilemedi. Tekrar deneyin.",
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
    notificationDismiss: "Kapat",
    notificationApprove: "Onayla",
    notificationReject: "Reddet",
    notificationJoinRequestReceived:
      "{name} ({email}) {household} evine katılmak istiyor.",
    notificationJoinRequestApproved:
      "Hoş geldin! {household} evine katılma isteğin onaylandı.",
    notificationJoinRequestRejected:
      "{household} evine katılma isteğin reddedildi.",
    notificationBudgetOverLimit:
      "Dikkat: {category} harcaman €{spent} oldu ve €{limit} limitini aştı.",
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
    userTotal: "{name}'in toplamı",
    jointExpenses: "Ortak giderler",
    userExpenses: "{name}'in giderleri",
    noDataYet: "Henüz veri yok.",
    noNote: "Not eklenmedi.",
    viewOnly: "Sadece görüntüleme",
    noExpensesThisMonth: "Bu ay için gider yok.",
    deleteExpense: "Gideri sil",
    undoLastExpenseSectionTitle: "Son kaydı geri al",
    undoLastExpenseSectionBody:
      "Yanlış tutar, kategori veya tarih mi girdiniz? Bu evde eklediğiniz son gideri silin. Yalnızca kendi kayıtlarınız için geçerlidir; başka bir gider ekleyene veya ev değiştirene kadar.",
    undoLastExpenseButton: "Son gideri kaldır",
    undoLastExpenseUnavailable:
      "Önce bir gider kaydedin — ardından son kaydı buradan kaldırabilirsiniz.",
    undoLastExpenseWorking: "Kaldırılıyor…",
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
    main_housing: "Konut",
    main_food: "Gıda",
    main_transportation: "Ulaşım",
    main_utilities: "Faturalar",
    main_shopping: "Alışveriş",
    main_entertainment: "Eğlence",
    main_health: "Sağlık",
    main_education: "Eğitim",
    main_investment: "Yatırım",
    main_savings: "Birikim",
    main_other: "Diğer",
    expenseMainCategory: "Ana kategori",
    expenseSubCategory: "Alt kategori",
    expenseNoSubcategory: "Alt kategori yok",
    expenseSubcategoryOptional:
      "Diğer gibi taşma kategorilerinde isteğe bağlıdır.",
    expenseCategoryLegacy: "Kategori",
    dbSchemaLegacyExpenseHint:
      "Supabase projenizde yeni gider sütunları (ör. main_category) eksik. Ortak ve kişisel giderlerin alt kategorilerle doğru kaydolması için en güncel database_schema.sql dosyasını çalıştırın.",
    settingsSubcategoryBudgetNeedsMigration:
      "Alt kategori bütçe limitleri için database_schema.sql içindeki subcategory_budgets tablosu gerekir.",
    navSettings: "Ayarlar",
    settingsTitle: "Ayarlar",
    settingsAccountSection: "Hesap",
    settingsAccountSubtitle: "Görünüşün ve giriş bilgilerin.",
    settingsHouseholdSection: "Ev",
    settingsHouseholdSubtitle: "Herkesin gördüğü ev adını güncelle.",
    settingsHouseholdOwnerOnly: "Yalnızca evin sahibi adı değiştirebilir.",
    settingsOnlyOwnersCanDeleteHousehold:
      "Bu evi yalnızca sahipler silebilir.",
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
    householdDeletedSuccessfully: "Ev başarıyla silindi.",
    settingsMoreHouseholdsSection: "Birden fazla ev",
    settingsMoreHouseholdsBody:
      "Hesabın aynı anda birden fazla evde olabilir (örneğin farklı evler veya bütçeler). Masaüstünde yan menüde, mobilde üst başlıkta yer alan eve tıklayarak seçim yap. Aşağıdan yeni ev oluştur veya evin benzersiz adıyla katılma isteği gönder.",
    settingsMembershipSummary: "Bağlı ev sayısı: {count}",
    settingsSecuritySection: "Güvenlik",
    settingsSecuritySubtitle: "Hesabını güvende tutmak için şifreni güncelle.",
    settingsPreferencesSection: "Tercihler",
    settingsPreferencesSubtitle: "Tema ve dil.",
    settingsDisplayName: "Görünen ad",
    settingsEmail: "E-posta",
    changePasswordTitle: "Şifre değiştir",
    resetPasswordTitle: "Şifreyi sıfırla",
    resetPasswordSubtitle:
      "Kurtarma e-postasındaki bağlantıyı açtıktan sonra yeni şifrenizi belirleyin.",
    resetPasswordSuccess: "Şifre başarıyla sıfırlandı.",
    resetPasswordFailed:
      "Şifre sıfırlanamadı. E-posta bağlantısını tekrar açıp deneyin.",
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
    budgetMainCategoriesTitle: "Ana kategori limitleri",
    budgetSubcategoriesTitle: "Alt kategori limitleri",
    budgetSubcategoryName: "Alt kategori adı",
    budgetSubcategoryLimit: "Alt kategori limiti",
    budgetAddSubcategory: "Alt kategori ekle",
    budgetNoSubcategories: "Henüz alt kategori yok.",
    budgetAllocated: "Ayrılan",
    budgetMainLimitExceeded:
      "Ana kategori limiti, alt kategori limitlerinin toplamından küçük olamaz.",
    budgetSubLimitExceeded:
      "Alt kategori limitleri ana kategori limitini aşamaz.",
    budgetOverflowOtherHint:
      "Diğer, taşma kategorisi olarak çalışır ve planlı alt kategori gerektirmez.",
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
    createOrJoin: "Oluştur veya Katıl",
    createOrJoinAnother: "Başka bir ev oluştur veya katıl",
    deleteHousehold: "Evi Sil",
    roleOwner: "Sahip",
    roleMember: "Üye",
    householdType: "Ev tipi",
    householdTypeRomantic: "Romantik ilişki",
    householdTypeHousemates: "Ev arkadaşları",
    householdTypeFamily: "Aile",
    householdTypeOther: "Diğer",
    cannotJoinHouseholdNotExists: "Katılınamıyor, böyle bir ev yok",
    activeBadge: "Aktif",
    onboardingTitle: "Başka bir ev ekle",
    onboardingSubtitle:
      "İstediğiniz kadar eve üye olabilir ve dilediğiniz zaman aralarında geçiş yapabilirsiniz.",
    onboardingCreateTitle: "Yeni ev oluştur",
    onboardingCreateSubtitle:
      "Sıfırdan paylaşılan bir bütçe başlatın. Otomatik olarak sahibi olursunuz.",
    onboardingCreateAction: "Ev oluştur",
    onboardingCreating: "Oluşturuluyor…",
    onboardingJoinTitle: "Mevcut bir eve katıl",
    onboardingJoinSubtitle:
      "Evin benzersiz adını girin (sahibinin seçtiği adın aynısı). Sahip bir bildirim alır; o onaylamadan eve erişemezsiniz.",
    onboardingJoinPlaceholder: "Ev adı",
    onboardingJoinNamePlaceholder: "ör. Ortak bütçemiz",
    onboardingJoinAction: "Katılma isteği gönder",
    onboardingJoining: "İstek gönderiliyor…",
    onboardingJoinNameRequired: "Lütfen ev adını girin.",
    onboardingMultipleHouseholdsFound:
      "Bu adı birden fazla ev kullanıyor. Ev sahibinden adı benzersiz yapmasını isteyin.",
    onboardingHouseholdNotFound:
      "Bu adda bir ev yok. Yazımı sahip ile birlikte kontrol edin.",
    onboardingJoinPendingDuplicate:
      "Bu eve zaten bekleyen bir katılma isteğiniz var.",
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
    forgotPassword: "Password dimenticata?",
    forgotPasswordSending: "Invio email di reset…",
    forgotPasswordEnterEmail: "Inserisci prima la tua email.",
    forgotPasswordEmailSent:
      "Email di reimpostazione inviata. Apri la casella di posta e segui il link.",
    forgotPasswordFailed: "Impossibile inviare l'email di reset. Riprova.",
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
    notificationDismiss: "Chiudi",
    notificationApprove: "Approva",
    notificationReject: "Rifiuta",
    notificationJoinRequestReceived:
      "{name} ({email}) vuole unirsi a {household}.",
    notificationJoinRequestApproved:
      "Sei dentro! La tua richiesta per {household} è stata approvata.",
    notificationJoinRequestRejected:
      "La tua richiesta per unirti a {household} è stata rifiutata.",
    notificationBudgetOverLimit:
      "Attenzione: la tua spesa in {category} ha raggiunto €{spent} e ha superato il limite di €{limit}.",
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
    undoLastExpenseSectionTitle: "Annulla ultima voce",
    undoLastExpenseSectionBody:
      "Hai salvato per errore importo, categoria o data? Rimuovi l’ultima spesa che hai aggiunto in questa casa. Vale solo per le tue voci finché non ne aggiungi un’altra o cambi casa.",
    undoLastExpenseButton: "Rimuovi ultima spesa",
    undoLastExpenseUnavailable:
      "Salva prima una spesa — poi potrai rimuovere l’ultima qui.",
    undoLastExpenseWorking: "Rimozione…",
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
    main_housing: "Casa",
    main_food: "Cibo",
    main_transportation: "Trasporti",
    main_utilities: "Utenze",
    main_shopping: "Acquisti",
    main_entertainment: "Intrattenimento",
    main_health: "Salute",
    main_education: "Istruzione",
    main_investment: "Investimenti",
    main_savings: "Risparmi",
    main_other: "Altro",
    expenseMainCategory: "Categoria principale",
    expenseSubCategory: "Sottocategoria",
    expenseNoSubcategory: "Nessuna sottocategoria",
    expenseSubcategoryOptional:
      "Facoltativa per categorie di overflow come Altro.",
    expenseCategoryLegacy: "Categoria",
    dbSchemaLegacyExpenseHint:
      "Nel tuo progetto Supabase mancano le nuove colonne delle spese (es. main_category). Esegui l'ultimo database_schema.sql per salvare correttamente le spese personali e congiunte con le sottocategorie.",
    settingsSubcategoryBudgetNeedsMigration:
      "I limiti per sottocategoria richiedono la tabella subcategory_budgets presente in database_schema.sql.",
    navSettings: "Impostazioni",
    settingsTitle: "Impostazioni",
    settingsAccountSection: "Account",
    settingsAccountSubtitle: "Come appari e accedi.",
    settingsHouseholdSection: "Casa",
    settingsHouseholdSubtitle: "Aggiorna il nome della casa visibile a tutti.",
    settingsHouseholdOwnerOnly: "Solo il proprietario può cambiare il nome.",
    settingsOnlyOwnersCanDeleteHousehold:
      "Solo i proprietari possono eliminare questa casa.",
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
    householdDeletedSuccessfully: "Casa eliminata correttamente.",
    settingsMoreHouseholdsSection: "Più case",
    settingsMoreHouseholdsBody:
      "Il tuo account può appartenere a più case contemporaneamente (es. case diverse o budget diversi). Apri il menu accanto al nome nella barra laterale sul desktop o nell’header su mobile per cambiare. Aggiungi o unisciti a un'altra casa con il pulsante sotto. Per unirti serve il nome univoco della casa; il proprietario deve approvare la richiesta.",
    settingsMembershipSummary: "Appartenenze alla casa: {count}",
    settingsSecuritySection: "Sicurezza",
    settingsSecuritySubtitle:
      "Aggiorna la password per tenere l'account al sicuro.",
    settingsPreferencesSection: "Preferenze",
    settingsPreferencesSubtitle: "Tema e lingua.",
    settingsDisplayName: "Nome visualizzato",
    settingsEmail: "Email",
    changePasswordTitle: "Cambia password",
    resetPasswordTitle: "Reimposta password",
    resetPasswordSubtitle:
      "Imposta una nuova password dopo aver aperto il link di recupero via email.",
    resetPasswordSuccess: "Password reimpostata con successo.",
    resetPasswordFailed:
      "Impossibile reimpostare la password. Riapri il link email e riprova.",
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
    budgetMainCategoriesTitle: "Limiti categoria principale",
    budgetSubcategoriesTitle: "Limiti sottocategoria",
    budgetSubcategoryName: "Nome sottocategoria",
    budgetSubcategoryLimit: "Limite sottocategoria",
    budgetAddSubcategory: "Aggiungi sottocategoria",
    budgetNoSubcategories: "Nessuna sottocategoria ancora.",
    budgetAllocated: "Assegnato",
    budgetMainLimitExceeded:
      "Il limite della categoria principale deve essere maggiore o uguale alla somma dei limiti delle sottocategorie.",
    budgetSubLimitExceeded:
      "I limiti delle sottocategorie non possono superare il limite della categoria principale.",
    budgetOverflowOtherHint:
      "Altro funziona come categoria di overflow e non richiede sottocategorie pianificate.",
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
    createOrJoin: "Crea o Unisciti",
    createOrJoinAnother: "Crea o unisciti a un'altra casa",
    deleteHousehold: "Elimina casa",
    roleOwner: "Proprietario",
    roleMember: "Membro",
    householdType: "Tipo di casa",
    householdTypeRomantic: "Relazione romantica",
    householdTypeHousemates: "Coinquilini",
    householdTypeFamily: "Famiglia",
    householdTypeOther: "Altro",
    cannotJoinHouseholdNotExists:
      "Impossibile unirsi: la casa non esiste",
    activeBadge: "Attivo",
    onboardingTitle: "Aggiungi un'altra casa",
    onboardingSubtitle:
      "Puoi appartenere a quante case desideri e passare dall'una all'altra in qualsiasi momento.",
    onboardingCreateTitle: "Crea una nuova casa",
    onboardingCreateSubtitle:
      "Avvia un nuovo budget condiviso. Ne diventerai automaticamente il proprietario.",
    onboardingCreateAction: "Crea casa",
    onboardingCreating: "Creazione…",
    onboardingJoinTitle: "Entra in una casa esistente",
    onboardingJoinSubtitle:
      "Inserisci il nome univoco della casa (come l’ha scelta il proprietario). Il proprietario riceve una notifica e deve approvarti prima che tu possa accedere.",
    onboardingJoinPlaceholder: "Nome della casa",
    onboardingJoinNamePlaceholder: "es. Budget condiviso",
    onboardingJoinAction: "Invia richiesta di ingresso",
    onboardingJoining: "Invio in corso…",
    onboardingJoinNameRequired: "Inserisci il nome della casa.",
    onboardingMultipleHouseholdsFound:
      "Più case usano questo nome. Chiedi al proprietario di renderlo univoco.",
    onboardingHouseholdNotFound:
      "Nessuna casa ha esattamente questo nome. Controlla con il proprietario.",
    onboardingJoinPendingDuplicate:
      "Hai già una richiesta in sospeso per questa casa.",
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

/** Canonical English values stored in `Expense.category`. */
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
  "Transportation",
  "Utilities",
  "Shopping",
  "Entertainment",
  "Health",
  "Education",
  "Investment",
  "Savings",
  "Other",
] as const;

export type MainCategoryEnglish = (typeof MAIN_CATEGORY_ENGLISH)[number];

export const MAIN_CATEGORY_TO_I18N_KEY: Record<
  MainCategoryEnglish,
  TranslationKey
> = {
  Housing: "main_housing",
  Food: "main_food",
  Transportation: "main_transportation",
  Utilities: "main_utilities",
  Shopping: "main_shopping",
  Entertainment: "main_entertainment",
  Health: "main_health",
  Education: "main_education",
  Investment: "main_investment",
  Savings: "main_savings",
  Other: "main_other",
};

// Backward compatibility for pre-migration data.
const LEGACY_MAIN_CATEGORY_TO_I18N_KEY: Record<string, TranslationKey> = {
  Saving: "main_savings",
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
  const key =
    MAIN_CATEGORY_TO_I18N_KEY[mainCategory as MainCategoryEnglish] ??
    LEGACY_MAIN_CATEGORY_TO_I18N_KEY[mainCategory];
  if (key) return t(key);
  return mainCategory;
}

/** Display label used in list views and recurring rows. */
export function formatExpenseCategoryDisplay(
  t: (key: TranslationKey, vars?: Record<string, string>) => string,
  expense: Pick<Expense, "main_category" | "sub_category" | "category">,
): string {
  const sub =
    expense.sub_category != null && String(expense.sub_category).trim() !== ""
      ? String(expense.sub_category).trim()
      : null;

  const mainCategoryKey =
    MAIN_CATEGORY_TO_I18N_KEY[expense.main_category as MainCategoryEnglish] ??
    LEGACY_MAIN_CATEGORY_TO_I18N_KEY[expense.main_category];

  const mainLabel = mainCategoryKey
    ? translateMainCategory(t, expense.main_category)
    : translateExpenseCategory(t, expense.main_category);

  if (sub) {
    return `${mainLabel} › ${sub}`;
  }

  return mainCategoryKey
    ? mainLabel
    : translateExpenseCategory(t, expense.category);
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
    // #region agent log
    fetch("http://127.0.0.1:7863/ingest/47e3ad6d-fc70-4a01-9dfc-fd6ebfda7cca", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "b2f15c",
      },
      body: JSON.stringify({
        sessionId: "b2f15c",
        runId: "pre-fix",
        hypothesisId: "H1",
        location: "context/LanguageContext.tsx:init",
        message: "LanguageProvider init start",
        data: { hasWindow: typeof window !== "undefined" },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    // Keep the first client render identical to SSR to avoid hydration mismatch.
    if (typeof window === "undefined") {
      // #region agent log
      fetch("http://127.0.0.1:7863/ingest/47e3ad6d-fc70-4a01-9dfc-fd6ebfda7cca", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "b2f15c",
        },
        body: JSON.stringify({
          sessionId: "b2f15c",
          runId: "post-fix",
          hypothesisId: "H1",
          location: "context/LanguageContext.tsx:init",
          message: "LanguageProvider server default",
          data: { chosenLanguage: "en" },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
    }
    return "en";
  });
  const [hydratedLanguage, setHydratedLanguage] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    // #region agent log
    fetch("http://127.0.0.1:7863/ingest/47e3ad6d-fc70-4a01-9dfc-fd6ebfda7cca", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "b2f15c",
      },
      body: JSON.stringify({
        sessionId: "b2f15c",
        runId: "post-fix",
        hypothesisId: "H1",
        location: "context/LanguageContext.tsx:hydrate-effect",
        message: "LanguageProvider client storage read",
        data: { savedLanguage: saved },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    if (saved === "en" || saved === "tr" || saved === "it") {
      setCurrentLanguageState(saved);
    }
    setHydratedLanguage(true);
  }, []);

  useEffect(() => {
    if (!hydratedLanguage) return;
    // #region agent log
    fetch("http://127.0.0.1:7863/ingest/47e3ad6d-fc70-4a01-9dfc-fd6ebfda7cca", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "b2f15c",
      },
      body: JSON.stringify({
        sessionId: "b2f15c",
        runId: "post-fix",
        hypothesisId: "H2",
        location: "context/LanguageContext.tsx:effect",
        message: "LanguageProvider persist language",
        data: { currentLanguage },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);
  }, [currentLanguage, hydratedLanguage]);

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
