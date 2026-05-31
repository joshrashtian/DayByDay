import { buildClockStylePrototype } from "../providers/clockStyleDefaults";
import { CORE_HOME_THEMES } from "./coreThemes";
import type {
  HomeThemeDefinition,
  HomeThemeDefinitionInput,
  HomeThemeId,
  HomeThemeListItem,
  ResolvedHomeTheme,
} from "./types";

type ThemeListener = () => void;

export class HomeThemeRegistry {
  private themes = new Map<HomeThemeId, HomeThemeDefinition>();
  private listeners = new Set<ThemeListener>();
  private listSnapshot: HomeThemeListItem[] = [];

  constructor(seed: HomeThemeDefinitionInput[] = CORE_HOME_THEMES) {
    seed.forEach((theme) => {
      this.themes.set(theme.id, {
        source: theme.source ?? "core",
        ...theme,
      });
    });
    this.refreshListSnapshot();
  }

  private refreshListSnapshot() {
    this.listSnapshot = [...this.themes.values()].map(
      ({ id, label, description, swatch, source, template }) => ({
        id,
        label,
        description,
        swatch,
        source,
        template,
      }),
    );
  }

  subscribe(listener: ThemeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  register(input: HomeThemeDefinitionInput): HomeThemeDefinition {
    const theme: HomeThemeDefinition = {
      source: input.source ?? "user",
      ...input,
    };
    this.themes.set(theme.id, theme);
    this.refreshListSnapshot();
    this.notify();
    return theme;
  }

  registerMany(inputs: HomeThemeDefinitionInput[]): void {
    inputs.forEach((input) => this.register(input));
  }

  has(id: string): boolean {
    return this.themes.has(id);
  }

  get(id: string): HomeThemeDefinition {
    return this.themes.get(id) ?? this.themes.get("minimal")!;
  }

  list(): HomeThemeListItem[] {
    return this.listSnapshot;
  }

  resolveClockPrototype(themeId: string) {
    const theme = this.get(themeId);
    return buildClockStylePrototype(theme.id, {
      template: theme.template,
      source: theme.source,
      pageClassName: theme.page.className,
      pageContentClassName: theme.page.contentClassName,
      ...theme.clockOverrides,
    });
  }

  resolve(themeId: string): ResolvedHomeTheme {
    const theme = this.get(themeId);
    return {
      ...theme,
      clock: this.resolveClockPrototype(themeId),
    };
  }
}

export const homeThemeRegistry = new HomeThemeRegistry();

export function registerHomeTheme(
  input: HomeThemeDefinitionInput,
): HomeThemeDefinition {
  return homeThemeRegistry.register(input);
}

export function listHomeThemes(): HomeThemeListItem[] {
  return homeThemeRegistry.list();
}

export function getHomeTheme(themeId: string): HomeThemeDefinition {
  return homeThemeRegistry.get(themeId);
}

export function resolveHomeTheme(themeId: string): ResolvedHomeTheme {
  return homeThemeRegistry.resolve(themeId);
}

export function isHomeThemeId(value: string): boolean {
  return homeThemeRegistry.has(value);
}

export function normalizeHomeThemeId(value: string): HomeThemeId {
  return homeThemeRegistry.has(value) ? value : "minimal";
}

export function getHomeThemeLabel(themeId: string): string {
  return homeThemeRegistry.get(themeId).label;
}
