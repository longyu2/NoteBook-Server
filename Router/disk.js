const express = require("express");
const router = express.Router();
const multiparty = require("multiparty");
const path = require("path");
// disk省略相关抽象，直接实现上传下载功能，无数据库
const { Jimp } = require("jimp");
const homeDir = "./public/upload/disk";
const fs = require("fs");

/**
 * Node.js 生成图片缩略图的核心函数
 * @param {string} inputPath - 原图片路径（绝对/相对）
 * @param {string} outputPath - 缩略图输出路径
 * @param {object} options - 配置项
 * @param {number} options.width - 缩略图宽度（高度自动等比）
 * @param {number} [options.quality=80] - 图片质量（1-100，仅针对jpg/webp）
 * @returns {Promise<void>}
 */
/**
 * Node.js 生成图片缩略图的核心函数
 * @param {string} inputPath - 原图片路径（绝对/相对）
 * @param {string} outputPath - 缩略图输出路径
 * @param {object} options - 配置项
 * @param {number} options.width - 缩略图宽度（高度自动等比）
 * @param {number} [options.quality=80] - 图片质量（1-100，仅针对jpg/webp）
 * @returns {Promise<void>}
 */
async function generateThumbnail(inputPath, outputPath, options) {
  try {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`原图片不存在：${inputPath}`);
    }
    const { width, quality = 80 } = options;
    // jimp@1.x API，quality 在 write 的配置参数，不是 image.setQuality
    const image = await Jimp.read(inputPath);
    image.resize({ w: width, h: Jimp.AUTO });
    // ❌ 删除 image.setQuality(quality);
    await image.write(outputPath, { quality });
    console.log(`缩略图生成成功：${outputPath}`);
  } catch (err) {
    console.error("生成缩略图失败：", err.message);
    throw err;
  }
}

// 查找文件夹内的所有文件
router.get("/files/", async (req, res) => {
  if (!fs.existsSync(`./public/upload/disk`)) {
    res.send([]);
  } else {
    res.send(fs.readdirSync(homeDir));
  }
});

router.delete("/files/:filename", async (req, res) => {
  const name = req.params.filename;

  // 检测是否存在
  if (fs.existsSync(`${homeDir}/${name}`)) {
    fs.unlinkSync(`${homeDir}/${name}`);
    res.send({ status: 200, message: "删除成功" });
  } else {
    res.send({ status: 400, message: "文件不存在" });
    return;
  }
});

//上传文件
router.post("/filesupload", async (req, res) => {
  let userId = req.user.userid; // 得到userid

  // 如果文件夹不存在，新建文件夹
  if (!fs.existsSync("./public")) {
    fs.mkdirSync("./public");
  }
  if (!fs.existsSync("./public/upload")) {
    fs.mkdirSync("./public/upload");
  }
  if (!fs.existsSync(`./public/upload/disk`)) {
    fs.mkdirSync(`./public/upload/disk`);
  }

  let originPath;
  let form = new multiparty.Form({ uploadDir: `./public/upload/disk` });
  form.parse(req, async (err, fields, files) => {
    if (files.file.length < 100) {
      let imgUrlStr = "";
      for (let i = 0; i < files.file.length; i++) {
        const file = files.file[i];

        file.path = file.path.replaceAll("\\", "/");
        originPath = form.uploadDir + "/" + file.originalFilename;
        const uploadDirFiles = fs.readdirSync(form.uploadDir);

        // 由于上传系统已经自动随机命名，这里若文件夹中没有重名文件就将这个随机名重命名回文件本来的名字
        if (uploadDirFiles.indexOf(file.originalFilename) == -1) {
          fs.renameSync(file.path, originPath);
          imgUrlStr += originPath.replace("./public/", "");
        } else {
          imgUrlStr += file.path.replace("public/", "");
        }
      }

      //为图片创建缩略图
      // 检测缩略图文件夹是否存在,不存在则创建
      const thumbnails_path = "./public/upload/thumbnails";
      if (!fs.existsSync(thumbnails_path)) {
        fs.mkdirSync(thumbnails_path);
      }

      const outputPath = path.join(thumbnails_path, path.basename(originPath));

      const ext = path.extname(originPath).toLowerCase().replace(".", "");
      if (["jpg", "jpeg", "png", "webp"].includes(ext)) {
        try {
          await generateThumbnail(originPath, outputPath, {
            width: 200,
            quality: 80,
          });
        } catch (err) {
          console.error("生成缩略图时出错：可能遇到非法图片文件", err);
        }
      }

      res.send({
        status: 200,
        message: "上传文件成功",
        url: imgUrlStr,
      });
    }
  });
});
module.exports = router;
