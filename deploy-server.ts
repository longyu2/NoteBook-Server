import axios from "axios";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import FormData from "form-data";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DIST_JS = path.resolve(__dirname, "dist.js");
const KEY_PATH = path.resolve(__dirname, "deploy.key");

const SERVER_URL = process.env.DEPLOY_URL || "http://misaka-mikoto.cn:9994/v1";

function readKey(): string {
  if (process.env.DEPLOY_SECRET) return process.env.DEPLOY_SECRET.trim();
  if (fs.existsSync(KEY_PATH)) return fs.readFileSync(KEY_PATH, "utf-8").trim();
  throw new Error("找不到部署密钥：请设置 DEPLOY_SECRET 或创建 deploy.key");
}

async function main() {
  if (!fs.existsSync(DIST_JS)) {
    throw new Error(`找不到 ${DIST_JS}，先执行构建`);
  }

  const form = new FormData();
  form.append("file", fs.createReadStream(DIST_JS));

  const res = await axios.post(`${SERVER_URL}/deploy-server`, form, {
    headers: {
      ...form.getHeaders(),
      "x-deploy-secret": readKey(),
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });

  console.log(res.data);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
