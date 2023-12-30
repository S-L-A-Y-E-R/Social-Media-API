import dotenv from "dotenv";

dotenv.config({ path: ".env" });

import server from "./app";

const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`Listening on port \x1b[32m ${port} \x1b[0m`);
});

process.on("unhandledRejection", (err: any) => {
  console.log(err.name, err.message);
  server.close(() => process.exit(1));
});
