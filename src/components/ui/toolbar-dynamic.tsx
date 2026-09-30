import React, { useRef, useState } from 'react';
import { Squircle, SQUIRCLE_RADIUS } from '@/components/squircle';
import {
  motion,
  MotionConfig,
} from 'motion/react';
import useClickOutside from '@/hooks/useClickOutside';
import { IconArrowLeft, IconSearch, IconUser } from '@tabler/icons-react';

import { SPRING_FAST } from '@/lib/motion';

const transition = {
  type: 'spring' as const,
  ...SPRING_FAST.snappy,
};

function Button({
  children,
  onClick,
  disabled,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      className='relative flex h-9 w-9 shrink-0 scale-100 select-none appearance-none items-center justify-center rounded-lg text-label-secondary transition-colors hover:bg-surface-tertiary hover:text-label focus-visible:ring-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50'
      type='button'
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

export default function ToolbarDynamic() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, () => {
    setIsOpen(false);
  });

  return (
    <MotionConfig transition={transition}>
      <div className='absolute bottom-8' ref={containerRef}>
        <Squircle as="div" cornerRadius={SQUIRCLE_RADIUS.xl} className='h-full w-full rounded-xl inset-ring-1 inset-ring-stroke-faint bg-surface-secondary'>
          <motion.div
            animate={{
              // @todo: here I want to remove the width
              width: isOpen ? '300px' : '98px',
            }}
            initial={false}
          >
            <div className='overflow-hidden p-2'>
              {!isOpen ? (
                <div className='flex space-x-2'>
                  <Button disabled ariaLabel='IconUser profile'>
                    <IconUser className='h-5 w-5' />
                  </Button>
                  <Button
                    onClick={() => setIsOpen(true)}
                    ariaLabel='IconSearch notes'
                  >
                    <IconSearch className='h-5 w-5' />
                  </Button>
                </div>
              ) : (
                <div className='flex space-x-2'>
                  <Button onClick={() => setIsOpen(false)} ariaLabel='Back'>
                    <IconArrowLeft className='h-5 w-5' />
                  </Button>
                  <div className='relative w-full'>
                    <input
                      className='h-9 w-full rounded-lg inset-ring-1 inset-ring-stroke-faint bg-transparent p-2 text-label placeholder-label-secondary focus:outline-hidden'
                      autoFocus
                      placeholder='IconSearch notes'
                    />
                    <div className='absolute right-1 top-0 flex h-full items-center justify-center'></div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </Squircle>
      </div>
    </MotionConfig>
  );
}
