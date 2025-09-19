import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { Readable } from "nodemailer/lib/xoauth2";

export class CloudinaryUtils {
  constructor() {
    cloudinary.config({
      api_key: process.env.CLOUDINARY_API_KEY!,
      api_secret: process.env.CLOUDINARY_API_SECRET!,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    });
  }

  private bufferToStream = (buffer: Buffer) => {
    const readable = new Readable();
    readable._read = () => {};
    readable.push(buffer);
    readable.push(null);
    return readable;
  };

  upload = (file: Express.Multer.File): Promise<UploadApiResponse> => {
    return new Promise((resolve, reject) => {
      const readableStream = this.bufferToStream(file.buffer);

      const uploadStream = cloudinary.uploader.upload_stream((err, result) => {
        if (err) return reject(err);

        if (!result) return reject(new Error("Upload Failed."));
        resolve(result);
      });

      readableStream.pipe(uploadStream);
    });
  };

  destroy = async (publicId: string) => {
    if (!publicId) return;
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  };
}
