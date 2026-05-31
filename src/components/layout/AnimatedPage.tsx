import { motion } from "motion/react";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function AnimatedPage({ children }: Props) {
  return (
    <motion.div className="flex h-full min-h-0 w-full flex-col">
      {children}
    </motion.div>
  );
}
