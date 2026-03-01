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

const OUTPUT_DIR = path.join(__dirname, "images", "tire");

const IMAGE_LIST = [
  {
    name: "hero.webp",
    width: 1600,
    height: 900,
    prompt:
      "A dynamic, realistic photo of a professional Japanese roadside mechanic in a navy uniform safely changing a flat tire on a highway shoulder at dusk. Warning flares are lit. Cinematic lighting, highly reliable and fast response atmosphere, 8k, photorealistic.",
  },
  {
    name: "trouble1.webp",
    width: 800,
    height: 600,
    prompt:
      "A close-up of a completely shredded and burst car tire on the side of a Japanese road. Daytime, realistic, highly detailed, showing a dangerous breakdown situation.",
  },
  {
    name: "trouble2.webp",
    width: 800,
    height: 600,
    prompt:
      "A car with its front tire flat and slightly stuck against a concrete curb on a narrow Japanese street. Daytime, realistic roadside trouble.",
  },
  {
    name: "trouble3.webp",
    width: 800,
    height: 600,
    prompt:
      "A confused driver looking at a modern car's trunk showing an empty space and a tire repair kit instead of a spare tire. Japanese street, daytime, realistic.",
  },
  {
    name: "trouble4.webp",
    width: 800,
    height: 600,
    prompt:
      "A close-up of a large metal nail stuck deep into a car tire tread, causing a flat tire. Highly detailed, realistic, daytime.",
  },
  {
    name: "reason1.webp",
    width: 800,
    height: 600,
    prompt:
      "A professional Japanese mechanic running towards a parked car with a flat tire, carrying a hydraulic jack and tools. Dynamic angle, fast and urgent, daytime, realistic.",
  },
  {
    name: "reason2.webp",
    width: 800,
    height: 600,
    prompt:
      "A reliable Japanese mechanic skillfully removing a flat tire using a cross wrench on the roadside. Professional work, trustworthy, clear daytime, realistic.",
  },
  {
    name: "reason3.webp",
    width: 800,
    height: 600,
    prompt:
      "A friendly Japanese roadside mechanic showing a transparent quote on a digital tablet to a relieved customer. Trustworthy customer service, daytime, realistic.",
  },
  {
    name: "step1.webp",
    width: 800,
    height: 600,
    prompt:
      "A professional Japanese customer support operator with a headset calmly answering an emergency call. Clean office background, reliable atmosphere, realistic.",
  },
  {
    name: "step2.webp",
    width: 800,
    height: 600,
    prompt:
      "A tow truck arriving at a breakdown scene on a Japanese road. Safety cones are being placed around the car with a flat tire. Realistic, highly detailed.",
  },
  {
    name: "step3.webp",
    width: 800,
    height: 600,
    prompt:
      "A mechanic securely tightening the lug nuts on a newly installed spare tire on the roadside. High quality, professional work, realistic, daytime.",
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
  console.log(`[${index + 1}/${IMAGE_LIST.length}] Generating: ${item.name} (${aspectRatio}) ...`);

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
        if (response.status === 400 && attempt < 3) {
          console.log(`  -> Rate limited, retrying in 15s (attempt ${attempt}/3)...`);
          await sleep(15000);
          continue;
        }
        throw new Error(`API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (!data.predictions || data.predictions.length === 0) {
        console.error(`  -> ERROR: No predictions in response for ${item.name}`);
        return;
      }

      const prediction = data.predictions[0];
      const imageBuffer = Buffer.from(prediction.bytesBase64Encoded, "base64");

      await sharp(imageBuffer)
        .resize(item.width, item.height, { fit: "cover" })
        .webp({ quality: 80 })
        .toFile(outputPath);

      console.log(`  -> Saved: ${outputPath} (${item.width}x${item.height})`);
      return;
    } catch (err) {
      if (attempt < 3) {
        console.log(`  -> Error, retrying in 10s (attempt ${attempt}/3): ${err.message}`);
        await sleep(10000);
      } else {
        console.error(`  -> ERROR generating ${item.name}:`, err.message);
      }
    }
  }
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`\nGenerating ${IMAGE_LIST.length} images with ${MODEL}`);
  console.log(`Output: ${OUTPUT_DIR}\n`);

  for (let i = 0; i < IMAGE_LIST.length; i++) {
    await generateAndSave(IMAGE_LIST[i], i);

    if (i < IMAGE_LIST.length - 1) {
      console.log("  (waiting 5s before next request...)");
      await sleep(5000);
    }
  }

  console.log("\nDone!");
}

main();
