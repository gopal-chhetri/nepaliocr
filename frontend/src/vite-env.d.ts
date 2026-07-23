/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NEPALI_OCR_SERVER: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}