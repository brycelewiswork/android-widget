import { useState, useRef, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ICON_PANEL, ICON_CHEVRON, ICON_RESET } from '../icons';
import { HelpDot } from './HelpDot';

interface FolderProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  isRoot?: boolean;
  inline?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  toolbar?: ReactNode;
  panelHeightOffset?: number;
  /** Show a reset-to-default button in the header (used by control wrappers). */
  canReset?: boolean;
  onReset?: () => void;
  /** Optional explainer text → a "?" tooltip beside the title. */
  help?: string;
}

export function Folder({ title, children, defaultOpen = true, isRoot = false, inline = false, onOpenChange, toolbar, panelHeightOffset = 10, canReset = false, onReset, help }: FolderProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isCollapsed, setIsCollapsed] = useState(!defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);
  const [windowHeight, setWindowHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 800);

  useEffect(() => {
    if (!isRoot) return;
    const onResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isRoot]);

  // Track content height for explicit panel sizing (no height: 'auto')
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (isOpen) {
        const h = el.offsetHeight;
        setContentHeight(prev => prev === h ? prev : h);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [isOpen]);

  const handleToggle = () => {
    if (inline && isRoot) return;
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      setIsCollapsed(false);
    } else {
      setIsCollapsed(true);
    }
    onOpenChange?.(next);
  };

  const folderContent = (
    <div
      ref={isRoot ? contentRef : undefined}
      className={`dialkit-folder ${isRoot ? 'dialkit-folder-root' : ''}`}
      data-open={String(isOpen)}
    >
      <div className={`dialkit-folder-header ${isRoot ? 'dialkit-panel-header' : ''}`} onClick={handleToggle}>
        <div className="dialkit-folder-header-top">
          {isRoot ? (
            isOpen && (
              <div className="dialkit-folder-title-row">
                <span className="dialkit-folder-title dialkit-folder-title-root">
                  {title}
                </span>
                {help && <span style={{ marginLeft: 5, display: 'inline-flex' }} onClick={(e) => e.stopPropagation()}><HelpDot text={help} /></span>}
              </div>
            )
          ) : (
            <div className="dialkit-folder-title-row">
              <span className="dialkit-folder-title">
                {title}
              </span>
              {help && <span style={{ marginLeft: 5, display: 'inline-flex' }} onClick={(e) => e.stopPropagation()}><HelpDot text={help} /></span>}
            </div>
          )}
          {isRoot && !inline && (
            <svg
              className="dialkit-panel-icon"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path opacity="0.5" d={ICON_PANEL.path} fill="currentColor"/>
              {ICON_PANEL.circles.map((c, i) => (
                <circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill="currentColor" stroke="currentColor" strokeWidth="1.25"/>
              ))}
            </svg>
          )}
          {!isRoot && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {canReset && onReset && (
                <motion.button
                  type="button"
                  className="dialkit-ghost-btn"
                  title="Reset to default"
                  onClick={(e) => { e.stopPropagation(); onReset(); }}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.12 }}
                  style={{ width: 20, height: 20 }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
                    {ICON_RESET.map((d, i) => (
                      <path key={i} d={d} />
                    ))}
                  </svg>
                </motion.button>
              )}
              <motion.svg
                className="dialkit-folder-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={false}
                animate={{ rotate: isOpen ? 0 : 180 }}
                transition={{ type: 'spring', visualDuration: 0.35, bounce: 0.15 }}
              >
                <path d={ICON_CHEVRON} />
              </motion.svg>
            </div>
          )}
        </div>

        {isRoot && toolbar && isOpen && (
          <div className="dialkit-panel-toolbar" onClick={(e) => e.stopPropagation()}>
            {toolbar}
          </div>
        )}
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            className="dialkit-folder-content"
            initial={isRoot ? undefined : { height: 0, opacity: 0 }}
            animate={isRoot ? undefined : { height: 'auto', opacity: 1 }}
            exit={isRoot ? undefined : { height: 0, opacity: 0 }}
            transition={isRoot ? undefined : { type: 'spring', visualDuration: 0.35, bounce: 0.1 }}
            style={isRoot ? undefined : { clipPath: 'inset(0 -20px)' }}
          >
            <div className="dialkit-folder-inner">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (isRoot) {
    if (inline) {
      return (
        <div className="dialkit-panel-inner dialkit-panel-inline">
          {folderContent}
        </div>
      );
    }

    const panelStyle = isOpen
      ? { width: 280, height: contentHeight !== undefined ? Math.min(contentHeight + panelHeightOffset, windowHeight - 32) : 'auto' as const, borderRadius: 14, boxShadow: 'var(--dial-shadow)', cursor: undefined as string | undefined, overflowY: 'auto' as const }
      : { width: 42, height: 42, borderRadius: '50%', boxSizing: 'border-box' as const, boxShadow: 'var(--dial-shadow-collapsed)', overflow: 'hidden' as const, cursor: 'pointer' as const };

    return (
      <motion.div
        className="dialkit-panel-inner"
        style={panelStyle}
        onClick={!isOpen ? handleToggle : undefined}
        data-collapsed={isCollapsed}
        whileTap={!isOpen ? { scale: 0.9 } : undefined}
        transition={{ type: 'spring', visualDuration: 0.15, bounce: 0.3 }}
      >
        {folderContent}
      </motion.div>
    );
  }

  return folderContent;
}
