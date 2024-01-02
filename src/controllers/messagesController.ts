import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prismaClient";
import catchAsync from "../utils/catchAsync";
import {
  handlePhotosUpload,
  handleVideosUpload,
} from "../utils/postHelperFunctions";
import { messageSchema } from "../validators/messageValidator";
import { Socket } from "socket.io";

interface IRequest extends Request {
  io?: Socket;
}

export const sendMessage = catchAsync(
  async (req: IRequest, res: Response, next: NextFunction) => {
    const { content, conversationId } = req.body;
    const uploadedPhotos = await handlePhotosUpload(req);
    const uploadedVideos = await handleVideosUpload(req);

    const validatedData = messageSchema.parse({
      content,
      conversationId: Number(conversationId),
      images: uploadedPhotos,
      videos: uploadedVideos,
    });

    if (validatedData instanceof Error) {
      return next(validatedData);
    }

    const message = await prisma.message.create({
      data: {
        content: validatedData.content,
        conversationId: validatedData.conversationId,
        images: {
          createMany: {
            data:
              validatedData.images?.map((Image: string) => {
                return { url: Image };
              }) || [],
          },
        },
        videos: {
          createMany: {
            data:
              validatedData.videos?.map((Video: string) => {
                return { url: Video };
              }) || [],
          },
        },
      },
    });

    const channelKey = `chat:${validatedData.conversationId}:messages`;
    req.io!.emit(channelKey, message);

    res.status(201).json({
      status: "success",
      data: {
        message,
      },
    });
  }
);

export const updateMessage = catchAsync(
  async (req: IRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const message = await prisma.message.update({
      where: {
        id: Number(id),
      },
      data: {
        ...req.body,
      },
    });

    const updateKey = `chat:${message?.conversationId}:messages:update`;
    req.io!.emit(updateKey, message);

    res.status(200).json({
      status: "success",
      data: {
        message,
      },
    });
  }
);

export const deleteMessage = catchAsync(
  async (req: IRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const message = await prisma.message.update({
      where: {
        id: Number(id),
      },
      data: {
        isDeleted: true,
      },
    });

    const updateKey = `chat:${message?.conversationId}:messages:update`;
    req.io!.emit(updateKey, message);

    res.status(204).json({
      status: "success",
      data: null,
    });
  }
);

export const getMessages = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { conversationId } = req.params;

    const messages = await prisma.message.findMany({
      take: Number(req.query.limit) || 10,
      skip: Number(req.query.skip) || 0,
      where: {
        conversationId: Number(conversationId),
      },
      include: {
        images: true,
        videos: true,
      },
    });

    res.status(200).json({
      status: "success",
      data: {
        messages,
      },
    });
  }
);
