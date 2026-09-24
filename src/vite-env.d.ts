/// <reference types="vite/client" />

declare module "*.riv" {
  const src: string;
  export default src;
}

interface ImportMetaEnv {
  readonly VITE_ENABLE_SPOTIFY?: string;
}
