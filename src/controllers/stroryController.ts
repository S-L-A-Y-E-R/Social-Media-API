import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prismaClient";
import catchAsync from "../utils/catchAsync";
import { storyValidator } from "../validators/storyValidator";
import {
  handlePhotoUpload,
  handleVideoUpload,
} from "../utils/commentHelperFuntions";
import AppError from "../utils/appError";
import "../utils/storyCorn";

export const addStrory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { content, authorId, privacy } = req.body;
    const uploadedPhoto = await handlePhotoUpload(req);
    const uploadedVideo = await handleVideoUpload(req);
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() + 24);

    const profile = await prisma.profile.findUnique({
      where: {
        id: Number(authorId),
      },
      include: {
        archive: true,
      },
    });

    if (!profile) {
      return next(new AppError("Profile not found", 404));
    }

    const validatedData = storyValidator.parse({
      content,
      authorId: Number(authorId),
      privacy,
      expiryTime,
      image: uploadedPhoto,
      video: uploadedVideo,
    });

    if (validatedData instanceof Error) {
      return next(new AppError(validatedData.message, 400));
    }

    const story = await prisma.story.create({
      data: {
        content: validatedData.content,
        authorId: validatedData.authorId,
        privacy: validatedData.privacy || "PUBLIC",
        expiryTime: validatedData.expiryTime,
        image: validatedData.image
          ? {
              create: {
                url: validatedData.image,
              },
            }
          : undefined,
        video: validatedData.video
          ? {
              create: {
                url: validatedData.video,
              },
            }
          : undefined,
      },
    });

    if (!profile.archive) {
      await prisma.archive.create({
        data: {
          profileId: profile.id,
        },
      });
    }

    res.status(201).json({
      status: "success",
      data: {
        story,
      },
    });
  }
);

export const deleteStory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const story = await prisma.story.findUnique({
      where: {
        id: Number(id),
      },
    });
    if (!story) {
      return next(new AppError("Story not found", 404));
    }
    await prisma.story.delete({
      where: {
        id: Number(id),
      },
    });
    res.status(204).json({
      status: "success",
      data: null,
    });
  }
);

export const getStories = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { profileId } = req.params;

    const stories = await prisma.story.findMany({
      where: {
        authorId: Number(profileId),
        visible: true,
        privacy: "PUBLIC" || "FRIENDS",
      },
      include: {
        image: true,
        video: true,
      },
    });

    res.status(200).json({
      status: "success",
      result: stories.length,
      data: {
        stories,
      },
    });
  }
);
