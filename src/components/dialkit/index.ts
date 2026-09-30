// Main hook
export { useDialKit, useDialKitController } from './hooks/useDialKit';
export type { DialKitController, UseDialOptions } from './hooks/useDialKit';

// Root component (user mounts once)
export { DialRoot } from './components/DialRoot';
export type { DialPosition, DialMode, DialTheme } from './components/DialRoot';

// Individual components (for advanced usage)
export { Slider } from './components/Slider';
export { Toggle } from './components/Toggle';
export { Folder } from './components/Folder';
export { ButtonGroup } from './components/ButtonGroup';
export { SpringControl } from './components/SpringControl';
export { SpringVisualization } from './components/SpringVisualization';
export { TransitionControl } from './components/TransitionControl';
export { EasingVisualization } from './components/EasingVisualization';
export { TextControl } from './components/TextControl';
export { SelectControl } from './components/SelectControl';
export { ColorControl } from './components/ColorControl';
export { VectorControl } from './components/VectorControl';
export { GradientControl, gradientToCss } from './components/GradientControl';
export { ImagePickerControl } from './components/ImagePickerControl';
export { CurvesControl } from './components/CurvesControl';
export { FontPickerControl } from './components/FontPickerControl';
export { PaletteControl } from './components/PaletteControl';
export { ColorCollectionControl } from './components/ColorCollectionControl';
export { RangeInputControl } from './components/RangeInputControl';
export { PresetManager } from './components/PresetManager';
export { ShortcutsMenu } from './components/ShortcutsMenu';

// Store (for advanced usage)
export { DialStore, DEFAULT_GRADIENT, DEFAULT_RANGE_INPUT } from './store/DialStore';
export type {
  SpringConfig,
  EasingConfig,
  TransitionConfig,
  ActionConfig,
  SelectConfig,
  ColorConfig,
  TextConfig,
  DialKitPersistOptions,
  ShortcutConfig,
  ShortcutMode,
  ShortcutInteraction,
  Preset,
  DialValue,
  DialConfig,
  DialKitValueUpdates,
  ResolvedValues,
  ControlMeta,
  PanelConfig,
  VectorConfig,
  VectorValue,
  GradientConfig,
  GradientValue,
  GradientStop,
  ImagePickerConfig,
  ImagePickerValue,
  CurvesConfig,
  CurvesValue,
  FontPickerConfig,
  FontPickerValue,
  PaletteConfig,
  PaletteValue,
  ColorCollectionConfig,
  ColorCollectionValue,
  RangeInputConfig,
  RangeInputValue,
} from './store/DialStore';
