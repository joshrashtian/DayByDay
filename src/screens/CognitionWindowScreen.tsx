import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { motion } from "motion/react";
import { IoPencil } from "react-icons/io5";
import { Pencil01 } from "@untitledui/icons";
const hide = () => void invoke("hide_cognition_bar");

export default function CognitionWindowScreen() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") hide();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <motion.div
      data-tauri-drag-region
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1 }}

      className="h-full w-full items-center flex flex-row overflow-hidden rounded-3xl  px-12   bg-surface/20 backdrop-blur-2xl"
    >

      <div className="flex w-full relative items-center flex-row">
      <input
        autoFocus
        placeholder="What will you conjure up?"
        className=" bg-transparent w-full font-black  placeholder:font-display py-4 text-3xl  text-white outline-none placeholder:text-faint"
        />
        <button className="absolute right-0  w-12 h-12 flex items-center justify-center rounded-full text-white bg-slate-600/60 text-xl">
          <Pencil01 />
        </button>
      </div>
    </motion.div>
  );
}
