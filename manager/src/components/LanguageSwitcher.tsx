import { useTranslation } from 'react-i18next'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const current = i18n.resolvedLanguage || i18n.language || 'zh'

  return (
    <div className="flex items-center gap-2">
      <Label className="text-sm text-muted-foreground">{t('common.language')}</Label>
      <Select
        value={current}
        onValueChange={(lng) => {
          i18n.changeLanguage(lng)
          // 持久化选择
          localStorage.setItem('i18nextLng', lng)
          // 如需刷新 UI，通常不必强制 reload
        }}
      >
        <SelectTrigger className="w-28">
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="zh">中文</SelectItem>
          <SelectItem value="en">English</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
