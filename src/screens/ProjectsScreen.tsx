import { motion } from "motion/react"

type Project = { id: string; name: string }

const ProjectScreen = ({ projects = [] as Project[] }) => {
  return (
    <div className="flex flex-col justify-start items-start gap-6 p-6">
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display text-4xl font-bold tracking-tight text-ink"
      >
        Projects
      </motion.h1>

      <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-ink/30 text-ink/60 hover:border-ink hover:text-ink"
        >
          + Add Project
        </motion.button>

        {projects.map((p) => (
          <motion.div
            key={p.id}
            layout
            className="flex aspect-square items-end rounded-xl bg-black p-4 text-white"
          >
            {p.name}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default ProjectScreen
