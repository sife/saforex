import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export default function TranslationButton() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);
  const buttonRef = React.useRef<HTMLDivElement>(null);

  const languages = {
    ar: 'العربية',
    en: 'English'
  };

  React.useEffect(() => {
    // Load language preference from localStorage instead of cookies
    const savedLang = localStorage.getItem('i18nextLng');
    if (savedLang && savedLang !== i18n.language) {
      i18n.changeLanguage(savedLang);
    }

    // Handle clicks outside the dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [i18n]);

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('i18nextLng', lang);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={buttonRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Change language"
        aria-expanded={isOpen}
        aria-controls="language-menu"
      >
        <Globe className="w-5 h-5 text-gray-600 dark:text-gray-300" aria-hidden="true" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {languages[i18n.language as keyof typeof languages]}
        </span>
      </button>

      {isOpen && (
        <div
          id="language-menu"
          className="absolute top-full right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/10 py-1 border border-gray-100 dark:border-gray-700 animate-fadeIn"
          role="menu"
        >
          {Object.entries(languages).map(([code, name]) => (
            <button
              key={code}
              onClick={() => handleLanguageChange(code)}
              className={`w-full text-right px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                i18n.language === code 
                  ? 'text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/30' 
                  : 'text-gray-700 dark:text-gray-200'
              }`}
              role="menuitem"
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}