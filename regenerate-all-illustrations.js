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
  "Style: Flat design illustration, minimal detail, soft rounded shapes, limited color palette (white, dark gray, red as accent color only), no text, no people, clean white background, suitable for web icon use, consistent line weight throughout. 800x600 pixels, 4:3 aspect ratio. ";

const IMAGE_LIST = [
  // ── TIRE TROUBLE (Task 2) ──
  {
    name: "images/tire/trouble1.webp",
    width: 800, height: 600,
    prompt: STYLE + "A car tire seen from the side, visibly burst and shredded with rubber pieces flying outward. Red warning triangle icon nearby. Road surface visible below. Flat design style.",
  },
  {
    name: "images/tire/trouble2.webp",
    width: 800, height: 600,
    prompt: STYLE + "A car wheel hitting a curb/kerb stone at an angle, with a visible gash on the tire sidewall. Small red impact lines showing the collision point. Simple road and curb. Flat design style.",
  },
  {
    name: "images/tire/trouble3.webp",
    width: 800, height: 600,
    prompt: STYLE + "A car trunk/boot open showing an empty spare tire compartment with a red X mark where the spare should be. A small tire repair kit box sits nearby with a red question mark above it. Flat design style.",
  },
  {
    name: "images/tire/trouble4.webp",
    width: 800, height: 600,
    prompt: STYLE + "A close-up of a car tire with a nail/screw embedded in the tread. Air is escaping shown by small lines. A red downward arrow icon indicating pressure loss floating above. Flat design style.",
  },

  // ── TOW-TRUCK TROUBLE (Task 2) ──
  {
    name: "images/tow-truck/trouble1.webp",
    width: 800, height: 600,
    prompt: STYLE + "A car with visible front-end collision damage - crumpled hood and bumper. Red warning hazard triangle placed behind the car. Debris scattered on the road. Flat design style.",
  },
  {
    name: "images/tow-truck/trouble2.webp",
    width: 800, height: 600,
    prompt: STYLE + "A car stopped on a road with its hood open, steam/smoke rising from the engine. A red engine warning icon floating above the dashboard area. Flat design style.",
  },
  {
    name: "images/tow-truck/trouble3.webp",
    width: 800, height: 600,
    prompt: STYLE + "A car with one front wheel dropped into a roadside ditch/gutter, tilted at an angle. Red exclamation mark floating above. Simple road edge and drainage ditch. Flat design style.",
  },
  {
    name: "images/tow-truck/trouble4.webp",
    width: 800, height: 600,
    prompt: STYLE + "A car stuck inside a low-ceiling underground parking garage, shown from the side. Height restriction sign visible. A red prohibition/warning icon near the ceiling. Flat design style.",
  },

  // ── BATTERY REASON (Task 3) ──
  {
    name: "images/battery/reason1.webp",
    width: 800, height: 600,
    prompt: STYLE + "A large stopwatch/timer showing 10 minutes with a small roadside service van icon speeding with motion lines. Red accent on the timer hand. Flat design style.",
  },
  {
    name: "images/battery/reason2.webp",
    width: 800, height: 600,
    prompt: STYLE + "Three car silhouettes in a row - a sedan, a hybrid car with EV badge, and a truck. All with a red checkmark above each. Representing all vehicle types supported. Flat design style.",
  },
  {
    name: "images/battery/reason3.webp",
    width: 800, height: 600,
    prompt: STYLE + "A clipboard or receipt document with a price breakdown list and a large red checkmark/circle stamp of approval. Clean and transparent pricing concept. Flat design style.",
  },

  // ── BATTERY STEP (Task 3) ──
  {
    name: "images/battery/step1.webp",
    width: 800, height: 600,
    prompt: STYLE + "A smartphone with an incoming call screen displayed, next to a speech bubble containing a car and battery icon. Red phone icon accent. Representing emergency phone consultation. Flat design style.",
  },
  {
    name: "images/battery/step2.webp",
    width: 800, height: 600,
    prompt: STYLE + "A roadside service van driving fast on a road with speed/motion lines behind it. A red location pin marker ahead showing the destination. Flat design style.",
  },

  // ── TIRE REASON (Task 3) ──
  {
    name: "images/tire/reason1.webp",
    width: 800, height: 600,
    prompt: STYLE + "A large stopwatch/timer showing 10 minutes with a small roadside service van icon speeding toward a car with a flat tire. Red accent on the timer hand. Flat design style.",
  },
  {
    name: "images/tire/reason2.webp",
    width: 800, height: 600,
    prompt: STYLE + "A car jack lifting a car, with a wrench and a spare tire ready nearby. Red accent on the jack handle. Representing on-site tire repair priority. Flat design style.",
  },
  {
    name: "images/tire/reason3.webp",
    width: 800, height: 600,
    prompt: STYLE + "A clipboard or receipt document with a price breakdown list and a large red checkmark/circle stamp of approval. Clean and transparent pricing concept. Flat design style.",
  },

  // ── TIRE STEP (Task 3) ──
  {
    name: "images/tire/step1.webp",
    width: 800, height: 600,
    prompt: STYLE + "A smartphone with an incoming call screen displayed, next to a speech bubble containing a car and tire icon. Red phone icon accent. Representing emergency phone consultation. Flat design style.",
  },
  {
    name: "images/tire/step2.webp",
    width: 800, height: 600,
    prompt: STYLE + "A roadside service van driving fast on a road with speed/motion lines behind it. A red location pin marker ahead and a safety triangle icon. Flat design style.",
  },
  {
    name: "images/tire/step3.webp",
    width: 800, height: 600,
    prompt: STYLE + "A car raised on a jack with one wheel removed and a spare tire being placed. A red checkmark icon above indicating completion. Flat design style.",
  },

  // ── TOW-TRUCK REASON (Task 3) ──
  {
    name: "images/tow-truck/reason1.webp",
    width: 800, height: 600,
    prompt: STYLE + "A large stopwatch/timer showing 10 minutes with a flatbed tow truck icon speeding with motion lines. Red accent on the timer hand. Flat design style.",
  },
  {
    name: "images/tow-truck/reason2.webp",
    width: 800, height: 600,
    prompt: STYLE + "A clipboard or receipt document with a price breakdown showing base fee plus distance cost, with a large red checkmark/circle stamp. Transparent pricing concept. Flat design style.",
  },
  {
    name: "images/tow-truck/reason3.webp",
    width: 800, height: 600,
    prompt: STYLE + "A flatbed tow truck navigating through a narrow street between buildings. A lowered/slammed car icon with a red checkmark showing it can be handled. Special situation capability concept. Flat design style.",
  },

  // ── TOW-TRUCK STEP (Task 3) ──
  {
    name: "images/tow-truck/step1.webp",
    width: 800, height: 600,
    prompt: STYLE + "A smartphone with an incoming call screen displayed, next to a speech bubble containing a damaged car icon. Red phone icon accent. Representing emergency phone consultation. Flat design style.",
  },
  {
    name: "images/tow-truck/step3.webp",
    width: 800, height: 600,
    prompt: STYLE + "A flatbed tow truck with a car safely loaded on its bed, driving on a road toward a destination pin marker. Red accent on the destination pin. Flat design style.",
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
  console.log(`\nGenerating ${total} images with ${MODEL}`);
  console.log(`Style: Flat design, white/dark gray/red, no people\n`);

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
