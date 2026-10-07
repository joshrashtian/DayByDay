import React from 'react'

const Container = ({ children } : { children: React.ReactNode }) => {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-line bg-sunken/80 px-3 py-3">
      {children}
    </div>
  )
}

export default Container
