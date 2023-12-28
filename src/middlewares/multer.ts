import { Request } from "express";
import multer, { FileFilterCallback } from "multer";
import AppError from "../utils/appError";

const storage = multer.diskStorage({
  filename: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    cb(null, file.originalname);
  },
});

const multerFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file.mimetype.startsWith("image") || file.mimetype.startsWith("video")) {
    cb(null, true);
  } else {
    cb(
      new AppError("Please upload only images", 400) as unknown as null,
      false
    );
  }
};

const upload = multer({ storage: storage, fileFilter: multerFilter });

export default upload;
