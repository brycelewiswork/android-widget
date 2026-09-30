import { type ReactNode, useRef, useState } from 'react';
import {
  motion,
  useInView,
  type Variant,
  type Transition,
  type UseInViewOptions,
} from 'motion/react';

export type InViewProps = {
  children: ReactNode;
  variants?: {
    hidden: Variant;
    visible: Variant;
  };
  transition?: Transition;
  viewOptions?: UseInViewOptions;
  as?: React.ElementType;
  once?: boolean
};

const defaultVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export function InView({
  children,
  variants = defaultVariants,
  transition,
  viewOptions,
  as = 'div',
  once
}: InViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, viewOptions);

  const [isViewed, setIsViewed] = useState(false)

  // Indexing `motion[as]` returns a union of every motion component, whose
  // shared props collapse to `never`. Cast to a concrete motion component so
  // the motion props (initial/animate/variants/transition) typecheck; all
  // motion DOM components share the same prop surface.
  const MotionComponent = motion[as as keyof typeof motion] as typeof motion.div;

  return (
    <MotionComponent
      ref={ref}
      initial='hidden'
      onAnimationComplete={() => {
        if (once) setIsViewed(true)
      }}
      animate={(isInView || isViewed) ? "visible" : "hidden"}

      variants={variants}
      transition={transition}
    >
      {children}
    </MotionComponent>
  );
}
