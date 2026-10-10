import React from 'react'
import { twMerge } from 'tailwind-merge'

type HeaderProps = React.HTMLAttributes<HTMLDivElement>

const SettingsHRoot = ({ children, className = '', ...props }: HeaderProps) => {
  return (
    <div
      className={`flex items-start border-b justify-between gap-4  dark:bg-zinc-900/90 px-3 py-3 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

// Unlayered `h1 { text-align: center }` in App.css beats layered utilities, so `!` is needed.
const SettingsTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
  return (
    <h1
      className={twMerge("text-left! text-2xl font-black font-mono text-ink", className)}
      {...props}
    />
  )
}
const SettingsSubtitle = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => {
    return (
        <p className={twMerge("mt-1 text-sm text-slate-500 font-mono", className)} {...props} />
    )
}

const SettingsHeader = Object.assign(SettingsHRoot, {
  Title: SettingsTitle,
  Subtitle: SettingsSubtitle
  }
  )

export default SettingsHeader
