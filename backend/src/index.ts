import config from "./config/config.js";
import connectDB from "./db/index.js";
import { app, express } from "./app.js";

try {
  await connectDB();
  app.listen(config.port, () => {
    console.log(`Server running on PORT: ${config.port}`);
  });
} catch (error: any | { message: string }) {
  console.log("MongoDB Connection Error!!!", error.message);
}

app.get("/", (_, res) => res.send("API Running..."));
