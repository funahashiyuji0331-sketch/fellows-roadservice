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

const OUTPUT_DIR = path.join(__dirname, "images", "rekker");

const IMAGE_LIST = [
  {
    name: "hero.webp",
    width: 1600,
    height: 900,
    prompt:
      "A dynamic, realistic photo of a professional flatbed tow truck driving quickly on a Japanese city street at night. The yellow rotating warning lights are on, indicating an emergency response. Cinematic lighting, high speed, reliable, 8k resolution, photorealistic.",
  },
  {
    name: "trouble1.webp",
    width: 800,
    height: 600,
    prompt:
      "A realistic photo of a damaged car from a traffic accident safely being loaded onto a flatbed tow truck in Japan, daytime, professional towing service, highly detailed, realistic.",
  },
  {
    name: "trouble2.webp",
    width: 800,
    height: 600,
    prompt:
      "A realistic photo of a broken-down car parked safely on the shoulder of a Japanese road with its hood open and hazard lights blinking, daytime, waiting for a tow truck.",
  },
  {
    name: "trouble3.webp",
    width: 800,
    height: 600,
    prompt:
      "A car with one of its front wheels stuck in a roadside ditch in a Japanese suburban street. A tow truck mechanic is carefully preparing a winch cable to rescue it, daytime, realistic.",
  },
  {
    name: "trouble4.webp",
    width: 800,
    height: 600,
    prompt:
      "A broken-down car stuck inside a dimly lit modern underground parking garage in Japan. A mechanic in a navy uniform is inspecting the car, realistic, highly detailed.",
  },
  {
    name: "reason1.webp",
    width: 800,
    height: 600,
    prompt:
      "A reliable Japanese tow truck mechanic in a clean navy uniform running towards a broken-down car, showing speed and urgency. Daytime, Japanese street, dynamic angle, realistic.",
  },
  {
    name: "reason2.webp",
    width: 800,
    height: 600,
    prompt:
      "A friendly Japanese mechanic explaining a quote on a digital tablet to a relieved car owner next to a tow truck. Clear daytime, trustworthy, professional customer service, realistic.",
  },
  {
    name: "reason3.webp",
    width: 800,
    height: 600,
    prompt:
      "A customized lowered sports car being very carefully loaded onto a full-flat tow truck using wooden ramps. Highly professional and precise towing work, Japanese street, realistic.",
  },
  {
    name: "step1.webp",
    width: 800,
    height: 600,
    prompt:
      "A close-up of a professional Japanese customer service operator wearing a headset, looking at a computer screen and answering an emergency roadside assistance call. Reliable and calm atmosphere, realistic.",
  },
  {
    name: "step2.webp",
    width: 800,
    height: 600,
    prompt:
      "View from inside the cabin of a tow truck, the driver's hands on the steering wheel, driving purposefully to a rescue location in Japan. Realistic, professional.",
  },
  {
    name: "step3.webp",
    width: 800,
    height: 600,
    prompt:
      "A completely loaded car secured with bright yellow wheel straps on a flatbed tow truck. The truck is ready to depart. Highly detailed, professional towing safety, Japanese road, realistic.",
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
      throw new Error(`API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (!data.predictions || data.predictions.length === 0) {
      console.error(`  -> ERROR: No predictions in response for ${item.name}`);
      console.error("     Response:", JSON.stringify(data).substring(0, 500));
      return;
    }

    const prediction = data.predictions[0];
    const imageBuffer = Buffer.from(prediction.bytesBase64Encoded, "base64");

    await sharp(imageBuffer)
      .resize(item.width, item.height, { fit: "cover" })
      .webp({ quality: 80 })
      .toFile(outputPath);

    console.log(`  -> Saved: ${outputPath} (${item.width}x${item.height})`);
  } catch (err) {
    console.error(`  -> ERROR generating ${item.name}:`, err.message);
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

    // Wait between requests to avoid rate limiting
    if (i < IMAGE_LIST.length - 1) {
      console.log("  (waiting 5s before next request...)");
      await sleep(5000);
    }
  }

  console.log("\nDone!");
}

main();
