import { createServer } from "./server";
import { config } from "./lib/config";
import { prisma } from "./lib/prisma";

const server = createServer({ prisma });

server.listen(config.port, () => {
  console.log(`API listening on ${config.port}`);
});
