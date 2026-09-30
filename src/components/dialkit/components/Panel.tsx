import { useCallback, useContext, useState, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DialStore, type ControlMeta, type PanelConfig, type SpringConfig, type TransitionConfig, type VectorValue, type GradientValue, type RangeInputValue, type ColorCollectionValue, type PaletteValue, type FontPickerValue, type CurvesValue, type ImagePickerValue } from '../store/DialStore';
import { ShortcutContext } from './ShortcutListener';
import { ICON_CLIPBOARD, ICON_CHECK, ICON_ADD_PRESET, ICON_RESET } from '../icons';
import { Folder } from './Folder';
import { Slider } from './Slider';
import { Toggle } from './Toggle';
import { SpringControl } from './SpringControl';
import { TransitionControl } from './TransitionControl';
import { TextControl } from './TextControl';
import { SelectControl } from './SelectControl';
import { ColorControl } from './ColorControl';
import { VectorControl } from './VectorControl';
import { ImagePickerControl } from './ImagePickerControl';
import { CurvesControl } from './CurvesControl';
import { FontPickerControl } from './FontPickerControl';
import { PaletteControl } from './PaletteControl';
import { ColorCollectionControl } from './ColorCollectionControl';
import { RangeInputControl } from './RangeInputControl';
import { GradientControl } from './GradientControl';
import { PresetManager } from './PresetManager';

interface PanelProps {
  panel: PanelConfig;
  defaultOpen?: boolean;
  inline?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: 'root' | 'section';
}

/** Every value-bearing path under a set of controls (recurses folders; skips actions). */
function collectLeafPaths(controls: ControlMeta[]): string[] {
  const paths: string[] = [];
  for (const c of controls) {
    if (c.type === 'folder') {
      if (c.children) paths.push(...collectLeafPaths(c.children));
    } else if (c.type !== 'action') {
      paths.push(c.path);
    }
  }
  return paths;
}

export function Panel({ panel, defaultOpen = true, inline = false, onOpenChange, variant = 'root' }: PanelProps) {
  const [copied, setCopied] = useState(false);
  const [, setIsPanelOpen] = useState(defaultOpen);
  const shortcutCtx = useContext(ShortcutContext);
  const subscribe = useCallback(
    (callback: () => void) => DialStore.subscribe(panel.id, callback),
    [panel.id]
  );
  const getSnapshot = useCallback(
    () => DialStore.getValues(panel.id),
    [panel.id]
  );

  // Subscribe to panel value changes
  const values = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Panel-level reset: show ↺ when any control anywhere has drifted from default.
  const panelLeafPaths = collectLeafPaths(panel.controls);
  const panelCanReset = panelLeafPaths.some((p) => !DialStore.isDefaultValue(panel.id, p));

  const presets = DialStore.getPresets(panel.id);
  const activePresetId = DialStore.getActivePresetId(panel.id);

  const handleAddPreset = () => {
    const nextNum = presets.length + 2;
    DialStore.savePreset(panel.id, `Version ${nextNum}`);
  };

  const handleCopy = () => {
    const jsonStr = JSON.stringify(values, null, 2);

    const instruction = `Update the useDialKit configuration for "${panel.name}" with these values:

\`\`\`json
${jsonStr}
\`\`\`

Apply these values as the new defaults in the useDialKit call.`;

    navigator.clipboard.writeText(instruction);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleOpenChange = useCallback((open: boolean) => {
    setIsPanelOpen(open);
    onOpenChange?.(open);
  }, [onOpenChange]);

  const renderControl = (control: ControlMeta) => {
    const value = values[control.path];

    switch (control.type) {
      case 'slider':
        return (
          <Slider
            key={control.path}
            label={control.label}
            help={control.help}
            value={value as number}
            onChange={(v) => DialStore.updateValue(panel.id, control.path, v)}
            onReset={() => DialStore.resetValue(panel.id, control.path)}
            min={control.min}
            max={control.max}
            step={control.step}
            shortcut={control.shortcut}
            shortcutActive={shortcutCtx.activePanelId === panel.id && shortcutCtx.activePath === control.path}
          />
        );

      case 'toggle':
        return (
          <Toggle
            key={control.path}
            label={control.label}
            help={control.help}
            checked={value as boolean}
            onChange={(v) => DialStore.updateValue(panel.id, control.path, v)}
            shortcut={control.shortcut}
            shortcutActive={shortcutCtx.activePanelId === panel.id && shortcutCtx.activePath === control.path}
          />
        );

      case 'spring':
        return (
          <SpringControl
            key={control.path}
            panelId={panel.id}
            path={control.path}
            label={control.label}
            help={control.help}
            spring={value as SpringConfig}
            onChange={(v) => DialStore.updateValue(panel.id, control.path, v)}
          />
        );

      case 'transition':
        return (
          <TransitionControl
            key={control.path}
            panelId={panel.id}
            path={control.path}
            label={control.label}
            help={control.help}
            value={value as TransitionConfig}
            onChange={(v) => DialStore.updateValue(panel.id, control.path, v)}
          />
        );

      case 'folder': {
        const leafPaths = collectLeafPaths(control.children ?? []);
        const folderCanReset = leafPaths.some((p) => !DialStore.isDefaultValue(panel.id, p));
        return (
          <Folder
            key={control.path}
            title={control.label}
            help={control.help}
            defaultOpen={control.defaultOpen ?? true}
            canReset={folderCanReset}
            onReset={() => leafPaths.forEach((p) => DialStore.resetValue(panel.id, p))}
          >
            {control.children?.map(renderControl)}
          </Folder>
        );
      }

      case 'text':
        return (
          <TextControl
            key={control.path}
            label={control.label}
            help={control.help}
            value={value as string}
            onChange={(v) => DialStore.updateValue(panel.id, control.path, v)}
            placeholder={control.placeholder}
          />
        );

      case 'select':
        return (
          <SelectControl
            key={control.path}
            label={control.label}
            help={control.help}
            value={value as string}
            options={control.options ?? []}
            onChange={(v) => DialStore.updateValue(panel.id, control.path, v)}
          />
        );

      case 'color':
        return (
          <ColorControl
            key={control.path}
            label={control.label}
            help={control.help}
            value={value as string}
            onChange={(v) => DialStore.updateValue(panel.id, control.path, v)}
          />
        );

      case 'gradient':
        return (
          <GradientControl
            key={control.path}
            label={control.label}
            help={control.help}
            value={value as GradientValue}
            defaultValue={control.defaultValue as GradientValue}
            onChange={(v) => DialStore.updateValue(panel.id, control.path, v)}
          />
        );

      case 'rangeInput':
        return (
          <RangeInputControl
            key={control.path}
            label={control.label}
            help={control.help}
            value={value as RangeInputValue}
            defaultValue={control.defaultValue as RangeInputValue}
            onChange={(v) => DialStore.updateValue(panel.id, control.path, v)}
          />
        );

      case 'colorCollection':
        return (
          <ColorCollectionControl
            key={control.path}
            label={control.label}
            help={control.help}
            value={value as ColorCollectionValue}
            defaultValue={control.defaultValue as ColorCollectionValue}
            onChange={(v) => DialStore.updateValue(panel.id, control.path, v)}
          />
        );

      case 'palette':
        return (
          <PaletteControl
            key={control.path}
            label={control.label}
            help={control.help}
            value={value as PaletteValue}
            defaultValue={control.defaultValue as PaletteValue}
            onChange={(v) => DialStore.updateValue(panel.id, control.path, v)}
          />
        );

      case 'fontPicker':
        return (
          <FontPickerControl
            key={control.path}
            label={control.label}
            help={control.help}
            value={value as FontPickerValue}
            defaultValue={control.defaultValue as FontPickerValue}
            onChange={(v) => DialStore.updateValue(panel.id, control.path, v)}
          />
        );

      case 'curves':
        return (
          <CurvesControl
            key={control.path}
            label={control.label}
            help={control.help}
            value={value as CurvesValue}
            defaultValue={control.defaultValue as CurvesValue}
            onChange={(v) => DialStore.updateValue(panel.id, control.path, v)}
          />
        );

      case 'imagePicker':
        return (
          <ImagePickerControl
            key={control.path}
            label={control.label}
            help={control.help}
            value={value as ImagePickerValue}
            defaultValue={control.defaultValue as ImagePickerValue}
            onChange={(v) => DialStore.updateValue(panel.id, control.path, v)}
          />
        );

      case 'vector':
        return (
          <VectorControl
            key={control.path}
            label={control.label}
            help={control.help}
            value={value as VectorValue}
            defaultValue={(control.defaultValue as VectorValue) ?? { x: 0, y: 0 }}
            onChange={(v) => DialStore.updateValue(panel.id, control.path, v)}
          />
        );

      case 'action':
        return (
          <button
            key={control.path}
            className={`dialkit-button${control.actionVariant === 'primary' ? ' dialkit-button-primary' : ''}`}
            onClick={() => DialStore.triggerAction(panel.id, control.path)}
          >
            {control.label}
          </button>
        );

      default:
        return null;
    }
  };

  const renderControls = () => {
    return panel.controls.map(renderControl);
  };


  const toolbar = (
    <>
      {panelCanReset && (
        <motion.button
          className="dialkit-toolbar-add"
          onClick={() => DialStore.resetValues(panel.id)}
          title="Reset all to defaults"
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', visualDuration: 0.15, bounce: 0.3 }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
            {ICON_RESET.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </svg>
        </motion.button>
      )}

      <motion.button
        className="dialkit-toolbar-add"
        onClick={handleAddPreset}
        title="Add preset"
        whileTap={{ scale: 0.9 }}
        transition={{ type: 'spring', visualDuration: 0.15, bounce: 0.3 }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {ICON_ADD_PRESET.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </svg>
      </motion.button>

      <PresetManager
        panelId={panel.id}
        presets={presets}
        activePresetId={activePresetId}
        onAdd={handleAddPreset}
      />

      <motion.button
        className="dialkit-toolbar-add"
        onClick={handleCopy}
        title="Copy parameters"
        whileTap={{ scale: 0.9 }}
        transition={{ type: 'spring', visualDuration: 0.15, bounce: 0.3 }}
      >
        <span style={{ position: 'relative', width: 16, height: 16 }}>
          <AnimatePresence initial={false} mode="wait">
            {copied ? (
              <motion.svg
                key="check"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ position: 'absolute', inset: 0, width: 16, height: 16, color: 'var(--dial-text-label)' }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.08 }}
              >
                <path d={ICON_CHECK} />
              </motion.svg>
            ) : (
              <motion.svg
                key="clipboard"
                viewBox="0 0 24 24"
                fill="none"
                style={{ position: 'absolute', inset: 0, width: 16, height: 16, color: 'var(--dial-text-label)' }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.08 }}
              >
                <path d={ICON_CLIPBOARD.board} stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                <path d={ICON_CLIPBOARD.sparkle} fill="currentColor"/>
                <path d={ICON_CLIPBOARD.body} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </motion.svg>
            )}
          </AnimatePresence>
        </span>
      </motion.button>

    </>
  );

  if (variant === 'section') {
    return (
      <Folder title={panel.name} defaultOpen={defaultOpen} onOpenChange={handleOpenChange}>
        <div className="dialkit-panel-section-toolbar" onClick={(e) => e.stopPropagation()}>
          {toolbar}
        </div>
        {renderControls()}
      </Folder>
    );
  }

  return (
    <div className="dialkit-panel-wrapper">
      <Folder title={panel.name} defaultOpen={defaultOpen} isRoot={true} inline={inline} onOpenChange={handleOpenChange} toolbar={toolbar}>
        {renderControls()}
      </Folder>
    </div>
  );
}
