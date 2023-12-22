import { User } from "@prisma/client";
import nodemailer from "nodemailer";
import { convert } from "html-to-text";
import mailgunTransport from "nodemailer-mailgun-transport";
import fs from "fs";

interface EmailOptions {
  from: string;
  to: string;
  subject?: string;
  html?: string;
  text?: string;
}

class Email implements EmailOptions {
  from: string;
  to: string;
  fullName: string;
  constructor(
    public user: User,
    public code: string
  ) {
    this.to = user.email;
    this.fullName = user.username;
    this.code = code;
    this.from = `Social Media App <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === "production") {
      return nodemailer.createTransport(
        mailgunTransport({
          auth: {
            api_key: process.env.MAILGUN_API_KEY!,
            domain: process.env.MAILGUN_DOMAIN!,
          },
        })
      );
    }

    return nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: Number(process.env.MAILTRAP_PORT),
      auth: {
        user: process.env.MAILTRAP_USERNAME,
        pass: process.env.MAILTRAP_PASSWORD,
      },
    });
  }

  async send(html: string, subject: string) {
    const emailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: convert(html),
    };

    await this.newTransport().sendMail(emailOptions);
  }

  async sendPasswordReset() {
    const template = await fs.promises.readFile(
      `${__dirname}/../public/templates/resetPassword.html`,
      "utf-8"
    );

    const html = template.replace("#code#", this.code);
    await this.send(html, "Your password reset token (valid for 10 minutes)");
  }
}

export default Email;
