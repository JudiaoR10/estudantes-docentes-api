import "dotenv/config";
import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

app.listen(env.port, env.host, () => {
  // eslint-disable-next-line no-console
  console.log(`API Smart Campus (G2) a correr em http://localhost:${env.port}`);
});
