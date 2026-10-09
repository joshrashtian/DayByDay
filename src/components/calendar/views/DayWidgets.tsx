import HevyWidget from '@/screens/integrations/HevyWidget'
import { useCallback, useState } from 'react'

const DayWidgets = ({ day }: { day: any }) => {
  const [active, setActive] = useState<Record<string, boolean>>({})

  const report = useCallback((id: string, isActive: boolean) => {
    setActive(prev => (prev[id] === isActive ? prev : { ...prev, [id]: isActive }))
  }, [])

  const anyActive = Object.values(active).some(Boolean)

  return (
    <div className={anyActive ? 'grid grid-cols-5 grid-rows-2 h-48 gap-4' : 'hidden'}>
      <HevyWidget
        date={day.toJSDate()}
        onActiveChange={a => report('hevy', a)}
      />
    </div>
  )
}

export default DayWidgets
