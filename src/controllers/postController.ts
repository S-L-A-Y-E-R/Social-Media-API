import { Request, Response, NextFunction } from "express";
import webPush from "../utils/webPush";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";
import {
  handlePhotosUpload,
  handleVideosUpload,
} from "../utils/postHelperFunctions";
import { postSchema } from "../validators/postValidator";
import { prisma } from "../utils/prismaClient";
import { getUser } from "../utils/profileHelperFunctions";

export const createPost = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const profile = (await getUser(req, res, next))?.profile;
    const { content, authorId, mentions } = req.body;
    const uploadedPhotos = await handlePhotosUpload(req);
    const uploadedVideos = await handleVideosUpload(req);

    const validatedData = postSchema.parse({
      content,
      authorId: Number(authorId),
      images: uploadedPhotos,
      videos: uploadedVideos,
    });

    if (validatedData instanceof Error) {
      return next(new AppError(validatedData.message, 400));
    }

    const post = await prisma.post.create({
      data: {
        content: validatedData.content,
        authorId: validatedData.authorId,
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
          title: "New post mention",
          body: `${profile?.fullName} mentioned you in a post`,
        });
        await webPush.sendNotification(modifiedProfileSubscription, payload);
      });
    }

    res.status(201).json({
      status: "success",
      data: {
        post,
      },
    });
  }
);

export const getPost = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const post = await prisma.post.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        images: true,
        videos: true,
        comments: {
          include: {
            replies: true,
            likes: true,
            video: true,
            image: true,
          },
        },
        likes: true,
      },
    });

    if (!post) {
      return next(new AppError("No post found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        post,
      },
    });
  }
);

export const deletePost = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const profile = (await getUser(req, res, next))?.profile;
    const { id } = req.params;
    const authorId = profile?.id;

    const post = await prisma.post.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!post) {
      return next(new AppError("No post found with that ID", 404));
    }

    if (post.authorId !== Number(authorId)) {
      return next(
        new AppError("You are not authorized to delete this post", 403)
      );
    }

    await prisma.post.delete({
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

export const getPostsForProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { profileId } = req.params;

    const posts = await prisma.post.findMany({
      take: Number(req.query.limit) || 10,
      skip: Number(req.query.skip) || 0,
      where: {
        authorId: Number(profileId),
        privacy: req.query.privacy as "PUBLIC" | "PRIVATE" | "FRIENDS",
      },
      include: {
        images: true,
        videos: true,
        comments: {
          include: {
            replies: true,
            likes: true,
            video: true,
            image: true,
          },
        },
        likes: true,
      },
    });

    res.status(200).json({
      status: "success",
      results: posts.length,
      data: {
        posts,
      },
    });
  }
);

export const updatePost = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { content, authorId } = req.body;
    const uploadedPhotos = await handlePhotosUpload(req);
    const uploadedVideos = await handleVideosUpload(req);

    const post = await prisma.post.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!post) {
      return next(new AppError("No post found with that ID", 404));
    }

    if (post.authorId !== Number(authorId)) {
      return next(
        new AppError("You are not authorized to update this post", 403)
      );
    }

    if (post.authorId !== req.user.id) {
      return next(
        new AppError("You are not authorized to update this post", 403)
      );
    }

    await prisma.post.update({
      where: {
        id: Number(id),
      },
      data: {
        content: content,
        images: {
          createMany: {
            data:
              uploadedPhotos?.map((Image: string) => {
                return { url: Image };
              }) || [],
          },
        },
        videos: {
          createMany: {
            data:
              uploadedVideos?.map((Video: string) => {
                return { url: Video };
              }) || [],
          },
        },
      },
    });

    res.status(200).json({
      status: "success",
      data: post,
    });
  }
);

export const sharePost = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { profileId, postId } = req.params;
    const post = await prisma.post.findUnique({
      where: {
        id: Number(postId),
      },
    });

    if (!post) {
      return next(new AppError("No post found with that ID", 404));
    }

    if (!post.sharesEnabled) {
      return next(new AppError("This post cannot be shared", 403));
    }

    await prisma.$transaction([
      prisma.postProfile.create({
        data: {
          profileId: Number(profileId),
          postId: Number(postId),
        },
      }),
      prisma.post.update({
        where: {
          id: Number(postId),
        },
        data: {
          shares: {
            increment: 1,
          },
        },
      }),
    ]);

    res.status(201).json({
      status: "success",
      data: {
        post,
      },
    });
  }
);

export const getFeed = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const profile = (
      await prisma.user.findUnique({
        where: {
          id: req.user.id,
        },
        include: {
          profile: {
            include: {
              following: true,
            },
          },
        },
      })
    )?.profile;

    const posts = await prisma.post.findMany({
      take: Number(req.query.limit) || 10,
      skip: Number(req.query.skip) || 0,
      where: {
        authorId: {
          in: profile?.following.map((profile) => profile.id) || [],
        },
        privacy: {
          in: ["PUBLIC", "FRIENDS"],
        },
      },
      include: {
        images: true,
        videos: true,
        comments: {
          include: {
            replies: true,
            likes: true,
            video: true,
            image: true,
          },
        },
        likes: true,
      },
      orderBy: {
        publishedAt: "desc",
      },
    });

    res.status(200).json({
      status: "success",
      results: posts.length,
      data: {
        posts,
      },
    });
  }
);
