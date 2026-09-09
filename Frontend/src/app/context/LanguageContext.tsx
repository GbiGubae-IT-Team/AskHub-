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
    'signin.guestContinue': 'Continue as Guest',
    'signin.submit': 'Sign In',
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
    'signin.guestContinue': 'እንደ እንግዳ ቀጥል',
    'signin.submit': 'ግባ',
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
