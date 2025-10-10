import { readFile, writeFile } from "fs/promises";
import axios from "axios";

type PointGeometry = {
  type: "Point";
  coordinates: [number, number];
};

type Spot = {
  name: string;
  type: string;
  location: PointGeometry;
  altitude?: number;
  country: string;
  tags: string[];
  createdAt: string;
};

type ScenicRoad = {
  name: string;
  type: string;
  center: PointGeometry;
  lengthKm: number;
  country: string;
  tags: string[];
  createdAt: string;
};

type SeedData = {
  spots: Spot[];
  roads: ScenicRoad[];
};

const DEFAULT_ENDPOINT = "https://api.opentopodata.org/v1/eudem25m";
const BATCH_SIZE = 100; // Augmenté de 50 à 100
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 5_000;
const BATCH_DELAY_MS = 500; // Réduit de 1500ms à 500ms

function isRetryableStatus(status: number | undefined): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchElevations(
  endpoint: string,
  locationsParam: string,
  attempt: number = 0
): Promise<Array<{ elevation?: number | null }>> {
  try {
    const { data } = await axios.get(endpoint, {
      params: { locations: locationsParam },
      timeout: 30_000,
    });

    return data?.results ?? [];
  } catch (error) {
    const status: number | undefined = (error as { response?: { status?: number } }).response?.status;
    if (attempt >= MAX_RETRIES || !isRetryableStatus(status)) {
      throw error;
    }

    const delayMs = BASE_DELAY_MS * (attempt + 1);
    await delay(delayMs);
    return fetchElevations(endpoint, locationsParam, attempt + 1);
  }
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export async function enrichElevation(endpoint: string = DEFAULT_ENDPOINT): Promise<void> {
  console.log("🏔️  Starting altitude enrichment...");
  
  const inputUrl = new URL("../../../scripts/seed.generated.json", import.meta.url);
  const raw = await readFile(inputUrl, "utf-8");
  const seed: SeedData = JSON.parse(raw);

  console.log(`📊 Total spots: ${seed.spots.length}`);
  
  const spotsWithoutAltitude = seed.spots
    .map((spot, index) => ({ spot, index }))
    .filter(({ spot }) => typeof spot.altitude !== "number" || Number.isNaN(spot.altitude));

  console.log(`❓ Spots without altitude: ${spotsWithoutAltitude.length}`);
  console.log(`✅ Spots with altitude: ${seed.spots.length - spotsWithoutAltitude.length}`);

  if (spotsWithoutAltitude.length === 0) {
    console.log("✨ All spots already have altitude data!");
    return;
  }

  const batches = chunk(spotsWithoutAltitude, BATCH_SIZE);
  console.log(`\n🔄 Processing ${batches.length} batches (${BATCH_SIZE} spots per batch)...`);
  console.log(`⏱️  Estimated time: ~${Math.ceil((batches.length * BATCH_DELAY_MS) / 1000 / 60)} minutes\n`);

  let enrichedCount = 0;

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
    const batch = batches[batchIndex];
    const locations = batch
      .map(({ spot }) => {
        const [lon, lat] = spot.location.coordinates;
        return `${lat},${lon}`;
      })
      .join("|");

    try {
      const results = await fetchElevations(endpoint, locations);

      batch.forEach(({ index }, resultIndex) => {
        const elevation = results[resultIndex]?.elevation;
        if (typeof elevation === "number" && Number.isFinite(elevation)) {
          seed.spots[index].altitude = elevation;
          enrichedCount++;
        }
      });

      const progress = ((batchIndex + 1) / batches.length * 100).toFixed(1);
      console.log(`[${batchIndex + 1}/${batches.length}] ${progress}% - Enriched ${enrichedCount} spots so far`);

    } catch (error) {
      console.error(`⚠️  Error in batch ${batchIndex + 1}:`, error);
    }

    if (batchIndex < batches.length - 1) {
      await delay(BATCH_DELAY_MS);
    }
  }

  await writeFile(inputUrl, `${JSON.stringify(seed, null, 2)}\n`, "utf-8");
  
  console.log(`\n✅ Enrichment complete!`);
  console.log(`   - Successfully enriched: ${enrichedCount} spots`);
  console.log(`   - Failed to enrich: ${spotsWithoutAltitude.length - enrichedCount} spots`);
  console.log(`\n📄 Updated: scripts/seed.generated.json`);
}

await enrichElevation().catch((error) => {
  console.error("❌ Error during altitude enrichment:", error);
  process.exit(1);
});
