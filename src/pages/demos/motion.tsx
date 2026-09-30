import { motion } from "motion/react"
import { IconSparkles } from "@tabler/icons-react"
import { DemoSection } from "@/components/DemoSection"
import { SQUIRCLE_RADIUS } from "@/components/squircle"
import { EASE } from "@/lib/motion"
import type { DemoEntry } from "./types"

function MotionDemo() {
  return (
    <DemoSection title="Motion (framer-motion)" lib="motion" docsUrl="https://motion.dev/docs">
      <p className="text-body text-label-secondary">
        React animation primitives — springs, transforms, layout, gesture.
      </p>
      <div className="flex items-center gap-inline-s">
        <motion.div
          className="flex h-16 w-16 items-center justify-center bg-label text-surface"
          style={{ borderRadius: SQUIRCLE_RADIUS.xl }}
          animate={{ rotate: [0, 90, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: EASE.easeInOut }}
        >
          <IconSparkles className="size-5" />
        </motion.div>
        <span className="text-body text-label-secondary">
          Looping rotate + scale via <code>motion.div</code>.
        </span>
      </div>
    </DemoSection>
  )
}

const entry: DemoEntry = {
  lib: "motion",
  role: "animation",
  docsUrl: "https://motion.dev/docs",
  Component: MotionDemo,
}
export default entry
