import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/** Gap kept between the tooltip and the viewport edges. */
const EDGE_MARGIN = 8;
/** Gap between the tooltip and the dot it points at. */
const ANCHOR_GAP = 8;

interface Anchor {
  /** Horizontal centre of the dot. */
  x: number;
  /** Dot's top edge — the tooltip's preferred baseline (it sits above). */
  top: number;
  /** Dot's bottom edge — used when there's no room above and it flips below. */
  bottom: number;
}

/**
 * The portalled tooltip body. Split out from HelpDot so it mounts fresh per
 * anchor, which lets the measure-then-place effect below run exactly once per
 * show instead of racing a stale layout.
 */
function HelpTooltip({ text, anchor }: { text: string; anchor: Anchor }) {
  const ref = useRef<HTMLDivElement>(null);
  // Provisional placement: centred above the dot, same as the unclamped
  // original. Corrected before paint by the layout effect.
  const [placement, setPlacement] = useState({
    left: anchor.x,
    top: anchor.top - ANCHOR_GAP,
    below: false,
  });

  // useLayoutEffect (not useEffect) so the clamped position lands before the
  // browser paints — otherwise the tooltip visibly jumps in from the edge.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { offsetWidth: w, offsetHeight: h } = el;

    // Horizontal: prefer centred on the dot, but keep the whole box on screen.
    // maxWidth is capped to the viewport below, so w can't exceed the range and
    // the clamp can never be inverted.
    const maxLeft = window.innerWidth - EDGE_MARGIN - w;
    const left = Math.max(EDGE_MARGIN, Math.min(anchor.x - w / 2, maxLeft));

    // Vertical: above the dot by default; flip below when that would clip the
    // top edge (a control near the top of a panel dragged to the screen edge).
    const below = anchor.top - ANCHOR_GAP - h < EDGE_MARGIN;
    const top = below ? anchor.bottom + ANCHOR_GAP : anchor.top - ANCHOR_GAP;

    setPlacement({ left, top, below });
  }, [anchor.x, anchor.top, anchor.bottom, text]);

  return (
    <div
      ref={ref}
      role="tooltip"
      style={{
        position: 'fixed',
        left: placement.left,
        top: placement.top,
        transform: placement.below ? undefined : 'translateY(-100%)',
        // Never wider than the viewport allows, so a long string on a narrow
        // screen wraps instead of forcing an unclampable box.
        maxWidth: `min(220px, calc(100vw - ${EDGE_MARGIN * 2}px))`,
        padding: '6px 9px',
        borderRadius: 6,
        background: '#1a1a1a',
        color: '#fff',
        fontSize: 11,
        lineHeight: 1.4,
        fontFamily: 'inherit',
        // Left-aligned rather than centred: once the box is clamped against an
        // edge it no longer sits under the dot, and centred text reads as a
        // mistake at that point.
        textAlign: 'left',
        boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
        zIndex: 2147483640,
        pointerEvents: 'none',
      }}
    >
      {text}
    </div>
  );
}

/**
 * HelpDot — an optional "?" affordance rendered to the right of a control label.
 * Hover or focus it to show explainer text in a tooltip. This is the sanctioned
 * place for help copy so it never gets painted onto the panel/canvas itself. Give
 * a control a `help` string in its config to opt in; renders nothing without one.
 */
export function HelpDot({ text }: { text?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);

  if (!text) return null;

  const show = () => {
    const r = ref.current?.getBoundingClientRect();
    if (r) setAnchor({ x: r.left + r.width / 2, top: r.top, bottom: r.bottom });
  };
  const hide = () => setAnchor(null);

  return (
    <>
      <span
        ref={ref}
        tabIndex={0}
        aria-label={`Help: ${text}`}
        onPointerEnter={show}
        onPointerLeave={hide}
        onFocus={show}
        onBlur={hide}
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          flexShrink: 0,
          display: 'inline-grid',
          placeItems: 'center',
          fontSize: 10,
          fontWeight: 700,
          lineHeight: 1,
          color: 'var(--dial-text-label)',
          background: 'var(--dial-surface-active)',
          border: 'none',
          cursor: 'help',
          userSelect: 'none',
          // Control labels are `pointer-events: none` so drags pass through to the
          // track underneath (see .dialkit-slider-label). The dot is the one part
          // of the label that must stay hittable, and it sits above the fill/handle.
          pointerEvents: 'auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        ?
      </span>
      {anchor && createPortal(<HelpTooltip text={text} anchor={anchor} />, document.body)}
    </>
  );
}
