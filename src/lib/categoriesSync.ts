import { useSettingsStore } from "@/stores/settingsStore";
import { categoryRowToConfig } from "@/lib/cloud/mappers";
import { createNamedConfigSync } from "@/lib/namedConfigSync";
import type { UserCategoryRow } from "@/types/database";
import type { CategoryConfig } from "@/types";

export const syncCategories = createNamedConfigSync<CategoryConfig, UserCategoryRow>({
  table: "user_categories",
  apiBase: "/categoriesapi/categories",
  storageKey: "risebyday-categories-sync",
  getLocal: () => useSettingsStore.getState().categoryConfigs,
  setLocal: (configs) => useSettingsStore.getState().setCategoryConfigs(configs),
  rowToConfig: categoryRowToConfig,
  configToFields: (c) => ({
    name: c.name,
    color: c.color,
    icon: c.icon ?? null,
  }),
});
