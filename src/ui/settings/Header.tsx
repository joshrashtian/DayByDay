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

const SettingsTitle = ({ children, ...props }: { children: React.ReactNode, props: any }) => {
  return (
    <h1 className={twMerge("font-black font-mono" , props?.className)}>{children}</h1>
  )
}
const SettingsSubtitle = ({ children } : { children: React.ReactNode}) => {
    return (
        <p className="text-slate-500 font-mono">{children}</p>
    )
}

const SettingsHeader = Object.assign(SettingsHRoot, {
  Title: SettingsTitle,
  Subtitle: SettingsSubtitle
  }
  )

export default SettingsHeader
