import { cn } from '@/lib/utils'

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showSlogan?: boolean
  theme?: 'dark' | 'light'
  iconOnly?: boolean
  className?: string
}

const sizeConfig = {
  sm: { box: 'w-8 h-8 rounded-lg', sr: 'text-sm', title: 'text-sm', slogan: 'text-[8px]' },
  md: { box: 'w-10 h-10 rounded-xl', sr: 'text-base', title: 'text-base', slogan: 'text-[10px]' },
  lg: { box: 'w-16 h-16 rounded-2xl', sr: 'text-3xl', title: 'text-2xl', slogan: 'text-xs' },
}

export function BrandLogo({
  size = 'md',
  showSlogan = false,
  theme = 'dark',
  iconOnly = false,
  className,
}: BrandLogoProps) {
  const c = sizeConfig[size]
  const titleColor = theme === 'light' ? 'text-white' : 'text-primary'
  const accentColor = theme === 'light' ? 'text-sand' : 'text-accent'
  const sloganColor = theme === 'light' ? 'text-white/70' : 'text-muted-foreground'

  if (iconOnly) {
    return (
      <div
        className={cn(
          c.box,
          'bg-primary flex items-center justify-center font-extrabold text-sand shadow-md shrink-0',
          className,
        )}
      >
        <span className={c.sr}>SR</span>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn(
          c.box,
          'bg-primary flex items-center justify-center font-extrabold text-sand shadow-md shrink-0',
        )}
      >
        <span className={c.sr}>SR</span>
      </div>
      <div className="leading-tight">
        <h1 className={cn(c.title, 'font-extrabold tracking-tight', titleColor)}>
          SR <span className={accentColor}>GESTÃO</span>
        </h1>
        {showSlogan && (
          <p className={cn(c.slogan, 'font-medium', sloganColor)}>Gestão que gera resultados.</p>
        )}
      </div>
    </div>
  )
}
