import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { Readable } from "stream";

export class CloudinaryUtils {
  constructor() {
    cloudinary.config({
      api_key: process.env.CLOUDINARY_API_KEY!,
      api_secret: process.env.CLOUDINARY_API_SECRET!,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    });
  }

  private bufferToStream(buffer: Buffer): Readable {
    const readable = new Readable();
    readable._read = () => {}; // no-op
    readable.push(buffer);
    readable.push(null);
    return readable;
  }

  async upload(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      try {
        if (!file?.buffer) {
          return reject(new Error("No file buffer provided"));
        }

        const readableStream = this.bufferToStream(file.buffer);

        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "your_app_folder" }, // optional: group uploads
          (err, result) => {
            if (err) return reject(err);
            if (!result) return reject(new Error("Upload failed — no result."));
            resolve(result);
          }
        );

        readableStream.pipe(uploadStream);
      } catch (err) {
        reject(err);
      }
    });
  }

  async destroy(publicId: string): Promise<void> {
    if (!publicId) return;
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  }
}
