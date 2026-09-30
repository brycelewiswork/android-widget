// Lightweight state store with subscriptions for dialkit
import { valuesEqual } from '../components/valuesEqual';

export type SpringConfig = {
  type: 'spring';
  stiffness?: number;
  damping?: number;
  mass?: number;
  visualDuration?: number;
  bounce?: number;
};

export type EasingConfig = {
  type: 'easing';
  duration: number;
  ease: [number, number, number, number];
};

export type TransitionConfig = SpringConfig | EasingConfig;

export type ActionConfig = {
  type: 'action';
  label?: string;
  /** 'primary' → accent-filled; default 'secondary' → neutral. */
  variant?: 'primary' | 'secondary';
};

export type SelectConfig = {
  type: 'select';
  options: (string | { value: string; label: string })[];
  default?: string;
};

export type ColorConfig = {
  type: 'color';
  default?: string;
};

export type TextConfig = {
  type: 'text';
  default?: string;
  placeholder?: string;
};

// Object forms of the primitive controls — the only way to attach `help` to them
// (the bare tuple / number / boolean shorthands have nowhere to hang it).
export type SliderConfig = {
  type: 'slider';
  default: number;
  min?: number;
  max?: number;
  step?: number;
  help?: string;
};

export type ToggleConfig = {
  type: 'toggle';
  default: boolean;
  help?: string;
};

export type VectorValue = { x: number; y: number };

export type VectorConfig = {
  type: 'vector';
  default?: VectorValue;
};

export type GradientStop = { id?: string; pos: number; color: string; opacity: number };

export type GradientValue = {
  gradientType: 'linear' | 'radial';
  angle: number;
  stops: GradientStop[];
};

export type GradientConfig = {
  type: 'gradient';
  default?: GradientValue;
};

export const DEFAULT_GRADIENT: GradientValue = {
  gradientType: 'linear',
  angle: 90,
  stops: [
    { id: 'a', pos: 0, color: '#FFFFFF', opacity: 100 },
    { id: 'b', pos: 100, color: '#000000', opacity: 100 },
  ],
};

export type RangeInputValue = { start: number; end: number };

export type RangeInputConfig = {
  type: 'rangeInput';
  default?: RangeInputValue;
};

export const DEFAULT_RANGE_INPUT: RangeInputValue = { start: 0, end: 100 };

export type ColorCollectionValue = string[];

export type ColorCollectionConfig = {
  type: 'colorCollection';
  default?: ColorCollectionValue;
};

export const DEFAULT_COLOR_COLLECTION: ColorCollectionValue = ['#F812F0', '#1D0DC9', '#DD8808', '#C1FF00'];

export type PaletteValue = { family: number; shade: number };

export type PaletteConfig = {
  type: 'palette';
  default?: PaletteValue;
};

export const DEFAULT_PALETTE: PaletteValue = { family: 1, shade: 5 };

export type FontPickerValue = {
  fontId: string;
  fontWeight: number;
  fontSize: number;
  textCase: 'none' | 'upper' | 'lower' | 'title';
  color: string;
  opacity: number;
};

export type FontPickerConfig = {
  type: 'fontPicker';
  default?: FontPickerValue;
};

export const DEFAULT_FONT_PICKER: FontPickerValue = {
  fontId: 'dm-sans',
  fontWeight: 400,
  fontSize: 16,
  textCase: 'none',
  color: '#C1FF00',
  opacity: 82,
};

export type CurvePt = { x: number; y: number };

export type CurvesValue = {
  variant: 'single' | 'rgb';
  rgb: CurvePt[];
  r: CurvePt[];
  g: CurvePt[];
  b: CurvePt[];
};

export type CurvesConfig = {
  type: 'curves';
  default?: CurvesValue;
};

export const DEFAULT_CURVES: CurvesValue = {
  variant: 'rgb',
  rgb: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
  r: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
  g: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
  b: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
};

export type ImagePickerValue = string[];

export type ImagePickerConfig = {
  type: 'imagePicker';
  default?: ImagePickerValue;
};

export const DEFAULT_IMAGE_PICKER: ImagePickerValue = [];

export type DialValue = number | boolean | string | SliderConfig | ToggleConfig | SpringConfig | EasingConfig | ActionConfig | SelectConfig | ColorConfig | TextConfig | VectorConfig | VectorValue | GradientConfig | GradientValue | RangeInputConfig | RangeInputValue | ColorCollectionConfig | ColorCollectionValue | PaletteConfig | PaletteValue | FontPickerConfig | FontPickerValue | CurvesConfig | CurvesValue | ImagePickerConfig | ImagePickerValue;

export type DialConfig = {
  [key: string]: DialValue | [number, number, number, number?] | DialConfig;
};

export type ResolvedValues<T extends DialConfig> = {
  [K in keyof T]: T[K] extends SliderConfig
    ? number
    : T[K] extends ToggleConfig
    ? boolean
    : T[K] extends ImagePickerConfig
    ? ImagePickerValue
    : T[K] extends CurvesConfig
    ? CurvesValue
    : T[K] extends FontPickerConfig
    ? FontPickerValue
    : T[K] extends PaletteConfig
    ? PaletteValue
    : T[K] extends ColorCollectionConfig
    ? ColorCollectionValue
    : T[K] extends RangeInputConfig
    ? RangeInputValue
    : T[K] extends GradientConfig
    ? GradientValue
    : T[K] extends VectorConfig
    ? VectorValue
    : T[K] extends [number, number, number, number?]
    ? number
    : T[K] extends SpringConfig
      ? TransitionConfig
      : T[K] extends EasingConfig
        ? TransitionConfig
        : T[K] extends SelectConfig
          ? string
          : T[K] extends ColorConfig
            ? string
            : T[K] extends TextConfig
              ? string
              : T[K] extends DialConfig
                ? ResolvedValues<T[K]>
                : T[K];
};

export type DialKitValueUpdates<T extends DialConfig> = {
  [K in keyof T as K extends '_collapsed' ? never : K]?: T[K] extends ImagePickerConfig
    ? ImagePickerValue
    : T[K] extends CurvesConfig
    ? CurvesValue
    : T[K] extends FontPickerConfig
    ? FontPickerValue
    : T[K] extends PaletteConfig
    ? PaletteValue
    : T[K] extends ColorCollectionConfig
    ? ColorCollectionValue
    : T[K] extends RangeInputConfig
    ? RangeInputValue
    : T[K] extends GradientConfig
    ? GradientValue
    : T[K] extends VectorConfig
    ? VectorValue
    : T[K] extends [number, number, number, number?]
    ? number
    : T[K] extends SpringConfig | EasingConfig
      ? TransitionConfig
      : T[K] extends ActionConfig
        ? never
        : T[K] extends SelectConfig | ColorConfig | TextConfig
          ? string
          : T[K] extends DialConfig
            ? DialKitValueUpdates<T[K]>
            : T[K];
};

export type ShortcutMode = 'fine' | 'normal' | 'coarse';
export type ShortcutInteraction = 'scroll' | 'drag' | 'move' | 'scroll-only';

export type ShortcutConfig = {
  key?: string;
  modifier?: 'alt' | 'shift' | 'meta';
  mode?: ShortcutMode;
  interaction?: ShortcutInteraction;
};

export type ControlMeta = {
  type: 'slider' | 'toggle' | 'spring' | 'transition' | 'folder' | 'action' | 'select' | 'color' | 'text' | 'vector' | 'gradient' | 'rangeInput' | 'colorCollection' | 'palette' | 'fontPicker' | 'curves' | 'imagePicker';
  path: string;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  children?: ControlMeta[];
  defaultOpen?: boolean;
  options?: (string | { value: string; label: string })[];
  placeholder?: string;
  defaultValue?: DialValue;
  shortcut?: ShortcutConfig;
  /** Optional explainer text, surfaced as a "?" tooltip beside the label. */
  help?: string;
  /** For `action` controls: 'primary' renders accent-filled. */
  actionVariant?: 'primary' | 'secondary';
};

export type PanelConfig = {
  id: string;
  name: string;
  controls: ControlMeta[];
  values: Record<string, DialValue>;
  shortcuts: Record<string, ShortcutConfig>;
};

type Listener = () => void;
type ActionListener = (action: string) => void;

export type Preset = {
  id: string;
  name: string;
  values: Record<string, DialValue>;
};

export type DialKitPersistOptions = boolean | {
  key?: string;
  storage?: 'localStorage' | 'sessionStorage';
  presets?: boolean;
};

export type DialStorePanelOptions = {
  retainOnUnmount?: boolean;
  persist?: DialKitPersistOptions;
};

type PersistConfig = {
  key: string;
  storage: 'localStorage' | 'sessionStorage';
  presets: boolean;
};

type PersistedPanelState = {
  version: 1;
  values?: Record<string, DialValue>;
  baseValues?: Record<string, DialValue>;
  presets?: Preset[];
  activePresetId?: string | null;
};

// Stable empty object for unregistered panels (React 19 useSyncExternalStore requirement)
const EMPTY_VALUES: Record<string, DialValue> = Object.freeze({});

export function resolveDialValues<T extends DialConfig>(
  config: T,
  flatValues: Record<string, DialValue>
): ResolvedValues<T> {
  return resolveConfigValues(config, flatValues, '') as ResolvedValues<T>;
}

export function flattenDialValueUpdates<T extends DialConfig>(
  config: T,
  updates: DialKitValueUpdates<T>
): Record<string, DialValue> {
  const values: Record<string, DialValue> = {};
  if (typeof updates === 'object' && updates !== null) {
    flattenConfigUpdates(config, updates as Record<string, unknown>, '', values);
  }
  return values;
}

function resolveConfigValues(
  config: DialConfig,
  flatValues: Record<string, DialValue>,
  prefix: string
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, configValue] of Object.entries(config)) {
    if (key === '_collapsed' || key === '_help') continue;
    const path = prefix ? `${prefix}.${key}` : key;

    if (Array.isArray(configValue) && configValue.length <= 4 && typeof configValue[0] === 'number') {
      result[key] = flatValues[path] ?? configValue[0];
    } else if (typeof configValue === 'number' || typeof configValue === 'boolean' || typeof configValue === 'string') {
      result[key] = flatValues[path] ?? configValue;
    } else if (isSliderConfigValue(configValue) || isToggleConfigValue(configValue)) {
      result[key] = flatValues[path] ?? configValue.default;
    } else if (isSpringConfigValue(configValue) || isEasingConfigValue(configValue)) {
      result[key] = flatValues[path] ?? configValue;
    } else if (isActionConfigValue(configValue)) {
      result[key] = flatValues[path] ?? configValue;
    } else if (isSelectConfigValue(configValue)) {
      const defaultValue = configValue.default ?? getFirstOptionValue(configValue.options);
      result[key] = flatValues[path] ?? defaultValue;
    } else if (isColorConfigValue(configValue)) {
      result[key] = flatValues[path] ?? configValue.default ?? '#000000';
    } else if (isTextConfigValue(configValue)) {
      result[key] = flatValues[path] ?? configValue.default ?? '';
    } else if (isVectorConfigValue(configValue)) {
      result[key] = flatValues[path] ?? configValue.default ?? { x: 0, y: 0 };
    } else if (isImagePickerConfigValue(configValue)) {
      result[key] = flatValues[path] ?? configValue.default ?? DEFAULT_IMAGE_PICKER;
    } else if (isCurvesConfigValue(configValue)) {
      result[key] = flatValues[path] ?? configValue.default ?? DEFAULT_CURVES;
    } else if (isFontPickerConfigValue(configValue)) {
      result[key] = flatValues[path] ?? configValue.default ?? DEFAULT_FONT_PICKER;
    } else if (isPaletteConfigValue(configValue)) {
      result[key] = flatValues[path] ?? configValue.default ?? DEFAULT_PALETTE;
    } else if (isColorCollectionConfigValue(configValue)) {
      result[key] = flatValues[path] ?? configValue.default ?? DEFAULT_COLOR_COLLECTION;
    } else if (isRangeInputConfigValue(configValue)) {
      result[key] = flatValues[path] ?? configValue.default ?? DEFAULT_RANGE_INPUT;
    } else if (isGradientConfigValue(configValue)) {
      result[key] = flatValues[path] ?? configValue.default ?? DEFAULT_GRADIENT;
    } else if (typeof configValue === 'object' && configValue !== null) {
      result[key] = resolveConfigValues(configValue as DialConfig, flatValues, path);
    }
  }

  return result;
}

function flattenConfigUpdates(
  config: DialConfig,
  updates: Record<string, unknown>,
  prefix: string,
  values: Record<string, DialValue>
): void {
  for (const [key, configValue] of Object.entries(config)) {
    if (key === '_collapsed' || key === '_help' || !(key in updates)) continue;

    const nextValue = updates[key];
    if (nextValue === undefined) continue;

    const path = prefix ? `${prefix}.${key}` : key;

    if (isActionConfigValue(configValue)) {
      continue;
    }

    if (isLeafConfigValue(configValue)) {
      values[path] = nextValue as DialValue;
      continue;
    }

    if (
      typeof configValue === 'object' &&
      configValue !== null &&
      typeof nextValue === 'object' &&
      nextValue !== null &&
      !Array.isArray(nextValue)
    ) {
      flattenConfigUpdates(configValue as DialConfig, nextValue as Record<string, unknown>, path, values);
    }
  }
}

function isLeafConfigValue(value: unknown): boolean {
  return (
    (Array.isArray(value) && value.length <= 4 && typeof value[0] === 'number') ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'string' ||
    isSliderConfigValue(value) ||
    isToggleConfigValue(value) ||
    isSpringConfigValue(value) ||
    isEasingConfigValue(value) ||
    isActionConfigValue(value) ||
    isSelectConfigValue(value) ||
    isColorConfigValue(value) ||
    isVectorConfigValue(value) ||
    isImagePickerConfigValue(value) ||
    isCurvesConfigValue(value) ||
    isFontPickerConfigValue(value) ||
    isPaletteConfigValue(value) ||
    isColorCollectionConfigValue(value) ||
    isRangeInputConfigValue(value) ||
    isGradientConfigValue(value) ||
    isTextConfigValue(value)
  );
}

function hasType(value: unknown, type: string): boolean {
  return typeof value === 'object' && value !== null && 'type' in value && (value as { type: string }).type === type;
}

function isSliderConfigValue(value: unknown): value is SliderConfig {
  return hasType(value, 'slider');
}

function isToggleConfigValue(value: unknown): value is ToggleConfig {
  return hasType(value, 'toggle');
}

function isSpringConfigValue(value: unknown): value is SpringConfig {
  return hasType(value, 'spring');
}

function isEasingConfigValue(value: unknown): value is EasingConfig {
  return hasType(value, 'easing');
}

function isActionConfigValue(value: unknown): value is ActionConfig {
  return hasType(value, 'action');
}

function isSelectConfigValue(value: unknown): value is SelectConfig {
  return hasType(value, 'select') && 'options' in (value as object) && Array.isArray((value as SelectConfig).options);
}

function isColorConfigValue(value: unknown): value is ColorConfig {
  return hasType(value, 'color');
}

function isTextConfigValue(value: unknown): value is TextConfig {
  return hasType(value, 'text');
}

function isGradientConfigValue(value: unknown): value is GradientConfig {
  return hasType(value, 'gradient');
}

function isRangeInputConfigValue(value: unknown): value is RangeInputConfig {
  return hasType(value, 'rangeInput');
}

function isColorCollectionConfigValue(value: unknown): value is ColorCollectionConfig {
  return hasType(value, 'colorCollection');
}

function isPaletteConfigValue(value: unknown): value is PaletteConfig {
  return hasType(value, 'palette');
}

function isFontPickerConfigValue(value: unknown): value is FontPickerConfig {
  return hasType(value, 'fontPicker');
}

function isCurvesConfigValue(value: unknown): value is CurvesConfig {
  return hasType(value, 'curves');
}

function isImagePickerConfigValue(value: unknown): value is ImagePickerConfig {
  return hasType(value, 'imagePicker');
}

function isVectorConfigValue(value: unknown): value is VectorConfig {
  return hasType(value, 'vector');
}

function getFirstOptionValue(options: (string | { value: string; label: string })[]): string {
  const first = options[0];
  if (first === undefined) return '';
  return typeof first === 'string' ? first : first.value;
}

class DialStoreClass {
  private panels: Map<string, PanelConfig> = new Map();
  private listeners: Map<string, Set<Listener>> = new Map();
  private globalListeners: Set<Listener> = new Set();
  private snapshots: Map<string, Record<string, DialValue>> = new Map();
  private actionListeners: Map<string, Set<ActionListener>> = new Map();
  private presets: Map<string, Preset[]> = new Map();
  private activePreset: Map<string, string | null> = new Map();
  private baseValues: Map<string, Record<string, DialValue>> = new Map();
  private defaultValues: Map<string, Record<string, DialValue>> = new Map();
  private registrationCounts: Map<string, number> = new Map();
  private retainedPanels: Set<string> = new Set();
  private persistConfigs: Map<string, PersistConfig> = new Map();

  // Undo/redo — every value change snapshots the panel's prior values. Rapid edits
  // to the same path(s) (a slider drag, a scrub) coalesce into one history step.
  private undoStack: Array<{ panelId: string; values: Record<string, DialValue> }> = [];
  private redoStack: Array<{ panelId: string; values: Record<string, DialValue> }> = [];
  private coalesce: { panelId: string; key: string; time: number } | null = null;
  private static readonly HISTORY_LIMIT = 200;

  registerPanel(id: string, name: string, config: DialConfig, shortcuts?: Record<string, ShortcutConfig>, options: DialStorePanelOptions = {}): void {
    this.configurePanelRetention(id, options);
    this.registrationCounts.set(id, (this.registrationCounts.get(id) ?? 0) + 1);

    const controls = this.parseConfig(config, '', shortcuts);
    const controlsByPath = this.mapControlsByPath(controls);
    const defaultValues = this.flattenValues(config, '');
    this.normalizeSliderDefaults(defaultValues, controlsByPath);

    // Set initial transition modes based on config types
    this.initTransitionModes(config, '', defaultValues);

    const persisted = this.loadPersistedPanel(id);
    const previousValues = this.panels.get(id)?.values ?? this.snapshots.get(id) ?? persisted?.values ?? {};
    const values = this.reconcileValues(defaultValues, previousValues, controlsByPath);

    const previousBaseValues = this.baseValues.get(id) ?? persisted?.baseValues ?? persisted?.values ?? {};
    const baseValues = this.reconcileValues(defaultValues, previousBaseValues, controlsByPath);

    this.panels.set(id, { id, name, controls, values, shortcuts: shortcuts ?? {} });
    this.snapshots.set(id, { ...values });
    this.baseValues.set(id, baseValues);
    this.defaultValues.set(id, { ...defaultValues });

    const existingPresets = this.presets.get(id) ?? persisted?.presets;
    if (existingPresets) {
      this.presets.set(id, this.reconcilePresets(existingPresets, defaultValues, controlsByPath));
    }
    if (!this.activePreset.has(id) && persisted?.activePresetId !== undefined) {
      this.activePreset.set(id, persisted.activePresetId);
    }

    this.persistPanel(id);
    this.notify(id);
    this.notifyGlobal();
  }

  updatePanel(id: string, name: string, config: DialConfig, shortcuts?: Record<string, ShortcutConfig>, options: DialStorePanelOptions = {}): void {
    this.configurePanelRetention(id, options);
    const existing = this.panels.get(id);
    if (!existing) {
      this.registerPanel(id, name, config, shortcuts, options);
      return;
    }

    const controls = this.parseConfig(config, '', shortcuts);
    const controlsByPath = this.mapControlsByPath(controls);
    const defaultValues = this.flattenValues(config, '');
    this.normalizeSliderDefaults(defaultValues, controlsByPath);
    this.initTransitionModes(config, '', defaultValues);
    const nextValues = this.reconcileValues(defaultValues, existing.values, controlsByPath);

    const nextPanel: PanelConfig = { id, name, controls, values: nextValues, shortcuts: shortcuts ?? existing.shortcuts };
    this.panels.set(id, nextPanel);
    this.snapshots.set(id, { ...nextValues });

    const previousBaseValues = this.baseValues.get(id) ?? {};
    const nextBaseValues = this.reconcileValues(defaultValues, previousBaseValues, controlsByPath);

    for (const [path, value] of Object.entries(nextValues)) {
      if (path.endsWith('.__mode')) {
        nextBaseValues[path] = value;
      }
    }

    this.baseValues.set(id, nextBaseValues);
    this.defaultValues.set(id, { ...defaultValues });
    this.presets.set(id, this.reconcilePresets(this.presets.get(id) ?? [], defaultValues, controlsByPath));

    this.persistPanel(id);
    this.notify(id);
    this.notifyGlobal();
  }

  unregisterPanel(id: string): void {
    const nextCount = (this.registrationCounts.get(id) ?? 1) - 1;
    if (nextCount > 0) {
      this.registrationCounts.set(id, nextCount);
      return;
    }

    this.registrationCounts.delete(id);
    this.panels.delete(id);
    this.listeners.delete(id);
    this.actionListeners.delete(id);

    if (!this.retainedPanels.has(id)) {
      this.snapshots.delete(id);
      this.baseValues.delete(id);
      this.defaultValues.delete(id);
      this.presets.delete(id);
      this.activePreset.delete(id);
      this.persistConfigs.delete(id);
    }

    this.notifyGlobal();
  }

  updateValue(panelId: string, path: string, value: DialValue): void {
    this.updateValues(panelId, { [path]: value });
  }

  updateValues(panelId: string, updates: Record<string, DialValue>): void {
    const panel = this.panels.get(panelId);
    if (!panel) return;

    // Snapshot the pre-change values before we mutate, for the undo stack.
    const before = { ...panel.values };

    const validUpdates: Record<string, DialValue> = {};

    for (const [path, value] of Object.entries(updates)) {
      if (!Object.prototype.hasOwnProperty.call(panel.values, path)) {
        continue;
      }

      const control = this.findControlByPath(panel.controls, path);
      if (control?.type === 'action') {
        continue;
      }

      panel.values[path] = value;
      validUpdates[path] = value;
    }

    if (Object.keys(validUpdates).length === 0) {
      return;
    }

    this.recordHistory(panelId, before, Object.keys(validUpdates));

    // Auto-save to active preset or base values
    const activeId = this.activePreset.get(panelId);
    if (activeId) {
      const presets = this.presets.get(panelId) ?? [];
      const preset = presets.find(p => p.id === activeId);
      if (preset) {
        for (const [path, value] of Object.entries(validUpdates)) {
          preset.values[path] = value;
        }
      }
    } else {
      const base = this.baseValues.get(panelId);
      if (base) {
        for (const [path, value] of Object.entries(validUpdates)) {
          base[path] = value;
        }
      }
    }

    // Create a new snapshot reference so useSyncExternalStore detects the change
    this.snapshots.set(panelId, { ...panel.values });
    this.persistPanel(panelId);
    this.notify(panelId);
  }

  /**
   * Push a pre-change snapshot, coalescing rapid consecutive edits to the same
   * path(s) on the same panel (a drag/scrub) into one step. Recording clears redo.
   */
  private recordHistory(panelId: string, before: Record<string, DialValue>, paths: string[]): void {
    const key = paths.slice().sort().join(',');
    const now = Date.now();
    const coalescing =
      this.coalesce !== null &&
      this.coalesce.panelId === panelId &&
      this.coalesce.key === key &&
      now - this.coalesce.time < 500;
    if (!coalescing) this.pushUndo(panelId, before);
    this.coalesce = { panelId, key, time: now };
  }

  private pushUndo(panelId: string, values: Record<string, DialValue>): void {
    this.undoStack.push({ panelId, values });
    if (this.undoStack.length > DialStoreClass.HISTORY_LIMIT) this.undoStack.shift();
    this.redoStack = [];
  }

  /** Restore a full values snapshot to a panel (bypasses history capture). */
  private applyHistoryValues(panelId: string, values: Record<string, DialValue>): void {
    const panel = this.panels.get(panelId);
    if (!panel) return;
    panel.values = { ...values };
    const activeId = this.activePreset.get(panelId);
    if (activeId) {
      const preset = (this.presets.get(panelId) ?? []).find((p) => p.id === activeId);
      if (preset) preset.values = { ...values };
    } else {
      this.baseValues.set(panelId, { ...values });
    }
    this.snapshots.set(panelId, { ...panel.values });
    this.persistPanel(panelId);
    this.notify(panelId);
  }

  /** Undo the most recent adjustment (across any panel). */
  undo(): void {
    const entry = this.undoStack.pop();
    if (!entry) return;
    const panel = this.panels.get(entry.panelId);
    if (!panel) return;
    this.redoStack.push({ panelId: entry.panelId, values: { ...panel.values } });
    this.coalesce = null;
    this.applyHistoryValues(entry.panelId, entry.values);
  }

  /** Redo the most recently undone adjustment. */
  redo(): void {
    const entry = this.redoStack.pop();
    if (!entry) return;
    const panel = this.panels.get(entry.panelId);
    if (!panel) return;
    this.undoStack.push({ panelId: entry.panelId, values: { ...panel.values } });
    this.coalesce = null;
    this.applyHistoryValues(entry.panelId, entry.values);
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  resetValues(panelId: string): void {
    const panel = this.panels.get(panelId);
    const defaults = this.defaultValues.get(panelId);
    if (!panel || !defaults) return;

    this.pushUndo(panelId, { ...panel.values });
    this.coalesce = null;

    panel.values = { ...defaults };
    this.snapshots.set(panelId, { ...panel.values });
    this.baseValues.set(panelId, { ...defaults });
    this.activePreset.set(panelId, null);
    this.persistPanel(panelId);
    this.notify(panelId);
  }

  /** The configured default for a single control path (undefined if none). */
  getDefaultValue(panelId: string, path: string): DialValue | undefined {
    return this.defaultValues.get(panelId)?.[path];
  }

  /** True when the current value at `path` still equals its configured default. */
  isDefaultValue(panelId: string, path: string): boolean {
    const panel = this.panels.get(panelId);
    const defaults = this.defaultValues.get(panelId);
    if (!panel || !defaults || !(path in defaults)) return true;
    return valuesEqual(panel.values[path], defaults[path]);
  }

  /** Reset one control path (and its transition `.__mode` sibling) to default. */
  resetValue(panelId: string, path: string): void {
    const defaults = this.defaultValues.get(panelId);
    if (!defaults) return;

    if (Object.prototype.hasOwnProperty.call(defaults, path)) {
      this.updateValue(panelId, path, defaults[path]);
    }

    const modeKey = `${path}.__mode`;
    if (Object.prototype.hasOwnProperty.call(defaults, modeKey)) {
      this.updateTransitionMode(panelId, path, defaults[modeKey] as 'easing' | 'simple' | 'advanced');
    }
  }

  updateSpringMode(panelId: string, path: string, mode: 'simple' | 'advanced'): void {
    this.updateTransitionMode(panelId, path, mode);
  }

  getSpringMode(panelId: string, path: string): 'simple' | 'advanced' {
    const mode = this.getTransitionMode(panelId, path);
    if (mode === 'easing') return 'simple';
    return mode;
  }

  updateTransitionMode(panelId: string, path: string, mode: 'easing' | 'simple' | 'advanced'): void {
    const panel = this.panels.get(panelId);
    if (!panel) return;

    panel.values[`${path}.__mode`] = mode;
    this.snapshots.set(panelId, { ...panel.values });
    this.persistPanel(panelId);
    this.notify(panelId);
  }

  getTransitionMode(panelId: string, path: string): 'easing' | 'simple' | 'advanced' {
    const panel = this.panels.get(panelId);
    if (!panel) return 'simple';
    return (panel.values[`${path}.__mode`] as 'easing' | 'simple' | 'advanced') || 'simple';
  }

  getValue(panelId: string, path: string): DialValue | undefined {
    const panel = this.panels.get(panelId);
    return panel?.values[path];
  }

  getValues(panelId: string): Record<string, DialValue> {
    // Return the snapshot for useSyncExternalStore compatibility
    // Use stable EMPTY_VALUES to avoid infinite loop in React 19
    return this.snapshots.get(panelId) ?? EMPTY_VALUES;
  }

  getPanels(): PanelConfig[] {
    return Array.from(this.panels.values());
  }

  getPanel(id: string): PanelConfig | undefined {
    return this.panels.get(id);
  }

  subscribe(panelId: string, listener: Listener): () => void {
    if (!this.listeners.has(panelId)) {
      this.listeners.set(panelId, new Set());
    }
    this.listeners.get(panelId)!.add(listener);

    return () => {
      this.listeners.get(panelId)?.delete(listener);
    };
  }

  subscribeGlobal(listener: Listener): () => void {
    this.globalListeners.add(listener);
    return () => this.globalListeners.delete(listener);
  }

  subscribeActions(panelId: string, listener: ActionListener): () => void {
    if (!this.actionListeners.has(panelId)) {
      this.actionListeners.set(panelId, new Set());
    }
    this.actionListeners.get(panelId)!.add(listener);

    return () => {
      this.actionListeners.get(panelId)?.delete(listener);
    };
  }

  triggerAction(panelId: string, path: string): void {
    this.actionListeners.get(panelId)?.forEach(fn => fn(path));
  }

  savePreset(panelId: string, name: string): string {
    const panel = this.panels.get(panelId);
    if (!panel) throw new Error(`Panel ${panelId} not found`);

    const id = `preset-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const preset: Preset = {
      id,
      name,
      values: { ...panel.values },
    };

    const existing = this.presets.get(panelId) ?? [];
    this.presets.set(panelId, [...existing, preset]);
    this.activePreset.set(panelId, id);

    // Force re-render by creating new snapshot reference
    this.snapshots.set(panelId, { ...panel.values });
    this.persistPanel(panelId);
    this.notify(panelId);

    return id;
  }

  loadPreset(panelId: string, presetId: string): void {
    const panel = this.panels.get(panelId);
    if (!panel) return;

    const presets = this.presets.get(panelId) ?? [];
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;

    // Apply preset values
    panel.values = { ...preset.values };
    this.snapshots.set(panelId, { ...panel.values });
    this.activePreset.set(panelId, presetId);
    this.persistPanel(panelId);
    this.notify(panelId);
  }

  deletePreset(panelId: string, presetId: string): void {
    const presets = this.presets.get(panelId) ?? [];
    this.presets.set(panelId, presets.filter(p => p.id !== presetId));

    // Clear active if deleted
    if (this.activePreset.get(panelId) === presetId) {
      this.activePreset.set(panelId, null);
    }

    // Force re-render by creating new snapshot reference
    const panel = this.panels.get(panelId);
    if (panel) {
      this.snapshots.set(panelId, { ...panel.values });
    }
    this.persistPanel(panelId);
    this.notify(panelId);
  }

  getPresets(panelId: string): Preset[] {
    return this.presets.get(panelId) ?? [];
  }

  getActivePresetId(panelId: string): string | null {
    return this.activePreset.get(panelId) ?? null;
  }

  clearActivePreset(panelId: string): void {
    const panel = this.panels.get(panelId);
    const base = this.baseValues.get(panelId);
    if (panel && base) {
      panel.values = { ...base };
      this.snapshots.set(panelId, { ...panel.values });
    }
    this.activePreset.set(panelId, null);
    this.persistPanel(panelId);
    this.notify(panelId);
  }

  resolveShortcutTarget(key: string, modifier?: 'alt' | 'shift' | 'meta'): {
    panelId: string;
    path: string;
    control: ControlMeta;
  } | null {
    for (const panel of this.panels.values()) {
      for (const [path, shortcut] of Object.entries(panel.shortcuts)) {
        if (!shortcut.key) continue; // skip keyless shortcuts
        if (shortcut.key.toLowerCase() !== key.toLowerCase()) continue;
        const scMod = shortcut.modifier ?? undefined;
        if (scMod !== modifier) continue;

        const control = this.findControlByPath(panel.controls, path);
        if (control) {
          return { panelId: panel.id, path, control };
        }
      }
    }
    return null;
  }

  resolveScrollOnlyTargets(): Array<{
    panelId: string;
    path: string;
    control: ControlMeta;
    shortcut: ShortcutConfig;
  }> {
    const results: Array<{ panelId: string; path: string; control: ControlMeta; shortcut: ShortcutConfig }> = [];
    for (const panel of this.panels.values()) {
      for (const [path, shortcut] of Object.entries(panel.shortcuts)) {
        if ((shortcut.interaction ?? 'scroll') !== 'scroll-only') continue;
        const control = this.findControlByPath(panel.controls, path);
        if (control) {
          results.push({ panelId: panel.id, path, control, shortcut });
        }
      }
    }
    return results;
  }

  private configurePanelRetention(id: string, options: DialStorePanelOptions): void {
    if (options.retainOnUnmount) {
      this.retainedPanels.add(id);
    }

    const persistConfig = this.normalizePersistConfig(id, options.persist);
    if (persistConfig) {
      this.persistConfigs.set(id, persistConfig);
      this.retainedPanels.add(id);
    }
  }

  private reconcileValues(
    defaultValues: Record<string, DialValue>,
    previousValues: Record<string, DialValue>,
    controlsByPath: Map<string, ControlMeta>
  ): Record<string, DialValue> {
    const nextValues: Record<string, DialValue> = {};

    for (const [path, defaultValue] of Object.entries(defaultValues)) {
      if (path.endsWith('.__mode')) {
        const transitionPath = path.slice(0, -'.__mode'.length);
        const transitionControl = controlsByPath.get(transitionPath);
        nextValues[path] = transitionControl?.type === 'transition' && previousValues[path] !== undefined
          ? previousValues[path]
          : defaultValue;
        continue;
      }

      nextValues[path] = this.normalizePreservedValue(
        previousValues[path],
        defaultValue,
        controlsByPath.get(path)
      );
    }

    return nextValues;
  }

  private reconcilePresets(
    presets: Preset[],
    defaultValues: Record<string, DialValue>,
    controlsByPath: Map<string, ControlMeta>
  ): Preset[] {
    return presets.map((preset) => ({
      ...preset,
      values: this.reconcileValues(defaultValues, preset.values, controlsByPath),
    }));
  }

  private normalizePersistConfig(id: string, persist: DialKitPersistOptions | undefined): PersistConfig | null {
    if (!persist) return null;
    const options = typeof persist === 'object' ? persist : {};
    return {
      key: options.key ?? `dialkit:${id}`,
      storage: options.storage ?? 'localStorage',
      presets: options.presets ?? true,
    };
  }

  private loadPersistedPanel(id: string): PersistedPanelState | null {
    const config = this.persistConfigs.get(id);
    if (!config) return null;

    const storage = this.getStorage(config.storage);
    if (!storage) return null;

    try {
      const raw = storage.getItem(config.key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as PersistedPanelState;
      if (parsed?.version !== 1 || typeof parsed !== 'object') return null;
      return parsed;
    } catch {
      return null;
    }
  }

  private persistPanel(id: string): void {
    const config = this.persistConfigs.get(id);
    if (!config) return;

    const storage = this.getStorage(config.storage);
    if (!storage) return;

    const values = this.snapshots.get(id) ?? this.panels.get(id)?.values;
    if (!values) return;

    const state: PersistedPanelState = {
      version: 1,
      values,
      baseValues: this.baseValues.get(id) ?? values,
      activePresetId: this.activePreset.get(id) ?? null,
    };

    if (config.presets) {
      state.presets = this.presets.get(id) ?? [];
    }

    try {
      storage.setItem(config.key, JSON.stringify(state));
    } catch {
      // Ignore storage quota/security errors; DialKit should still work in-memory.
    }
  }

  private getStorage(kind: 'localStorage' | 'sessionStorage'): Storage | null {
    if (typeof globalThis === 'undefined' || !('window' in globalThis)) {
      return null;
    }

    try {
      return kind === 'sessionStorage'
        ? globalThis.window?.sessionStorage ?? null
        : globalThis.window?.localStorage ?? null;
    } catch {
      return null;
    }
  }

  private findControlByPath(controls: ControlMeta[], path: string): ControlMeta | null {
    for (const control of controls) {
      if (control.path === path) return control;
      if (control.type === 'folder' && control.children) {
        const found = this.findControlByPath(control.children, path);
        if (found) return found;
      }
    }
    return null;
  }

  private notify(panelId: string): void {
    this.listeners.get(panelId)?.forEach(fn => fn());
  }

  private notifyGlobal(): void {
    this.globalListeners.forEach(fn => fn());
  }

  private initTransitionModes(config: DialConfig, prefix: string, values: Record<string, DialValue>): void {
    for (const [key, value] of Object.entries(config)) {
      if (key === '_collapsed' || key === '_help') continue;
      const path = prefix ? `${prefix}.${key}` : key;

      if (this.isEasingConfig(value)) {
        values[`${path}.__mode`] = 'easing';
      } else if (this.isSpringConfig(value)) {
        // Detect physics mode from config
        const hasPhysics = value.stiffness !== undefined || value.damping !== undefined || value.mass !== undefined;
        const hasTime = value.visualDuration !== undefined || value.bounce !== undefined;
        values[`${path}.__mode`] = hasPhysics && !hasTime ? 'advanced' : 'simple';
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value) && !this.isSliderConfig(value) && !this.isToggleConfig(value) && !this.isActionConfig(value) && !this.isSelectConfig(value) && !this.isColorConfig(value) && !this.isTextConfig(value) && !this.isVectorConfig(value) && !this.isImagePickerConfig(value) && !this.isCurvesConfig(value) && !this.isFontPickerConfig(value) && !this.isPaletteConfig(value) && !this.isColorCollectionConfig(value) && !this.isRangeInputConfig(value) && !this.isGradientConfig(value)) {
        this.initTransitionModes(value as DialConfig, path, values);
      }
    }
  }

  private parseConfig(config: DialConfig, prefix: string, shortcuts?: Record<string, ShortcutConfig>): ControlMeta[] {
    const controls: ControlMeta[] = [];

    for (const [key, value] of Object.entries(config)) {
      if (key === '_collapsed' || key === '_help') continue;
      const path = prefix ? `${prefix}.${key}` : key;
      const label = this.formatLabel(key);
      const shortcut = shortcuts?.[path];
      const before = controls.length;

      if (Array.isArray(value) && value.length <= 4 && typeof value[0] === 'number') {
        // Range tuple: [default, min, max]. (A bare array in config is always a
        // number tuple at runtime; cast to disambiguate from other array-valued
        // DialValue members like a color collection.)
        const tuple = value as [number, number, number, number?];
        controls.push({
          type: 'slider',
          path,
          label,
          min: tuple[1],
          max: tuple[2],
          step: tuple[3] ?? this.inferStep(tuple[1], tuple[2]),
          shortcut,
        });
      } else if (typeof value === 'number') {
        // Single number - auto-infer range
        const { min, max, step } = this.inferRange(value);
        controls.push({ type: 'slider', path, label, min, max, step, shortcut });
      } else if (typeof value === 'boolean') {
        controls.push({ type: 'toggle', path, label, shortcut });
      } else if (this.isSliderConfig(value)) {
        const min = value.min ?? this.inferRange(value.default).min;
        const max = value.max ?? this.inferRange(value.default).max;
        controls.push({ type: 'slider', path, label, min, max, step: value.step ?? this.inferStep(min, max), shortcut });
      } else if (this.isToggleConfig(value)) {
        controls.push({ type: 'toggle', path, label, shortcut });
      } else if (this.isSpringConfig(value) || this.isEasingConfig(value)) {
        controls.push({ type: 'transition', path, label });
      } else if (this.isActionConfig(value)) {
        controls.push({ type: 'action', path, label: (value as ActionConfig).label || label, actionVariant: (value as ActionConfig).variant });
      } else if (this.isSelectConfig(value)) {
        controls.push({ type: 'select', path, label, options: value.options });
      } else if (this.isColorConfig(value)) {
        controls.push({ type: 'color', path, label });
      } else if (this.isTextConfig(value)) {
        controls.push({ type: 'text', path, label, placeholder: value.placeholder });
      } else if (this.isVectorConfig(value)) {
        controls.push({ type: 'vector', path, label, defaultValue: value.default ?? { x: 0, y: 0 } });
      } else if (this.isImagePickerConfig(value)) {
        controls.push({ type: 'imagePicker', path, label, defaultValue: value.default ?? DEFAULT_IMAGE_PICKER });
      } else if (this.isCurvesConfig(value)) {
        controls.push({ type: 'curves', path, label, defaultValue: value.default ?? DEFAULT_CURVES });
      } else if (this.isFontPickerConfig(value)) {
        controls.push({ type: 'fontPicker', path, label, defaultValue: value.default ?? DEFAULT_FONT_PICKER });
      } else if (this.isPaletteConfig(value)) {
        controls.push({ type: 'palette', path, label, defaultValue: value.default ?? DEFAULT_PALETTE });
      } else if (this.isColorCollectionConfig(value)) {
        controls.push({ type: 'colorCollection', path, label, defaultValue: value.default ?? DEFAULT_COLOR_COLLECTION });
      } else if (this.isRangeInputConfig(value)) {
        controls.push({ type: 'rangeInput', path, label, defaultValue: value.default ?? DEFAULT_RANGE_INPUT });
      } else if (this.isGradientConfig(value)) {
        controls.push({ type: 'gradient', path, label, defaultValue: value.default ?? DEFAULT_GRADIENT });
      } else if (typeof value === 'string') {
        // Auto-detect: hex color vs text
        if (this.isHexColor(value)) {
          controls.push({ type: 'color', path, label });
        } else {
          controls.push({ type: 'text', path, label });
        }
      } else if (typeof value === 'object' && value !== null) {
        // Nested object becomes a folder
        const folderConfig = value as DialConfig;
        const defaultOpen = '_collapsed' in folderConfig ? !(folderConfig._collapsed as boolean) : true;
        controls.push({
          type: 'folder',
          path,
          label,
          defaultOpen,
          children: this.parseConfig(folderConfig, path, shortcuts),
        });
      }

      // Attach optional help text to whatever control this key produced (leaf
      // controls use `help`; folders use `_help` to avoid a child-key collision).
      if (controls.length > before) {
        const help = this.extractHelp(value);
        if (help) controls[controls.length - 1].help = help;
      }
    }

    return controls;
  }

  private extractHelp(value: unknown): string | undefined {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const v = value as { help?: unknown; _help?: unknown };
      if (typeof v.help === 'string') return v.help;
      if (typeof v._help === 'string') return v._help;
    }
    return undefined;
  }

  private flattenValues(config: DialConfig, prefix: string): Record<string, DialValue> {
    const values: Record<string, DialValue> = {};

    for (const [key, value] of Object.entries(config)) {
      if (key === '_collapsed' || key === '_help') continue;
      const path = prefix ? `${prefix}.${key}` : key;

      if (Array.isArray(value) && value.length <= 4 && typeof value[0] === 'number') {
        values[path] = value[0]; // Default value
      } else if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') {
        values[path] = value;
      } else if (this.isSliderConfig(value) || this.isToggleConfig(value)) {
        values[path] = value.default;
      } else if (this.isSpringConfig(value) || this.isEasingConfig(value)) {
        values[path] = value;
      } else if (this.isActionConfig(value)) {
        // Actions don't need stored values - they're just triggers
        values[path] = value;
      } else if (this.isSelectConfig(value)) {
        // Use default or first option's value
        const firstOption = value.options[0];
        const firstValue = typeof firstOption === 'string' ? firstOption : firstOption.value;
        values[path] = value.default ?? firstValue;
      } else if (this.isColorConfig(value)) {
        values[path] = value.default ?? '#000000';
      } else if (this.isTextConfig(value)) {
        values[path] = value.default ?? '';
      } else if (this.isVectorConfig(value)) {
        values[path] = value.default ?? { x: 0, y: 0 };
      } else if (this.isImagePickerConfig(value)) {
        values[path] = value.default ?? DEFAULT_IMAGE_PICKER;
      } else if (this.isCurvesConfig(value)) {
        values[path] = value.default ?? DEFAULT_CURVES;
      } else if (this.isFontPickerConfig(value)) {
        values[path] = value.default ?? DEFAULT_FONT_PICKER;
      } else if (this.isPaletteConfig(value)) {
        values[path] = value.default ?? DEFAULT_PALETTE;
      } else if (this.isColorCollectionConfig(value)) {
        values[path] = value.default ?? DEFAULT_COLOR_COLLECTION;
      } else if (this.isRangeInputConfig(value)) {
        values[path] = value.default ?? DEFAULT_RANGE_INPUT;
      } else if (this.isGradientConfig(value)) {
        values[path] = value.default ?? DEFAULT_GRADIENT;
      } else if (typeof value === 'object' && value !== null) {
        Object.assign(values, this.flattenValues(value as DialConfig, path));
      }
    }

    return values;
  }

  private isSpringConfig(value: unknown): value is SpringConfig {
    return (
      typeof value === 'object' &&
      value !== null &&
      'type' in value &&
      (value as SpringConfig).type === 'spring'
    );
  }

  private isEasingConfig(value: unknown): value is EasingConfig {
    return (
      typeof value === 'object' &&
      value !== null &&
      'type' in value &&
      (value as EasingConfig).type === 'easing'
    );
  }

  private isActionConfig(value: unknown): value is ActionConfig {
    return (
      typeof value === 'object' &&
      value !== null &&
      'type' in value &&
      (value as ActionConfig).type === 'action'
    );
  }

  private isSliderConfig(value: unknown): value is SliderConfig {
    return typeof value === 'object' && value !== null && (value as SliderConfig).type === 'slider';
  }

  private isToggleConfig(value: unknown): value is ToggleConfig {
    return typeof value === 'object' && value !== null && (value as ToggleConfig).type === 'toggle';
  }

  private isSelectConfig(value: unknown): value is SelectConfig {
    return (
      typeof value === 'object' &&
      value !== null &&
      'type' in value &&
      (value as SelectConfig).type === 'select' &&
      'options' in value &&
      Array.isArray((value as SelectConfig).options)
    );
  }

  private isColorConfig(value: unknown): value is ColorConfig {
    return (
      typeof value === 'object' &&
      value !== null &&
      'type' in value &&
      (value as ColorConfig).type === 'color'
    );
  }

  private isTextConfig(value: unknown): value is TextConfig {
    return (
      typeof value === 'object' &&
      value !== null &&
      'type' in value &&
      (value as TextConfig).type === 'text'
    );
  }

  private isGradientConfig(value: unknown): value is GradientConfig {
    return (
      typeof value === 'object' &&
      value !== null &&
      'type' in value &&
      (value as GradientConfig).type === 'gradient'
    );
  }

  private isRangeInputConfig(value: unknown): value is RangeInputConfig {
    return (
      typeof value === 'object' &&
      value !== null &&
      'type' in value &&
      (value as RangeInputConfig).type === 'rangeInput'
    );
  }

  private isColorCollectionConfig(value: unknown): value is ColorCollectionConfig {
    return (
      typeof value === 'object' &&
      value !== null &&
      'type' in value &&
      (value as ColorCollectionConfig).type === 'colorCollection'
    );
  }

  private isPaletteConfig(value: unknown): value is PaletteConfig {
    return (
      typeof value === 'object' &&
      value !== null &&
      'type' in value &&
      (value as PaletteConfig).type === 'palette'
    );
  }

  private isFontPickerConfig(value: unknown): value is FontPickerConfig {
    return (
      typeof value === 'object' &&
      value !== null &&
      'type' in value &&
      (value as FontPickerConfig).type === 'fontPicker'
    );
  }

  private isCurvesConfig(value: unknown): value is CurvesConfig {
    return (
      typeof value === 'object' &&
      value !== null &&
      'type' in value &&
      (value as CurvesConfig).type === 'curves'
    );
  }

  private isImagePickerConfig(value: unknown): value is ImagePickerConfig {
    return (
      typeof value === 'object' &&
      value !== null &&
      'type' in value &&
      (value as ImagePickerConfig).type === 'imagePicker'
    );
  }

  private isVectorConfig(value: unknown): value is VectorConfig {
    return (
      typeof value === 'object' &&
      value !== null &&
      'type' in value &&
      (value as VectorConfig).type === 'vector'
    );
  }

  private isHexColor(value: string): boolean {
    return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(value);
  }

  private formatLabel(key: string): string {
    // Convert camelCase to Title Case
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  private inferRange(value: number): { min: number; max: number; step: number } {
    // Infer reasonable range based on value
    if (value >= 0 && value <= 1) {
      return { min: 0, max: 1, step: 0.01 };
    } else if (value >= 0 && value <= 10) {
      return { min: 0, max: value * 3 || 10, step: 0.1 };
    } else if (value >= 0 && value <= 100) {
      return { min: 0, max: value * 3 || 100, step: 1 };
    } else if (value >= 0) {
      return { min: 0, max: value * 3 || 1000, step: 10 };
    } else {
      return { min: value * 3, max: -value * 3, step: 1 };
    }
  }

  private inferStep(min: number, max: number): number {
    const range = max - min;
    if (range <= 1) return 0.01;
    if (range <= 10) return 0.1;
    if (range <= 100) return 1;
    return 10;
  }

  private normalizePreservedValue(
    existingValue: DialValue | undefined,
    defaultValue: DialValue,
    control: ControlMeta | undefined
  ): DialValue {
    if (existingValue === undefined || !control) {
      return defaultValue;
    }

    switch (control.type) {
      case 'slider': {
        if (typeof existingValue !== 'number' || typeof defaultValue !== 'number') {
          return defaultValue;
        }

        const min = control.min ?? Number.NEGATIVE_INFINITY;
        const max = control.max ?? Number.POSITIVE_INFINITY;
        const clamped = Math.min(max, Math.max(min, existingValue));

        if (typeof control.step !== 'number' || control.step <= 0) {
          return clamped;
        }

        return this.roundToStep(clamped, min, max, control.step);
      }
      case 'toggle':
        return typeof existingValue === 'boolean' ? existingValue : defaultValue;
      case 'select': {
        if (typeof existingValue !== 'string') {
          return defaultValue;
        }

        const options = control.options ?? [];
        const validValues = new Set(options.map((option) => (typeof option === 'string' ? option : option.value)));
        return validValues.has(existingValue) ? existingValue : defaultValue;
      }
      case 'color':
      case 'text':
        return typeof existingValue === 'string' ? existingValue : defaultValue;
      case 'gradient': {
        const g = existingValue as GradientValue;
        return typeof g === 'object' && g !== null && Array.isArray(g.stops) ? existingValue : defaultValue;
      }
      case 'rangeInput': {
        const rv = existingValue as RangeInputValue;
        return typeof rv === 'object' && rv !== null && typeof rv.start === 'number' && typeof rv.end === 'number'
          ? existingValue
          : defaultValue;
      }
      case 'colorCollection': {
        return Array.isArray(existingValue) ? existingValue : defaultValue;
      }
      case 'palette': {
        const pv = existingValue as PaletteValue;
        return typeof pv === 'object' && pv !== null && typeof pv.family === 'number' && typeof pv.shade === 'number'
          ? existingValue
          : defaultValue;
      }
      case 'fontPicker': {
        const fv = existingValue as FontPickerValue;
        return typeof fv === 'object' && fv !== null && typeof fv.fontId === 'string'
          ? existingValue
          : defaultValue;
      }
      case 'curves': {
        const cv = existingValue as CurvesValue;
        return typeof cv === 'object' && cv !== null && Array.isArray(cv.rgb)
          ? existingValue
          : defaultValue;
      }
      case 'imagePicker': {
        return Array.isArray(existingValue) ? existingValue : defaultValue;
      }
      case 'vector': {
        const v = existingValue as VectorValue;
        return typeof v === 'object' && v !== null && typeof v.x === 'number' && typeof v.y === 'number'
          ? existingValue
          : defaultValue;
      }
      case 'transition':
        if (this.isSpringConfig(defaultValue)) {
          return this.isSpringConfig(existingValue) ? existingValue : defaultValue;
        }
        if (this.isEasingConfig(defaultValue)) {
          return this.isEasingConfig(existingValue) ? existingValue : defaultValue;
        }
        return defaultValue;
      case 'action':
        return defaultValue;
      default:
        return defaultValue;
    }
  }

  // Snap slider defaults onto their own step grid. A default that isn't reachable
  // (e.g. 64 on a step-10 grid → 62) would otherwise read as permanently "deviated"
  // — the live value snaps but the stored default doesn't — leaving a phantom reset.
  private normalizeSliderDefaults(
    defaultValues: Record<string, DialValue>,
    controlsByPath: Map<string, ControlMeta>
  ): void {
    for (const [path, control] of controlsByPath) {
      if (control.type !== 'slider') continue;
      const value = defaultValues[path];
      const { min, max, step } = control;
      if (typeof value !== 'number' || typeof step !== 'number' || step <= 0) continue;
      if (!Number.isFinite(min ?? NaN) || !Number.isFinite(max ?? NaN)) continue;
      defaultValues[path] = this.roundToStep(value, min as number, max as number, step);
    }
  }

  private roundToStep(value: number, min: number, max: number, step: number): number {
    const snapped = min + Math.round((value - min) / step) * step;
    const clamped = Math.min(max, Math.max(min, snapped));
    const precision = this.stepPrecision(step);
    return Number(clamped.toFixed(precision));
  }

  private stepPrecision(step: number): number {
    const text = String(step);
    const decimalIndex = text.indexOf('.');
    return decimalIndex === -1 ? 0 : text.length - decimalIndex - 1;
  }

  private mapControlsByPath(controls: ControlMeta[]): Map<string, ControlMeta> {
    const map = new Map<string, ControlMeta>();

    const visit = (nodes: ControlMeta[]) => {
      for (const node of nodes) {
        if (node.type === 'folder' && node.children) {
          visit(node.children);
          continue;
        }

        map.set(node.path, node);
      }
    };

    visit(controls);
    return map;
  }

}

// Singleton instance
export const DialStore = new DialStoreClass();
