import type { SectionStyleOption } from "./types";

type StyleListener = () => void;

export class SectionStyleRegistry<T extends string = string> {
  private options = new Map<T, SectionStyleOption<T>>();
  private listeners = new Set<StyleListener>();
  private listSnapshot: SectionStyleOption<T>[] = [];

  constructor(seed: SectionStyleOption<T>[] = []) {
    seed.forEach((option) => this.options.set(option.id, option));
    this.refreshListSnapshot();
  }

  private refreshListSnapshot() {
    this.listSnapshot = [...this.options.values()];
  }

  subscribe(listener: StyleListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  register(option: SectionStyleOption<T>): void {
    this.options.set(option.id, option);
    this.refreshListSnapshot();
    this.notify();
  }

  registerMany(options: SectionStyleOption<T>[]): void {
    options.forEach((option) => this.register(option));
  }

  list(): SectionStyleOption<T>[] {
    return this.listSnapshot;
  }

  getLabel(id: T): string {
    return this.options.get(id)?.label ?? id;
  }

  has(id: string): id is T {
    return this.options.has(id as T);
  }
}
