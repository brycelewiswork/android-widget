import { useRef, useState, type CSSProperties, type DragEvent } from 'react';
import type { ImagePickerValue } from '../store/DialStore';
import { Folder } from './Folder';
import { valuesEqual } from './valuesEqual';

/**
 * ImagePickerControl — the uploaded source-image set. Two layouts (toggle in the
 * header): **card** (thumbnail grid, the default) and **list** (rows with a grip).
 * Drag a thumbnail/row to reorder — order is meaningful to some consumers. Add via
 * the + tile/row, remove via each item's ✕. Values are image `src` strings.
 */

interface ImagePickerControlProps {
  label: string;
  value: ImagePickerValue;
  defaultValue: ImagePickerValue;
  onChange: (value: ImagePickerValue) => void;
  help?: string;
}

const readAsDataURL = (file: File) =>
  new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });

const tile: CSSProperties = {
  position: 'relative',
  aspectRatio: '1 / 1',
  borderRadius: 'var(--dial-radius, 8px)',
  overflow: 'hidden',
};

const GridIcon = () => (
  <svg viewBox="0 0 16 16" width={13} height={13} fill="currentColor">
    <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.3" />
    <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.3" />
    <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.3" />
    <rect x="9" y="9" width="5.5" height="5.5" rx="1.3" />
  </svg>
);

const ListIcon = () => (
  <svg viewBox="0 0 16 16" width={13} height={13} fill="currentColor">
    <rect x="1.5" y="2.5" width="13" height="2.3" rx="1.15" />
    <rect x="1.5" y="6.85" width="13" height="2.3" rx="1.15" />
    <rect x="1.5" y="11.2" width="13" height="2.3" rx="1.15" />
  </svg>
);

export function ImagePickerControl({ label, value, defaultValue, onChange, help }: ImagePickerControlProps) {
  const images = Array.isArray(value) ? value : [];
  const def = defaultValue ?? [];
  const canReset = !valuesEqual(images, def);
  const inputRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<'card' | 'list'>('card');
  const dragIndex = useRef<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const onFiles = async (list: FileList | null) => {
    if (!list || !list.length) return;
    const urls = await Promise.all([...list].map(readAsDataURL));
    onChange([...images, ...urls]);
  };

  const removeAt = (i: number) => onChange(images.filter((_, idx) => idx !== i));

  const move = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || to >= images.length) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  // Drag-to-reorder (HTML5 DnD) — shared by both layouts.
  const dragProps = (i: number) => ({
    draggable: true,
    onDragStart: (e: DragEvent) => {
      dragIndex.current = i;
      e.dataTransfer.effectAllowed = 'move';
    },
    onDragOver: (e: DragEvent) => {
      e.preventDefault();
      if (overIndex !== i) setOverIndex(i);
    },
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      if (dragIndex.current != null) move(dragIndex.current, i);
      dragIndex.current = null;
      setOverIndex(null);
    },
    onDragEnd: () => {
      dragIndex.current = null;
      setOverIndex(null);
    },
  });

  const viewBtn = (active: boolean): CSSProperties => ({
    width: 24,
    height: 22,
    borderRadius: 5,
    border: 'none',
    background: active ? 'var(--dial-surface-active)' : 'transparent',
    color: active ? 'var(--dial-text-focus)' : 'var(--dial-text-label)',
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
  });

  const removeOverlay: CSSProperties = {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(0,0,0,0.55)',
    color: '#fff',
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
    fontSize: 12,
    lineHeight: 1,
  };

  const dashedBox: CSSProperties = {
    padding: 8,
    border: '1px dashed var(--dial-border)',
    borderRadius: 'calc(var(--dial-radius, 8px) + 2px)',
  };

  return (
    <Folder title={label} help={help} defaultOpen={true} canReset={canReset} onReset={() => onChange(def)}>
      <div className="dialkit-image-picker-control" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* View toggle */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', gap: 2, padding: 2, background: 'var(--dial-surface)', border: '1px solid var(--dial-border)', borderRadius: 7 }}>
            <button type="button" title="Card view" onClick={() => setView('card')} style={viewBtn(view === 'card')}>
              <GridIcon />
            </button>
            <button type="button" title="List view" onClick={() => setView('list')} style={viewBtn(view === 'list')}>
              <ListIcon />
            </button>
          </div>
        </div>

        {view === 'card' ? (
          <div style={{ ...dashedBox, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {images.map((src, i) => (
              <div
                key={i}
                {...dragProps(i)}
                style={{
                  ...tile,
                  cursor: 'grab',
                  outline: overIndex === i ? '2px solid var(--dial-text-focus)' : 'none',
                  outlineOffset: -1,
                }}
              >
                <img src={src} draggable={false} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <button type="button" title="Remove" onClick={() => removeAt(i)} style={removeOverlay}>
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              title="Add image"
              onClick={() => inputRef.current?.click()}
              style={{ ...tile, border: '1px solid var(--dial-border)', background: 'var(--dial-surface)', color: 'var(--dial-text-tertiary)', cursor: 'pointer', display: 'grid', placeItems: 'center', fontSize: 22 }}
            >
              +
            </button>
          </div>
        ) : (
          <div style={{ ...dashedBox, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {images.length === 0 && (
              <span style={{ fontSize: 12, color: 'var(--dial-text-tertiary)', padding: '4px 2px' }}>No images yet.</span>
            )}
            {images.map((src, i) => (
              <div
                key={i}
                {...dragProps(i)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: 6,
                  borderRadius: 8,
                  background: 'var(--dial-surface)',
                  border: `1px solid ${overIndex === i ? 'var(--dial-text-focus)' : 'var(--dial-border)'}`,
                  cursor: 'grab',
                }}
              >
                <span style={{ color: 'var(--dial-text-tertiary)', fontSize: 13, lineHeight: 1, letterSpacing: '-2px', userSelect: 'none' }}>⣿</span>
                <img src={src} draggable={false} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: 'var(--dial-text-label)', fontVariantNumeric: 'tabular-nums' }}>
                  Image {i + 1}
                </span>
                <button
                  type="button"
                  title="Remove"
                  onClick={() => removeAt(i)}
                  className="dialkit-ghost-btn"
                  style={{ width: 22, height: 22, fontSize: 12, color: 'var(--dial-text-label)' }}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              style={{ padding: '8px 10px', borderRadius: 8, border: '1px dashed var(--dial-border)', background: 'transparent', color: 'var(--dial-text-label)', cursor: 'pointer', fontSize: 12, textAlign: 'center' }}
            >
              + Add image
            </button>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => {
            void onFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
    </Folder>
  );
}
