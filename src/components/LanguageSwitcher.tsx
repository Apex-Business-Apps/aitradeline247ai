import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { SUPPORTED_LOCALES } from '@/i18n/config';

export const LanguageSwitcher: React.FC = () => {
  const { t, i18n } = useTranslation('common');

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          aria-label={t('language.switch')}
          className="h-9 px-3 rounded-lg min-w-[44px] min-h-[44px] shadow-none"
        >
          <Globe className="h-4 w-4 mr-1" />
          <span className="text-sm">{i18n.language.split('-')[0].toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SUPPORTED_LOCALES.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => changeLanguage(locale)}
            className={i18n.language === locale ? 'bg-accent' : ''}
          >
            {t(`language.${locale}`)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
