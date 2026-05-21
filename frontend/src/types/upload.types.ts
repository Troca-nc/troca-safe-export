// src/types/upload.types.ts

export interface UploadedImage {
  key:         string   // clé S3 ex: "annonces/abc123/0.webp"
  url:         string   // URL publique CDN
  width:       number
  height:      number
  size_bytes:  number   // taille après compression
  order:       number   // position dans l'annonce (0 = principale)
}

export interface UploadProgressEvent {
  file_index:  number
  total_files: number
  progress_pct: number  // 0-100
  stage:       'compressing' | 'uploading' | 'done' | 'error'
  error?:      string
}

export interface UploadConfig {
  max_files:       number
  max_size_mb:     number
  target_width:    number
  thumbnail_width: number
  quality:         number
  accepted_types:  string[]
}

export const UPLOAD_CONFIG: UploadConfig = {
  max_files:       8,
  max_size_mb:     15,
  target_width:    1280,
  thumbnail_width: 400,
  quality:         82,
  accepted_types:  ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
}
