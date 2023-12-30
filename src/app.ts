import express from "express";
import { createServer } from "http";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import passport from "passport";
import compression from "compression";
import cookieParser from "cookie-parser";
import xss from "xss";
import session from "express-session";
import AppError from "./utils/appError";
import configureSocket from "./utils/socket";
import globalErrorHandler from "./controllers/errorController";
import authRouter from "./routes/authRoutes";
import profileRouter from "./routes/profileRoutes";
import postRouter from "./routes/postRoutes";
import commentRouter from "./routes/commentRoutes";
import likeRouter from "./routes/likeRoutes";
import conversationRouter from "./routes/conversationRoutes";
import messageRouter from "./routes/messageRoutes";

const app = express();

//Setup socket.io
const server = createServer(app);
const io = configureSocket(server);
app.use((req: any, res, next) => {
  req.io = io;
  return next();
});

//Parse json bodies
app.use(express.json());

//Parse cookies
app.use(cookieParser());

//Allow cors for all domains
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

//Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    },
  })
);

//Initialize passport
app.use(passport.initialize());

//Use passport session
app.use(passport.session());

//Use morgan logger in the develpment
app.use(morgan("dev"));

//Set security http headers
app.use(helmet());

//Data sanitization against xss attacks
xss('<script>alert("xss");</script>');

//Compress all text sent in the response to the client
if (process.env.NODE_ENV === "production") {
  app.use(compression());
}

//Global resources
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/profile", profileRouter);
app.use("/api/v1/post", postRouter);
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/like", likeRouter);
app.use("/api/v1/conversation", conversationRouter);
app.use("/api/v1/message", messageRouter);

// Handle requests from wrong urls
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

//Using global error handling middleware
app.use(globalErrorHandler);

export default server;
