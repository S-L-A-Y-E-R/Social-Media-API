import { Server, Socket } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
import { NextFunction, Request, Response } from "express";
import * as http from "http";
import {
  setActiveStatus,
  setMessagesDelivery,
} from "../middlewares/socketMiddleware";

const configureSocket = (server: http.Server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      credentials: true,
    },
  });

  instrument(io, {
    auth: false,
    mode: "development",
  });

  io.on("connection", (socket: Socket) => {
    setActiveStatus(true)(
      socket.request as Request,
      {} as Response,
      {} as NextFunction
    );
    setMessagesDelivery(
      socket.request as Request,
      {} as Response,
      {} as NextFunction
    );
    console.log("A user connected");

    socket.on("disconnect", () => {
      setActiveStatus(false)(
        socket.request as Request,
        {} as Response,
        {} as NextFunction
      );
      console.log("User disconnected");
    });
  });

  return io;
};

export default configureSocket;
