/**
 * 从边缘泛洪：将与画布边缘连通的近白色像素设为透明，保留角色内部浅色。
 * 用法：node scripts/knockout-pet-white-bg.cjs
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const INPUT = path.join(__dirname, "../public/pet/chef-cat.png");
const BACKUP = path.join(__dirname, "../public/pet/chef-cat.flat-backup.png");
const OUTPUT = path.join(__dirname, "../public/pet/chef-cat.png");

/** RGB 均 ≥ 阈值视为「背景白」 */
const WHITE_THRESHOLD = 248;

function isNearWhite(r, g, b) {
  return r >= WHITE_THRESHOLD && g >= WHITE_THRESHOLD && b >= WHITE_THRESHOLD;
}

async function main() {
  if (!fs.existsSync(INPUT)) {
    console.error("Missing:", INPUT);
    process.exit(1);
  }

  if (!fs.existsSync(BACKUP)) {
    fs.copyFileSync(INPUT, BACKUP);
    console.log("Backed up flat source to", path.basename(BACKUP));
  }

  const image = sharp(INPUT).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels } = info;
  if (channels !== 4) {
    console.error("Expected RGBA");
    process.exit(1);
  }

  const buf = Buffer.from(data);
  const visited = new Uint8Array(W * H);
  const q = [];

  const idx = (x, y) => (y * W + x) * 4;
  const visI = (x, y) => y * W + x;

  function tryPush(x, y) {
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    const vi = visI(x, y);
    if (visited[vi]) return;
    const i = idx(x, y);
    const r = buf[i];
    const g = buf[i + 1];
    const b = buf[i + 2];
    if (!isNearWhite(r, g, b)) return;
    visited[vi] = 1;
    buf[i + 3] = 0;
    q.push(x, y);
  }

  for (let x = 0; x < W; x++) {
    tryPush(x, 0);
    tryPush(x, H - 1);
  }
  for (let y = 0; y < H; y++) {
    tryPush(0, y);
    tryPush(W - 1, y);
  }

  while (q.length) {
    const y = q.pop();
    const x = q.pop();
    tryPush(x + 1, y);
    tryPush(x - 1, y);
    tryPush(x, y + 1);
    tryPush(x, y - 1);
  }

  await sharp(buf, { raw: { width: W, height: H, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(OUTPUT);

  console.log("Wrote transparent PNG:", OUTPUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
