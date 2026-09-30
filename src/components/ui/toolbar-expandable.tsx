import { useEffect, useRef, useState } from 'react';
import useMeasure from 'react-use-measure';
import {
  AnimatePresence,
  motion,
  MotionConfig,
} from 'motion/react';
import { cn } from '@/lib/utils';
import { Squircle, SQUIRCLE_RADIUS } from '@/components/squircle';
import useClickOutside from '@/hooks/useClickOutside';
import { IconFolder, IconMessageCircle, IconUser, IconWallet } from '@tabler/icons-react';

import { SPRING_FAST } from '@/lib/motion';

const transition = {
  type: 'spring' as const,
  ...SPRING_FAST.snappy,
};

const ITEMS = [
  {
    id: 1,
    label: 'IconUser',
    title: <IconUser className='h-5 w-5' />,
    content: (
      <div className='flex flex-col space-y-4'>
        <div className='flex flex-col space-y-1 text-label'>
          <div className='h-8 w-8 rounded-full bg-linear-to-br from-blue-500 to-blue-400' />
          <span>Ibelick</span>
        </div>
        <button
          className='relative h-8 w-full scale-100 select-none appearance-none items-center justify-center rounded-lg inset-ring-1 inset-ring-stroke-faint px-2 text-sm text-label-secondary transition-colors hover:bg-surface-tertiary hover:text-label focus-visible:ring-2 active:scale-[0.98]'
          type='button'
        >
          Edit Profile
        </button>
      </div>
    ),
  },
  {
    id: 2,
    label: 'Messages',
    title: <IconMessageCircle className='h-5 w-5' />,
    content: (
      <div className='flex flex-col space-y-4'>
        <div className='text-label'>You have 3 new messages.</div>
        <button
          className='relative h-8 w-full scale-100 select-none appearance-none items-center justify-center rounded-lg inset-ring-1 inset-ring-stroke-faint px-2 text-sm text-label-secondary transition-colors hover:bg-surface-tertiary hover:text-label focus-visible:ring-2 active:scale-[0.98]'
          type='button'
        >
          View more
        </button>
      </div>
    ),
  },
  {
    id: 3,
    label: 'Documents',
    title: <IconFolder className='h-5 w-5' />,
    content: (
      <div className='flex flex-col space-y-4'>
        <div className='flex flex-col text-label'>
          <div className='space-y-1'>
            <div>Project_Proposal.pdf</div>
            <div>Meeting_Notes.docx</div>
            <div>Financial_Report.xls</div>
          </div>
        </div>
        <button
          className='relative h-8 w-full scale-100 select-none appearance-none items-center justify-center rounded-lg inset-ring-1 inset-ring-stroke-faint px-2 text-sm text-label-secondary transition-colors hover:bg-surface-tertiary hover:text-label focus-visible:ring-2 active:scale-[0.98]'
          type='button'
        >
          Manage documents
        </button>
      </div>
    ),
  },
  {
    id: 4,
    label: 'Wallet',
    title: <IconWallet className='h-5 w-5' />,
    content: (
      <div className='flex flex-col space-y-4'>
        <div className='flex flex-col text-label'>
          <span>Current Balance</span>
          <span>$1,250.32</span>
        </div>
        <button
          className='relative h-8 w-full scale-100 select-none appearance-none items-center justify-center rounded-lg inset-ring-1 inset-ring-stroke-faint px-2 text-sm text-label-secondary transition-colors hover:bg-surface-tertiary hover:text-label focus-visible:ring-2 active:scale-[0.98]'
          type='button'
        >
          View Transactions
        </button>
      </div>
    ),
  },
];

export default function ToolbarExpandable() {
  const [active, setActive] = useState<number | null>(null);
  const [contentRef, { height: heightContent }] = useMeasure();
  const [menuRef, { width: widthContainer }] = useMeasure();
  const ref = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [maxWidth, setMaxWidth] = useState(0);

  useClickOutside(ref, () => {
    setIsOpen(false);
    setActive(null);
  });

  useEffect(() => {
    if (!widthContainer || maxWidth > 0) return;

    setMaxWidth(widthContainer);
  }, [widthContainer, maxWidth]);

  return (
    <MotionConfig transition={transition}>
      <div className='absolute bottom-8' ref={ref}>
        <Squircle as="div" cornerRadius={SQUIRCLE_RADIUS.xl} className='h-full w-full rounded-xl inset-ring-1 inset-ring-stroke-faint bg-surface-secondary'>
          <div className='overflow-hidden'>
            <AnimatePresence initial={false} mode='sync'>
              {isOpen ? (
                <motion.div
                  key='content'
                  initial={{ height: 0 }}
                  animate={{ height: heightContent || 0 }}
                  exit={{ height: 0 }}
                  style={{
                    width: maxWidth,
                  }}
                >
                  <div ref={contentRef} className='p-2'>
                    {ITEMS.map((item) => {
                      const isSelected = active === item.id;

                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: isSelected ? 1 : 0 }}
                          exit={{ opacity: 0 }}
                        >
                          <div
                            className={cn(
                              'px-2 pt-2 text-sm',
                              isSelected ? 'block' : 'hidden'
                            )}
                          >
                            {item.content}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
          <div className='flex space-x-2 p-2' ref={menuRef}>
            {ITEMS.map((item) => (
              <button
                key={item.id}
                aria-label={item.label}
                className={cn(
                  'relative flex h-9 w-9 shrink-0 scale-100 select-none appearance-none items-center justify-center rounded-lg text-label-secondary transition-colors hover:bg-surface-tertiary hover:text-label focus-visible:ring-2 active:scale-[0.98]',
                  active === item.id ? 'bg-surface-tertiary text-label' : ''
                )}
                type='button'
                onClick={() => {
                  if (!isOpen) setIsOpen(true);
                  if (active === item.id) {
                    setIsOpen(false);
                    setActive(null);
                    return;
                  }

                  setActive(item.id);
                }}
              >
                {item.title}
              </button>
            ))}
          </div>
        </Squircle>
      </div>
    </MotionConfig>
  );
}
