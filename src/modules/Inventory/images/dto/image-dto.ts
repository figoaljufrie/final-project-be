export interface UploadedImageResult {
  url: string;
  publicId?: string;
  altText?: string;
  isPrimary: boolean;
  order: number;
}

export interface ImageFileInput {
  file: Express.Multer.File;
  altText?: string;
  isPrimary: boolean;
  order: number;
}

export interface ImageMetadata {
  isPrimary: boolean;
  order: number;
}