import "./config/env";
import "./module-alias";
import {
  PORT,
  createSocketServer,
  connectRedis,
  gracefulShutdown,
} from "./server";

async function main() {
  console.log("NODE_ENV =", process.env.NODE_ENV);

  await connectRedis();

  const { server } = createSocketServer();
  server.listen(PORT, () => {
    console.log("서버 실행중...", PORT);
  });

  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);
}

main();
