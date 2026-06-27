/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_DATA_SOURCE?: string;
  readonly VITE_FOOTBALL_DATA_BASE?: string;
  readonly VITE_FOOTBALL_DATA_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
