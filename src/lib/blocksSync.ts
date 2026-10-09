import { useSettingsStore } from "@/stores/settingsStore";
import { blockRowToConfig } from "@/lib/cloud/mappers";
import { createNamedConfigSync } from "@/lib/namedConfigSync";
import type { UserBlockRow } from "@/types/database";
import type { BlockConfig } from "@/types";

export const syncBlocks = createNamedConfigSync<BlockConfig, UserBlockRow>({
  table: "user_blocks",
  apiBase: "/blocksapi/blocks",
  storageKey: "risebyday-blocks-sync",
  getLocal: () => useSettingsStore.getState().blockConfigs,
  setLocal: (configs) => useSettingsStore.getState().setBlockConfigs(configs),
  rowToConfig: blockRowToConfig,
  configToFields: (b) => ({
    name: b.name,
    start_minutes: b.startMinutes,
    end_minutes: b.endMinutes,
    color: b.color ?? null,
    icon: b.icon ?? null,
  }),
});
