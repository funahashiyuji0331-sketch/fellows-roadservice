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

const OUTPUT_DIR = path.join(__dirname, "images", "battery");

const STYLE_PREFIX =
  "Style: Flat design illustration, minimal detail, soft rounded shapes, limited color palette (white, dark gray, red as accent color only), no text, no people, clean white background, suitable for web icon use, consistent line weight throughout. Match the aspect ratio and dimensions of the original image file being replaced. ";

const IMAGE_LIST = [
  {
    name: "trouble1.webp",
    width: 800,
    height: 600,
    prompt:
      STYLE_PREFIX +
      "A car dashboard close-up view showing a dead battery warning icon illuminated on the instrument panel. Car key inserted in ignition. Overall dark/dim atmosphere suggesting the car won't start. Flat design style.",
  },
  {
    name: "trouble2.webp",
    width: 800,
    height: 600,
    prompt:
      STYLE_PREFIX +
      "A parked car seen from the front at slight angle, headlights left on glowing yellow/white, in a dark parking lot setting. A small red exclamation mark floating near the battery area under the hood. Flat design style.",
  },
  {
    name: "trouble3.webp",
    width: 800,
    height: 600,
    prompt:
      STYLE_PREFIX +
      "A hybrid car shown from the side with a transparent/cutaway view revealing two batteries - a small 12V auxiliary battery with a red X mark and a large hybrid battery. Simple EV/hybrid icon visible on the car body. Flat design style.",
  },
  {
    name: "trouble4.webp",
    width: 800,
    height: 600,
    prompt:
      STYLE_PREFIX +
      "A car covered in thin dust, parked alone, with a calendar icon showing many days passed. A battery icon with a downward arrow indicating drain/depletion floating above the hood area. Flat design style.",
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

async function generateAndSave(item, index) {
  const outputPath = path.join(OUTPUT_DIR, item.name);
  const aspectRatio = getAspectRatio(item.width, item.height);
  console.log(
    `[${index + 1}/${IMAGE_LIST.length}] Generating: ${item.name} (${aspectRatio}) ...`
  );

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt: item.prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: aspectRatio,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 429 && attempt < 3) {
          console.log(
            `  -> Rate limited, retrying in 15s (attempt ${attempt}/3)...`
          );
          await sleep(15000);
          continue;
        }
        throw new Error(`API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (!data.predictions || data.predictions.length === 0) {
        console.error(
          `  -> ERROR: No predictions in response for ${item.name}`
        );
        return;
      }

      const prediction = data.predictions[0];
      const imageBuffer = Buffer.from(prediction.bytesBase64Encoded, "base64");

      await sharp(imageBuffer)
        .resize(item.width, item.height, { fit: "cover" })
        .webp({ quality: 80 })
        .toFile(outputPath);

      const stat = fs.statSync(outputPath);
      console.log(
        `  -> Saved: ${outputPath} (${item.width}x${item.height}, ${(stat.size / 1024).toFixed(1)}KB)`
      );
      return;
    } catch (err) {
      if (attempt < 3) {
        console.log(
          `  -> Error, retrying in 10s (attempt ${attempt}/3): ${err.message}`
        );
        await sleep(10000);
      } else {
        console.error(`  -> ERROR generating ${item.name}:`, err.message);
      }
    }
  }
}

async function main() {
  console.log(`\nGenerating ${IMAGE_LIST.length} trouble images with ${MODEL}`);
  console.log(`Output: ${OUTPUT_DIR}\n`);

  for (let i = 0; i < IMAGE_LIST.length; i++) {
    await generateAndSave(IMAGE_LIST[i], i);

    if (i < IMAGE_LIST.length - 1) {
      console.log("  (waiting 5s before next request...)");
      await sleep(5000);
    }
  }

  console.log("\nDone! All 4 trouble images regenerated.");
}

main();
