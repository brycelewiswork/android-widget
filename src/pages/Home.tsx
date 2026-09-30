import { useEffect } from "react"
import { motion } from "motion/react"
import { DURATION, EASE } from "@/lib/motion"
import { LetterCloud } from "@/components/letter-cloud"

export function Home() {
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyOverscroll: body.style.overscrollBehavior,
      touch: body.style.touchAction,
    }
    html.style.overflow = "hidden"
    body.style.overflow = "hidden"
    body.style.overscrollBehavior = "none"
    body.style.touchAction = "none"
    return () => {
      html.style.overflow = prev.htmlOverflow
      body.style.overflow = prev.bodyOverflow
      body.style.overscrollBehavior = prev.bodyOverscroll
      body.style.touchAction = prev.touch
    }
  }, [])
  return (
    <main className="relative h-svh overflow-hidden">
      <LetterCloud
        text="PROJECT BASE"
        className="absolute inset-0"
      />
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATION.slow, ease: EASE.apple, delay: 0.2 }}
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 mt-20 max-w-md px-inset-m text-center text-body text-label-secondary"
      >
        A suite of tools and primitives to make launching into high fidelity work easier
      </motion.p>
    </main>
  )
}
