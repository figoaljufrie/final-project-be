import { NextFunction, Request, Response } from "express";
import { fileTypeFromBuffer } from "file-type";
import multer from "multer";
import { ApiError } from "../utils/api-error";

export class UploaderMiddleware {
  private readonly allowedMimeTypes = ["image/jpeg", "image/png", "image/gif"];

  upload = () => {
    const storage = multer.memoryStorage();
    const limits = { fileSize: 1 * 1024 * 1024 }; // 1MB

    return multer({
      storage,
      limits,
      fileFilter: (req, file, cb) => {
        if (this.allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new ApiError(`Invalid file type: ${file.mimetype}`, 400));
        }
      },
    });
  };

  fileFilter = (allowedTypes: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const files = req.files as
          | Express.Multer.File[]
          | { [fieldname: string]: Express.Multer.File[] }
          | undefined;
        const singleFile = req.file;

        if (singleFile) {
          const type = await fileTypeFromBuffer(singleFile.buffer);
          if (!type || !allowedTypes.includes(type.mime)) {
            throw new ApiError(
              `Invalid file type: ${type?.mime ?? "unknown"}`,
              400
            );
          }
          return next();
        }

        if (!files) return next();

        const fileArray = Array.isArray(files)
          ? files
          : Object.values(files).flat();

        for (const file of fileArray) {
          const type = await fileTypeFromBuffer(file.buffer);
          if (!type || !allowedTypes.includes(type.mime)) {
            throw new ApiError(
              `Invalid file type: ${type?.mime ?? "unknown"}`,
              400
            );
          }
        }
        next();
      } catch (error) {
        next(error);
      }
    };
  };
}
