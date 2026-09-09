import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type Language = 'en' | 'am';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Header
    'header.title': 'GIBI-GUBAE',
    'header.placeholder': 'Ask us anything',
    'header.go': 'GO',
    'header.staffSignIn': 'Staff Sign In',
    'header.notifications': 'Notifications',
    // Tabs
    'tab.all': 'All',
    'tab.faith': 'Faith',
    'tab.bible': 'Bible',
    'tab.prayer': 'Prayer',
    'tab.relationships': 'Relationships',
    'tab.struggles': 'Struggles',
    'tab.general': 'General',
    // Notification Modal
    'notification.title': 'Notifications',
    'notification.markAllRead': 'Mark all as read',
    'notification.empty': 'No notifications yet',
    'notification.guestNotice': "Sign in to track which announcements you've read.",
    'notification.viewAll': 'View all notifications',
    // Question Card
    'question.more': 'MORE',
    'question.less': 'LESS',
    'question.answer': 'Answer',
    'question.hideAnswer': 'Hide Answer',
    'question.reply': 'Reply',
    'question.status.answered': 'Answered',
    'question.status.approved': 'Approved',
    'question.status.rejected': 'Rejected',
    'question.status.pending': 'Pending',
    // Sidebar
    'sidebar.noImage': 'No Image Available',
    'sidebar.more': 'MORE',
    'sidebar.less': 'LESS',
    // Hot Questions
    'hotquestions.title': 'Recent Questions',
    'hotquestions.loading': 'Loading...',
    'hotquestions.empty': 'No questions found.',
    'hotquestions.general': 'General',
    // Success Modal
    'success.title': 'Question Received!',
    'success.body': 'Thank you for reaching out. We will post your question along with the answer as soon as it is ready.',
    'success.button': 'Got it, thanks!',
    // Sign In Modal
    'signin.title': 'GIBI-GUBAE',
    'signin.subtitle': 'Ask your questions anonymously',
    'signin.email': 'Email',
    'signin.email.placeholder': 'Enter your email',
    'signin.password': 'Password',
    'signin.password.placeholder': 'Enter your password',
    'signin.submit': 'Sign In',
    'signin.joinNow': 'Join now',
    'signin.register': 'Register',
    'signin.needAccount': 'Need an account?',
    'signin.haveAccount': 'Already have an account?',
    'signin.guestContinue': 'Continue as Guest',
    'signin.pendingApproval': 'New staff pending approval',
    'signin.notApproved': 'Your account is pending admin approval.',
    'signin.invalidCredentials': 'Invalid credentials',
    'signin.failedRegister': 'Failed to register',
    'signin.notice.privacyTitle': 'Your Privacy Matters',
    'signin.notice.privacyBody': 'All questions and interactions are completely confidential and anonymous.',
    'signin.notice.approvalTitle': 'Admin Approval Required',
    'signin.notice.approvalBody': 'New staff login requires admin approval. You will be notified once your account is approved.',
    'signin.requestAccess': 'Request Access',
    // Auth Page
    'auth.backToHome': 'Back to Home',
    'auth.welcomeBack': 'Welcome Back',
    'auth.createAccount': 'Create an Account',
    'auth.loginDesc': 'Sign in to ask questions, view responses, or access staff moderation',
    'auth.registerDesc': 'Register for staff moderation or student discussion participation',
    'auth.emailLabel': 'Email Address',
    'auth.emailPlaceholder': 'you@example.com',
    'auth.passwordLabel': 'Password',
    'auth.passwordPlaceholder': '••••••••',
    'auth.pleaseWait': 'Please wait...',
    'auth.signInBtn': 'Sign In',
    'auth.createAccountBtn': 'Create Account',
    'auth.portalNotice': 'Attendees and students can join rooms and ask questions anonymously without an account. Staff members require administrative approval before accessing moderation tools.',
    'auth.dontHaveAccount': "Don't have an account?",
    'auth.registerHere': 'Register here',
    'auth.alreadyHaveAccount': 'Already have an account?',
    'auth.signInHere': 'Sign in here',
    'auth.pendingApprovalNotice': 'Your staff account is pending admin approval. You will be able to log in once approved.',
    'auth.invalidLogin': 'Invalid email or password',
    'auth.failedRegister': 'Failed to register',
    'auth.registrationSuccessful': 'Registration successful! New staff accounts are pending admin approval.',
    'auth.emailRequired': 'Email is required',
    'auth.emailInvalid': 'Email must be a valid email',
    'auth.passwordRequired': 'Password is required',
    'auth.passwordLength': 'Password length must be at least 6 characters long',
  },
  am: {
    // Header
    'header.title': 'ግቢ-ጉባኤ',
    'header.placeholder': 'ጥያቄዎን ይጠይቁ',
    'header.go': 'ላክ',
    'header.staffSignIn': 'የሰራተኛ መግቢያ',
    'header.notifications': 'ማሳወቂያዎች',
    // Tabs
    'tab.all': 'ሁሉም',
    'tab.faith': 'እምነት',
    'tab.bible': 'መጽሐፍ ቅዱስ',
    'tab.prayer': 'ጸሎት',
    'tab.relationships': 'ግንኙነቶች',
    'tab.struggles': 'ፈተናዎች',
    'tab.general': 'ጠቅላላ',
    // Notification Modal
    'notification.title': 'ማሳወቂያዎች',
    'notification.markAllRead': 'ሁሉንም እንደተነበበ ምልክት አድርግ',
    'notification.empty': 'ምንም ማሳወቂያ የለም',
    'notification.guestNotice': 'ያነበቧቸውን ማሳወቂያዎች ለመከታተል ይግቡ።',
    'notification.viewAll': 'ሁሉንም ማሳወቂያዎች ይመልከቱ',
    // Question Card
    'question.more': 'ተጨማሪ',
    'question.less': 'አሳጥር',
    'question.answer': 'መልስ',
    'question.hideAnswer': 'መልስ ደብቅ',
    'question.reply': 'ምላሽ',
    'question.status.answered': 'ተመልሷል',
    'question.status.approved': 'ጸድቋል',
    'question.status.rejected': 'ተቀባይነት አላገኘም',
    'question.status.pending': 'በመጠባበቅ ላይ',
    // Sidebar
    'sidebar.noImage': 'ምስል የለም',
    'sidebar.more': 'ተጨማሪ',
    'sidebar.less': 'አሳጥር',
    // Hot Questions
    'hotquestions.title': 'የቅርብ ጊዜ ጥያቄዎች',
    'hotquestions.loading': 'በመጫን ላይ...',
    'hotquestions.empty': 'ምንም ጥያቄ አልተገኘም።',
    'hotquestions.general': 'ጠቅላላ',
    // Success Modal
    'success.title': 'ጥያቄዎ ደርሷል!',
    'success.body': 'ጥያቄዎን ስለ አቀረቡ እናመሰግናለን። ጥያቄዎን ከመልሱ ጋር እንደተዘጋጀ እናስቀምጣለን።',
    'success.button': 'እሺ',
    // Sign In Modal
    'signin.title': 'ግቢ-ጉባኤ',
    'signin.subtitle': 'ጥያቄዎን ሳይታወቁ ይጠይቁ',
    'signin.email': 'ኢሜይል',
    'signin.email.placeholder': 'ኢሜይልዎን ያስገቡ',
    'signin.password': 'የይለፍ ቃል',
    'signin.password.placeholder': 'የይለፍ ቃልዎን ያስገቡ',
    'signin.submit': 'ግባ',
    'signin.joinNow': 'አሁን ተቀላቀሉ',
    'signin.register': 'ይመዝገቡ',
    'signin.needAccount': 'መለያ የለዎትም?',
    'signin.haveAccount': 'መለያ አለዎት?',
    'signin.guestContinue': 'እንደ እንግዳ ቀጥል',
    'signin.pendingApproval': 'ፍቃድ ያስፈልጋል ይጠበቁ ',
    'signin.notApproved': 'መለያዎ የአስተዳዳሪ ፍቃድ እየጠበቀ ነው።',
    'signin.invalidCredentials': 'ኢሜይሉ ወይም የይለፍ ቃሉ ትክክል አይደለም',
    'signin.failedRegister': 'ምዝገባ አልተሳካም',
    'signin.notice.privacyTitle': 'ምስጢርዎ ይጠበቃል',
    'signin.notice.privacyBody': 'ሁሉም ጥያቄዎች እና ግንኙነቶች ሚስጥራዊ እና ስም-አልባ ናቸው።',
    'signin.notice.approvalTitle': 'የአስተዳዳሪ ፍቃድ ያስፈልጋል',
    'signin.notice.approvalBody': 'አዲስ የሰራተኛ መግቢያ የአስተዳዳሪ ፍቃድ ያስፈልጋል። መለያዎ ሲፈቀድ ይነገርዎታል።',
    'signin.requestAccess': 'መዳረሻ ይጠይቁ',
    // Auth Page
    'auth.backToHome': 'ወደ ዋና ገጽ ተመለስ',
    'auth.welcomeBack': 'እንኳን ደህና መጡ',
    'auth.createAccount': 'መለያ ይፍጠሩ',
    'auth.loginDesc': 'ጥያቄዎችን ለመጠየቅ፣ ምላሾችን ለማየት ወይም የሰራተኛ አስተዳደርን ለመጠቀም ይግቡ',
    'auth.registerDesc': 'ለሰራተኛ አስተዳደር ወይም ለተማሪዎች የውይይት ተሳትፎ ይመዝገቡ',
    'auth.emailLabel': 'የኢሜይል አድራሻ',
    'auth.emailPlaceholder': 'you@example.com',
    'auth.passwordLabel': 'የይለፍ ቃል',
    'auth.passwordPlaceholder': '••••••••',
    'auth.pleaseWait': 'እባክዎ ይጠብቁ...',
    'auth.signInBtn': 'ግባ',
    'auth.createAccountBtn': 'መለያ ይፍጠሩ',
    'auth.portalNotice': 'ተሰብሳቢዎች እና ተማሪዎች ያለ መለያ ወደ ክፍሎች መቀላቀል እና በጥብቅ ምስጢራዊነት ጥያቄዎችን መጠየቅ ይችላሉ። የሰራተኛ አባላት የማስተዳደሪያ መሳሪያዎችን ከመጠቀማቸው በፊት የአስተዳዳሪ ፍቃድ ያስፈልጋቸዋል።',
    'auth.dontHaveAccount': 'መለያ የለዎትም?',
    'auth.registerHere': 'እዚህ ይመዝገቡ',
    'auth.alreadyHaveAccount': 'አካውንት አልዎት?',
    'auth.signInHere': 'እዚህ ይግቡ',
    'auth.pendingApprovalNotice': 'የሰራተኛ መለያዎ የአስተዳዳሪ ፍቃድ እየጠበቀ ነው። ሲፈቀድ መግባት ይችላሉ።',
    'auth.invalidLogin': 'የኢሜይል አድራሻ ወይም የይለፍ ቃል ትክክል አይደለም',
    'auth.failedRegister': 'ምዝገባ አልተሳካም',
    'auth.registrationSuccessful': 'ምዝገባው ተሳክቷል! አዲስ የሰራተኛ መለያዎች የአስተዳዳሪ ፍቃድ እየጠበቁ ናቸው።',
    'auth.emailRequired': 'ኢሜይል ያስፈልጋል',
    'auth.emailInvalid': 'ኢሜይል ትክክለኛ መሆን አለበት',
    'auth.passwordRequired': 'የይለፍ ቃል ያስፈልጋል',
    'auth.passwordLength': 'የይለፍ ቃል ርዝመት ቢያንስ 6 ፊደላት መሆን አለበት',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem('app-language');
    return (stored === 'am' || stored === 'en') ? stored : 'en';
  });

  useEffect(() => {
    localStorage.setItem('app-language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'am' : 'en');
  };

  const t = (key: string): string => {
    return translations[language][key] ?? translations['en'][key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
}
