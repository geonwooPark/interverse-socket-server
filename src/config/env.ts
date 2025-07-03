import dotenv from "dotenv";
import path from "path";

const env = process.env.NODE_ENV || "development";

export default dotenv.config({
  path: path.resolve(process.cwd(), `.env.${env}`),
});
