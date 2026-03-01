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

const IMAGE_LIST = [
  {
    name: "hero.webp",
    width: 1600,
    height: 900,
    prompt:
      "A dynamic, realistic photo of a professional Japanese roadside mechanic in a navy uniform performing a jump start on a car battery at night. Sparks and cinematic lighting, highly reliable and fast response atmosphere, 8k, photorealistic.",
  },
  {
    name: "trouble1.webp",
    width: 800,
    height: 600,
    prompt:
      "A frustrated driver sitting in the driver's seat of a car, trying to turn the ignition key but the engine won't start. Dashboard lights are dim. Daytime, realistic.",
  },
  {
    name: "trouble2.webp",
    width: 800,
    height: 600,
    prompt:
      "A car parked on a Japanese street at dusk with its headlights and interior dome light accidentally left on. Realistic, high quality.",
  },
  {
    name: "trouble3.webp",
    width: 800,
    height: 600,
    prompt:
      "A close-up of a Japanese mechanic safely connecting jump leads to the rescue terminal of a modern hybrid car's engine bay. Professional, highly detailed, daytime.",
  },
  {
    name: "trouble4.webp",
    width: 800,
    height: 600,
    prompt:
      "A slightly dusty car parked in a residential garage. A mechanic is inspecting the old battery under the hood. Realistic, daytime.",
  },
  {
    name: "reason1.webp",
    width: 800,
    height: 600,
    prompt:
      "A reliable Japanese mechanic running towards a stranded car with a portable jump starter battery pack in hand. Dynamic, fast, daytime, realistic.",
  },
  {
    name: "reason2.webp",
    width: 800,
    height: 600,
    prompt:
      "A professional Japanese mechanic working carefully on the electrical system of a modern car. Safe and trustworthy work, daytime, realistic.",
  },
  {
    name: "reason3.webp",
    width: 800,
    height: 600,
    prompt:
      "A friendly Japanese roadside mechanic showing a transparent quote on a digital tablet to a relieved customer next to an open car hood. Trustworthy customer service, daytime.",
  },
  {
    name: "step1.webp",
    width: 800,
    height: 600,
    prompt:
      "A professional Japanese customer support operator with a headset calmly answering an emergency call. Clean office background, realistic.",
  },
  {
    name: "step2.webp",
    width: 800,
    height: 600,
    prompt:
      "A tow truck arriving at a breakdown scene on a Japanese road. Realistic, highly detailed.",
  },
  {
    name: "step3.webp",
    width: 800,
    height: 600,
    prompt:
      "A mechanic successfully jump-starting a car engine. The customer looks happy and relieved. Professional work, realistic, daytime.",
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
