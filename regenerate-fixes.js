const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("Error: GEMINI_API_KEY environment variable is required.");
  process.exit(1);
}

const MODEL = "imagen-4.0-generate-001";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:predict?key=${API_KEY}`;

const STYLE =
  "Style: Flat design illustration, minimal detail, soft rounded shapes, limited color palette (white, dark gray, red as accent color only), no text, no people, no watermarks, no labels, no badges, clean white background, suitable for web icon use, consistent line weight throughout. 800x600 pixels, 4:3 aspect ratio. ";

const IMAGE_LIST = [
  // ── 修正3: STEP実写 → イラスト差し替え ──
  {
    name: "images/battery/step3.webp",
    width: 800, height: 600,
    prompt: STYLE + "A portable jump starter device connected to a car battery with red and black booster cables/clamps attached to battery terminals under an open car hood. A green checkmark icon indicating successful engine start. Flat design style.",
  },
  {
    name: "images/tow-truck/step2.webp",
    width: 800, height: 600,
    prompt: STYLE + "A flatbed tow truck (car carrier truck) driving fast on a road with speed/motion lines behind it. A red location pin marker ahead showing the destination. The truck has a tilting flatbed for loading cars. Flat design style.",
  },

  // ── 修正4: タイヤ trouble 全4枚再生成 ──
  {
    name: "images/tire/trouble1.webp",
    width: 800, height: 600,
    prompt: STYLE + "A single car tire seen from the side, visibly burst and shredded with rubber pieces flying outward. A red warning triangle icon nearby. Road surface visible below. Flat design style.",
  },
  {
    name: "images/tire/trouble2.webp",
    width: 800, height: 600,
    prompt: STYLE + "A car wheel hitting a concrete curb/kerb stone at an angle, with a visible gash/tear on the tire sidewall. Small red impact lines at the collision point. Simple road and curb. Flat design style.",
  },
  {
    name: "images/tire/trouble3.webp",
    width: 800, height: 600,
    prompt: STYLE + "An open car trunk/boot showing an empty spare tire well with a red X mark where the spare tire should be. A small repair kit box nearby with a red question mark icon above. Flat design style.",
  },
  {
    name: "images/tire/trouble4.webp",
    width: 800, height: 600,
    prompt: STYLE + "A close-up side view of a car tire with a metal nail embedded in the tread. Small air lines escaping from the puncture. A red downward arrow icon above indicating pressure loss. Flat design style.",
  },

  // ── 修正5: レッカー trouble 全4枚タッチ統一 ──
  {
    name: "images/tow-truck/trouble1.webp",
    width: 800, height: 600,
    prompt: STYLE + "A sedan car with visible front-end collision damage - crumpled hood and cracked bumper. A red warning hazard triangle placed behind the car on the road. Small debris scattered around. Flat design style.",
  },
  {
    name: "images/tow-truck/trouble2.webp",
    width: 800, height: 600,
    prompt: STYLE + "A car stopped on a road with its hood open, white steam/smoke rising from the overheated engine compartment. A red engine warning light icon floating above. Flat design style.",
  },
  {
    name: "images/tow-truck/trouble3.webp",
    width: 800, height: 600,
    prompt: STYLE + "A car with one front wheel dropped into a roadside ditch/gutter, the car body tilted at an angle. A red exclamation mark icon floating above. Simple road edge and drainage channel. Flat design style.",
  },
  {
    name: "images/tow-truck/trouble4.webp",
    width: 800, height: 600,
    prompt: STYLE + "A car inside a low-ceiling underground parking garage, shown from the side. A height restriction bar/sign visible above. A red warning/prohibition icon near the ceiling entrance. Flat design style.",
  },
];

function getAspectRatio(width, height) {
  const ratio = width / height;
  if (Math.abs(ratio - 16 / 9) < 0.1) return "16:9";
  if (Math.abs(ratio - 4 / 3) < 0.1) return "4:3";
  if (Math.abs(ratio - 3 / 4) < 0.1) return "3:4";
  if (Math.abs(ratio - 9 / 16) < 0.1) return "9:16";
  return "1:1";
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateAndSave(item, index, total) {
  const outputPath = path.join(__dirname, item.name);
  const aspectRatio = getAspectRatio(item.width, item.height);
  console.log(`[${index + 1}/${total}] Generating: ${item.name} (${aspectRatio}) ...`);

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt: item.prompt }],
          parameters: { sampleCount: 1, aspectRatio },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if ((response.status === 429 || response.status === 400) && attempt < 3) {
          console.log(`  -> Rate limited (${response.status}), retrying in 20s (attempt ${attempt}/3)...`);
          await sleep(20000);
          continue;
        }
        throw new Error(`API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      if (!data.predictions || data.predictions.length === 0) {
        if (attempt < 3) {
          console.log(`  -> No predictions, retrying in 15s (attempt ${attempt}/3)...`);
          await sleep(15000);
          continue;
        }
        console.error(`  -> ERROR: No predictions for ${item.name}`);
        return false;
      }

      const imageBuffer = Buffer.from(data.predictions[0].bytesBase64Encoded, "base64");
      await sharp(imageBuffer)
        .resize(item.width, item.height, { fit: "cover" })
        .webp({ quality: 80 })
        .toFile(outputPath);

      const stat = fs.statSync(outputPath);
      console.log(`  -> Saved: ${item.name} (${(stat.size / 1024).toFixed(1)}KB)`);
      return true;
    } catch (err) {
      if (attempt < 3) {
        console.log(`  -> Error, retrying in 15s (attempt ${attempt}/3): ${err.message}`);
        await sleep(15000);
      } else {
        console.error(`  -> FAILED: ${item.name}: ${err.message}`);
        return false;
      }
    }
  }
  return false;
}

async function main() {
  const total = IMAGE_LIST.length;
  console.log(`\nRegenerating ${total} images with ${MODEL}`);
  console.log(`Fixes: 2 STEP photos -> illustration, 4 tire troubles, 4 tow-truck troubles\n`);

  let success = 0, failed = 0;
  for (let i = 0; i < total; i++) {
    const ok = await generateAndSave(IMAGE_LIST[i], i, total);
    if (ok) success++; else failed++;

    if (i < total - 1) {
      console.log("  (waiting 5s...)");
      await sleep(5000);
    }
  }

  console.log(`\nDone! ${success} succeeded, ${failed} failed out of ${total}.`);
}

main();
