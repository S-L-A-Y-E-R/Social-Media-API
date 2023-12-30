import { Request, Response, NextFunction } from "express";
import webPush from "../utils/webPush";
import { commentSchema } from "../validators/commentValidator";
import { prisma } from "../utils/prismaClient";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";
import {
  handleVideoUpload,
  handlePhotoUpload,
} from "../utils/commentHelperFuntions";
import { getUser } from "../utils/profileHelperFunctions";

export const addComment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const profile = (await getUser(req, res, next))?.profile;
    const { content, postId, authorId, mentions } = req.body;
    const uploadedPhoto = await handlePhotoUpload(req);
    const uploadedVideo = await handleVideoUpload(req);

    const post = await prisma.post.findUnique({
      where: {
        id: Number(postId),
      },
    });

    if (!post) {
      return next(new AppError("Post not found", 404));
    }

    if (!post.commentsEnabled) {
      return next(new AppError("Comments are not enabled for this post", 403));
    }

    const validatedData = commentSchema.parse({
      content,
      postId: Number(postId),
      authorId: Number(authorId),
      image: uploadedPhoto,
      video: uploadedVideo,
    });

    if (validatedData instanceof Error) {
      return next(new AppError(validatedData.message, 400));
    }

    const comment = await prisma.$transaction([
      prisma.comment.create({
        data: {
          content: validatedData.content,
          postId: validatedData.postId,
          authorId: validatedData.authorId,
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
      }),
      prisma.post.update({
        where: {
          id: Number(postId),
        },
        data: {
          commentsCount: {
            increment: 1,
          },
        },
      }),
    ]);

    const commentSubscription = await prisma.subscription.findUnique({
      where: {
        profileId: post.authorId,
      },
    });

    if (commentSubscription) {
      const modifiedProfileSubscription = {
        id: commentSubscription?.id,
        endpoint: commentSubscription?.endpoint as string,
        keys: {
          auth: commentSubscription?.auth as string,
          p256dh: commentSubscription?.p256dh as string,
        },
        type: commentSubscription?.type,
        profileId: commentSubscription?.profileId,
      };
      const payload = JSON.stringify({
        title: "New comment",
        body: `${profile?.fullName} commented on your post`,
      });
      await webPush.sendNotification(modifiedProfileSubscription, payload);
    }

    if (mentions.length > 0) {
      const mentionedProfilesSubscriptions = await prisma.subscription.findMany(
        {
          where: {
            profileId: {
              in: mentions,
            },
          },
        }
      );

      mentionedProfilesSubscriptions.forEach(async (subscription) => {
        const modifiedProfileSubscription = {
          id: subscription?.id,
          endpoint: subscription?.endpoint as string,
          keys: {
            auth: subscription?.auth as string,
            p256dh: subscription?.p256dh as string,
          },
          type: subscription?.type,
          profileId: subscription?.profileId,
        };
        const payload = JSON.stringify({
          title: "New comment mention",
          body: `${profile?.fullName} mentioned you in a comment`,
        });
        await webPush.sendNotification(modifiedProfileSubscription, payload);
      });
    }

    res.status(201).json({
      status: "success",
      data: {
        comment,
      },
    });
  }
);

export const updateComment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { content, authorId, postId } = req.body;
    const uploadedPhoto = await handlePhotoUpload(req);
    const uploadedVideo = await handleVideoUpload(req);

    const comment = await prisma.comment.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!comment) {
      return next(new AppError("Comment not found", 404));
    }

    if (comment.authorId !== Number(authorId)) {
      return next(
        new AppError("You are not allowed to edit this comment", 403)
      );
    }

    const validatedData = commentSchema.parse({
      content,
      image: uploadedPhoto,
      authorId: Number(authorId),
      video: uploadedVideo,
      postId: Number(postId),
    });

    if (validatedData instanceof Error) {
      return next(new AppError(validatedData.message, 400));
    }

    const updatedComment = await prisma.comment.update({
      where: {
        id: Number(id),
      },
      data: {
        content: validatedData.content,
        isEdited: true,
        postId: Number(postId),
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

    res.status(200).json({
      status: "success",
      data: {
        comment: updatedComment,
      },
    });
  }
);

export const deleteComment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const profile = await getUser(req, res, next);
    const { id } = req.params;
    const authorId = profile?.id;

    const comment = await prisma.comment.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!comment) {
      return next(new AppError("Comment not found", 404));
    }

    if (comment.authorId !== Number(authorId)) {
      return next(
        new AppError("You are not allowed to delete this comment", 403)
      );
    }

    await prisma.comment.delete({
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

export const getPostComments = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { postId } = req.params;
    const post = await prisma.post.findUnique({
      where: {
        id: Number(postId),
      },
    });

    if (!post) {
      return next(new AppError("Post not found", 404));
    }

    const comments = await prisma.comment.findMany({
      take: req.query.limit ? Number(req.query.limit) : 10,
      skip: req.query.skip ? Number(req.query.skip) : 0,
      where: {
        postId: Number(postId),
        parentId: null,
      },
      include: {
        image: true,
        video: true,
        replies: {
          select: {
            content: true,
            id: true,
            isEdited: true,
            publishedAt: true,
            image: true,
            video: true,
          },
        },
      },
      orderBy: {
        publishedAt: "desc",
      },
    });

    res.status(200).json({
      status: "success",
      data: {
        comments,
      },
    });
  }
);

export const addReplyToComment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { content, postId, authorId } = req.body;
    const { parentId } = req.params;
    const uploadedPhoto = await handlePhotoUpload(req);
    const uploadedVideo = await handleVideoUpload(req);

    const parentComment = await prisma.comment.findUnique({
      where: {
        id: Number(parentId),
      },
    });

    if (!parentComment) {
      return next(new AppError("Parent comment not found", 404));
    }

    const validatedData = commentSchema.parse({
      content,
      postId: Number(postId),
      authorId: Number(authorId),
      image: uploadedPhoto,
      video: uploadedVideo,
    });

    if (validatedData instanceof Error) {
      return next(new AppError(validatedData.message, 400));
    }

    const reply = await prisma.$transaction([
      prisma.comment.create({
        data: {
          content: validatedData.content,
          postId: validatedData.postId,
          authorId: validatedData.authorId,
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
          parentId: Number(parentId),
        },
      }),
      prisma.comment.update({
        where: {
          id: Number(parentId),
        },
        data: {
          repliesCount: {
            increment: 1,
          },
        },
      }),
    ]);

    res.status(201).json({
      status: "success",
      data: {
        reply: reply[0],
      },
    });
  }
);
