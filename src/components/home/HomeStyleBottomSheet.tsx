import BottomSheet from "../../ui/BottomSheet";
import { HomeStyleEditor } from "./HomeStyleEditor";
import { openHomeStyleWindow } from "../../lib/homeStyleWindow";
import type { HomeVisualPrefs } from "@/types";
import { IoColorPaletteOutline, IoOpenOutline } from "react-icons/io5";

type HomeStyleBottomSheetProps = {
  open: boolean;
  onClose: () => void;
  prefs: HomeVisualPrefs;
  onPrefsChange: (
    prefs: HomeVisualPrefs | ((prev: HomeVisualPrefs) => HomeVisualPrefs),
  ) => void;
};

export function HomeStyleBottomSheet({
  open,
  onClose,
  prefs,
  onPrefsChange,
}: HomeStyleBottomSheetProps) {
  const handleOpenWindow = async () => {
    const opened = await openHomeStyleWindow();
    if (opened) onClose();
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      defaultSnap="full"
      snapPoints={["half", "full"]}
      width="full"
      title="Home Style"
      titleIcon={<IoColorPaletteOutline className="text-lg" />}
      headerActions={
        <button
          type="button"
          onClick={() => void handleOpenWindow()}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          title="Open in separate window"
        >
          <IoOpenOutline className="text-base" />
          <span className="hidden sm:inline">Open window</span>
        </button>
      }
    >
      <HomeStyleEditor
        prefs={prefs}
        onPrefsChange={onPrefsChange}
        layout="sheet"
      />
    </BottomSheet>
  );
}
