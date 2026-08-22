import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function notFound(label: string) {
  return <NotFoundInner label={label} />
}

function NotFoundInner({ label }: { label: string }) {
  const { t } = useTranslation()
  return (
    <div className="max-w-3xl mx-auto px-4 py-24 text-center">
      <div className="text-5xl mb-4">🛫</div>
      <h1 className="text-xl font-bold">{label}</h1>
      <p className="text-runway-400 mt-2 text-sm">{t('common.notFound')}</p>
      <Link to="/" className="inline-block mt-6 px-5 py-2 rounded-xl bg-altitude-500 text-white text-sm">
        {t('common.backHome')}
      </Link>
    </div>
  )
}
