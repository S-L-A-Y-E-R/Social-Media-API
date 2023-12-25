import webPush from "web-push";

const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY!,
  privateKey: process.env.VAPID_PRIVATE_KEY!,
};

webPush.setVapidDetails(
  `mailto:${process.env.EMAIL_FROM}`,
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export default webPush;
