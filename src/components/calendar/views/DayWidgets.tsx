import HevyWidget from '@/screens/integrations/HevyWidget'
const DayWidgets = ({ day }: { day: any }) => {
  return (
    <div className="grid grid-cols-5 h-48 gap-4 grid-rows-2">
      <HevyWidget date={day.toJSDate()} />
    </div>
  )
}

export default DayWidgets
