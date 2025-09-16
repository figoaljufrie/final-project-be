import multer from "multer";
import { fileTypeFromBuffer, FileTypeResult } from "file-type/core";
import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/api-error";

export class UploaderMiddleware {
  upload = () => {
    const storage = multer.memoryStorage();
    const limits = { fileSize: 1 * 1024 * 1024 }; //1 mb

    return multer({
      storage,
      limits,
    });
  };

  fileFilter = (allowedTypes: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      const files = req.files as
        | { [fieldname: string]: Express.Multer.File[] }
        | undefined;

      if (!files || Object.values(files).length === 0) {
        return next();
      }

      for (const fieldname in files) {
        const fileArray = files[fieldname];

        if (!fileArray) continue;

        for (const file of fileArray) {
          const type: FileTypeResult | undefined = await fileTypeFromBuffer(
            file.buffer
          );

          if (!type || !allowedTypes.includes(type.mime)) {
            throw new ApiError(
              `Invalid file type: ${type?.mime ?? "unknown"}`,
              400
            );
          }
        }
        return next();
      }
    };
  };
}
