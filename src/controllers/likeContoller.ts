import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prismaClient";
import catchAsync from "../utils/catchAsync";
import webPush from "../utils/webPush";

export const likePost = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { postId, profileId } = req.body;

    const author = await prisma.profile.findFirst({
      where: {
        posts: {
          some: {
            id: Number(postId),
          },
        },
      },
    });

    const profile = await prisma.profile.findUnique({
      where: {
        id: Number(profileId),
      },
    });

    const like = await prisma.$transaction([
      prisma.like.create({
        data: {
          postId: Number(postId),
          authorId: Number(profileId),
        },
      }),
      prisma.post.update({
        where: {
          id: Number(postId),
        },
        data: {
          likesCount: {
            increment: 1,
          },
        },
      }),
    ]);

    const likeSubscription = await prisma.subscription.findUnique({
      where: {
        id: author?.id,
        type: "NEW_LIKE",
      },
    });

    if (likeSubscription) {
      const modifiedSubscription = {
        id: likeSubscription?.id,
        endpoint: likeSubscription?.endpoint as string,
        keys: {
          auth: likeSubscription?.auth as string,
          p256dh: likeSubscription?.p256dh as string,
        },
        type: likeSubscription?.type,
        profileId: likeSubscription?.profileId,
      };
      const payload = JSON.stringify({
        title: "New post like",
        body: `${profile?.fullName} liked your post`,
      });
      await webPush.sendNotification(modifiedSubscription, payload);
    }

    res.status(200).json({
      status: "success",
      data: {
        like: like[0],
      },
    });
  }
);

export const unlikePost = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { postId } = req.body;
    const { id } = req.params;

    await prisma.$transaction([
      prisma.like.delete({
        where: {
          id: Number(id),
        },
      }),
      prisma.post.update({
        where: {
          id: Number(postId),
        },
        data: {
          likesCount: {
            decrement: 1,
          },
        },
      }),
    ]);

    res.status(200).json({
      status: "success",
      data: null,
    });
  }
);

export const likeComment = catchAsync(async (req, res, next) => {
  const { commentId, profileId } = req.body;

  const author = await prisma.profile.findFirst({
    where: {
      comments: {
        some: {
          id: Number(commentId),
        },
      },
    },
  });

  const profile = await prisma.profile.findUnique({
    where: {
      id: Number(profileId),
    },
  });

  const like = await prisma.$transaction([
    prisma.like.create({
      data: {
        commentId: Number(commentId),
        authorId: Number(profileId),
      },
    }),
    prisma.comment.update({
      where: {
        id: Number(commentId),
      },
      data: {
        likesCount: {
          increment: 1,
        },
      },
    }),
  ]);

  const likeSubscription = await prisma.subscription.findUnique({
    where: {
      id: author?.id,
      type: "NEW_LIKE",
    },
  });

  if (likeSubscription) {
    const modifiedSubscription = {
      id: likeSubscription?.id,
      endpoint: likeSubscription?.endpoint as string,
      keys: {
        auth: likeSubscription?.auth as string,
        p256dh: likeSubscription?.p256dh as string,
      },
      type: likeSubscription?.type,
      profileId: likeSubscription?.profileId,
    };
    const payload = JSON.stringify({
      title: "New comment like",
      body: `${profile?.fullName} liked your comment`,
    });
    await webPush.sendNotification(modifiedSubscription, payload);
  }

  res.status(200).json({
    status: "success",
    data: {
      like,
    },
  });
});

export const unlikeComment = catchAsync(async (req, res, next) => {
  const { commentId } = req.body;
  const { id } = req.params;

  await prisma.$transaction([
    prisma.like.delete({
      where: {
        id: Number(id),
      },
    }),
    prisma.comment.update({
      where: {
        id: Number(commentId),
      },
      data: {
        likesCount: {
          decrement: 1,
        },
      },
    }),
  ]);

  res.status(200).json({
    status: "success",
    data: null,
  });
});
