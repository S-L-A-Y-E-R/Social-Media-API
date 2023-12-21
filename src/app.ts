import express from "express";
import morgan from "morgan";
import cors from "cors";
import AppError from "./utils/appError";
import globalErrorHandler from "./controllers/errorController";

const app = express();

//Limit data incoming from the request body
app.use(express.json());

//Allow cors for all domains
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

//Use morgan logger in the develpment
app.use(morgan("dev"));

//Global resources

// Handle requests from wrong urls
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

//Using global error handling middleware
app.use(globalErrorHandler);

export default app;
