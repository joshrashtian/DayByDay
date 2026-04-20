import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  BLOCKS_USER_CSS_CHANGED,
  BLOCKS_USER_CSS_STORAGE_KEY,
  getBlocksUserCss,
} from "../lib/blocksUserCss";
import "./BlockScreen.css";

type BlockRowVariant =
  | "early-morning"
  | "morning"
  | "afternoon"
  | "evening"
  | "night";

type Block = {
  name: string;
  description: string;
  rowVariant?: BlockRowVariant;
};

const rowClassName = (variant?: BlockRowVariant) => {
  const base = "block-screen__row";
  if (variant === "early-morning")
    return `${base} block-screen__row--early-morning`;
  return base;
};

const BlockScreen = () => {
  const [userCss, setUserCss] = useState(() => getBlocksUserCss());
  const userStyleRef = useRef<HTMLStyleElement>(null);

  useLayoutEffect(() => {
    const el = userStyleRef.current;
    if (el) el.textContent = userCss;
  }, [userCss]);

  useEffect(() => {
    const sync = () => setUserCss(getBlocksUserCss());
    window.addEventListener(BLOCKS_USER_CSS_CHANGED, sync);
    const onStorage = (e: StorageEvent) => {
      if (e.key === BLOCKS_USER_CSS_STORAGE_KEY || e.key === null) sync();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(BLOCKS_USER_CSS_CHANGED, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const sampleBlocks: Block[] = [
    {
      name: "Early Morning",
      description:
        "This is the early morning block. It is the time of day when you are most awake and alert.",
      rowVariant: "early-morning",
    },
    {
      name: "Morning",
      description:
        "This is the morning block. It is the time of day when you are most awake and alert.",
    },
    {
      name: "Afternoon",
      description:
        "This is the afternoon block. It is the time of day when you are most awake and alert.",
    },
    {
      name: "Evening",
      description:
        "This is the evening block. It is the time of day when you are most awake and alert.",
    },
    {
      name: "Night",
      description:
        "This is the night block. It is the time of day when you are most awake and alert.",
    },
  ];
  return (
    <>
      {/* User rules from Settings; textContent assigned in useLayoutEffect */}
      <style ref={userStyleRef} id="daybyday-blocks-user-css" />
      <div id="block-screen" className="block-screen">
        <h1 className="block-screen__title">Blocks</h1>
        <div className="block-screen__list">
          {sampleBlocks.map((block) => (
            <div
              key={block.name}
              className={
                rowClassName(block.rowVariant) +
                " flex flex-col items-start justify-start gap-2"
              }
            >
              <h1 className="block-screen__row--title">{block.name}</h1>
              <p className="block-screen__row--description text-zinc-500  ">
                {block.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default BlockScreen;
