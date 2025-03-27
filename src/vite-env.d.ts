
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_DB_SERVER: string;
  readonly VITE_DB_PORT: string;
  readonly VITE_DB_USER: string;
  readonly VITE_DB_PASSWORD: string;
  readonly VITE_DB_DATABASE: string;
  readonly VITE_JWT_SECRET: string;
  readonly VITE_FIPE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
