import React from 'react'

type HeaderProps = React.HTMLAttributes<HTMLDivElement>

const SettingsHeader = ({ children, className = '', ...props }: HeaderProps) => {
  return (
    <div
      className={`flex items-start justify-between gap-4 border-b border-line bg-zinc-100 dark:bg-zinc-900/90 px-3 py-3 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export default SettingsHeader
