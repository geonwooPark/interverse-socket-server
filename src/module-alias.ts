import { addAliases } from "module-alias";
import path from "path";

const isProd = process.env.NODE_ENV === "production";

// 기준 디렉토리 (빌드 후엔 __dirname이 dist 기준임)
const baseDir = isProd ? path.resolve(__dirname, "..") : __dirname;

addAliases({
  "@handlers": path.join(baseDir, "handlers"),
  "@interfaces": path.join(baseDir, "interfaces"),
});
