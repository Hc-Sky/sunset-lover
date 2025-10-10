import { writeFile } from "fs/promises";
import { overpass } from "./overpass.js";

type OverpassTags = Record<string, string>;

type OverpassElement = {
  id: number;
  type: "node" | "way" | "relation";
  lat?: number;
  lon?: number;
  tags?: OverpassTags;
  geometry?: Array<{ lat: number; lon: number }>;
  center?: { lat: number; lon: number };
};

type Viewpoint = {
  name: string;
  type: "viewpoint" | "mountain_pass";
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  altitude?: number;
  country: "France";
  tags: string[];
  createdAt: string;
};

type ScenicRoad = {
  name: string;
  type: "road";
  center: {
    type: "Point";
    coordinates: [number, number];
  };
  lengthKm: number;
  country: "France";
  tags: string[];
  createdAt: string;
};

const SEARCH_AREA = `
[out:json][timeout:180];
area["ISO3166-1"="FR"][admin_level=2]->.searchArea;
`;

function normalizeName(base: string | undefined, fallbackPrefix: string, id: number): string {
  return base?.trim() && base.trim().length > 0 ? base.trim() : `${fallbackPrefix} ${id}`;
}

function parseAltitude(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const numeric = parseFloat(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : undefined;
}

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function haversineDistance(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);

  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_KM * c;
}

function computeLengthKm(geometry: Array<{ lat: number; lon: number }>): number {
  if (geometry.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < geometry.length; i += 1) {
    total += haversineDistance(geometry[i - 1], geometry[i]);
  }
  return total;
}

function computeCenter(element: OverpassElement): { lat: number; lon: number } | undefined {
  if (element.center) {
    return element.center;
  }
  if (element.geometry && element.geometry.length > 0) {
    const sum = element.geometry.reduce(
      (acc, point) => {
        acc.lat += point.lat;
        acc.lon += point.lon;
        return acc;
      },
      { lat: 0, lon: 0 }
    );
    return {
      lat: sum.lat / element.geometry.length,
      lon: sum.lon / element.geometry.length,
    };
  }
  return undefined;
}

export async function fetchViewpointsFR(): Promise<Viewpoint[]> {
  const query = `${SEARCH_AREA}
  node["tourism"="viewpoint"](area.searchArea);
  out body;
`;

  const response = (await overpass(query)) as { elements?: OverpassElement[] };
  const elements = response.elements ?? [];
  const createdAt = new Date().toISOString();

  return elements
    .filter((element): element is OverpassElement & { type: "node"; lat: number; lon: number } => {
      return element.type === "node" && typeof element.lat === "number" && typeof element.lon === "number";
    })
    .map((element) => {
      const name = normalizeName(element.tags?.name, "Viewpoint", element.id);
      const altitude = parseAltitude(element.tags?.ele);
      return {
        name,
        type: "viewpoint" as const,
        location: {
          type: "Point" as const,
          coordinates: [element.lon, element.lat],
        },
        ...(altitude !== undefined ? { altitude } : {}),
        country: "France" as const,
        tags: ["viewpoint"],
        createdAt,
      } satisfies Viewpoint;
    });
}

export async function fetchMountainPassesFR(): Promise<Viewpoint[]> {
  const query = `${SEARCH_AREA}
  node["mountain_pass"="yes"](area.searchArea);
  out body;
`;

  const response = (await overpass(query)) as { elements?: OverpassElement[] };
  const elements = response.elements ?? [];
  const createdAt = new Date().toISOString();

  return elements
    .filter((element): element is OverpassElement & { type: "node"; lat: number; lon: number } => {
      return element.type === "node" && typeof element.lat === "number" && typeof element.lon === "number";
    })
    .map((element) => {
      const name = normalizeName(element.tags?.name, "Mountain Pass", element.id);
      const altitude = parseAltitude(element.tags?.ele);
      return {
        name,
        type: "mountain_pass" as const,
        location: {
          type: "Point" as const,
          coordinates: [element.lon, element.lat],
        },
        ...(altitude !== undefined ? { altitude } : {}),
        country: "France" as const,
        tags: ["mountain_pass"],
        createdAt,
      } satisfies Viewpoint;
    });
}

export async function fetchScenicRoadsFR(): Promise<ScenicRoad[]> {
  const query = `${SEARCH_AREA}
  (
    way["highway"]["scenic"="yes"](area.searchArea);
    relation["route"="road"]["scenic"="yes"](area.searchArea);
  );
  out body geom center;
`;

  const response = (await overpass(query)) as { elements?: OverpassElement[] };
  const elements = response.elements ?? [];
  const createdAt = new Date().toISOString();

  return elements
    .filter((element) => element.geometry && element.geometry.length > 0)
    .map((element) => {
      const name = normalizeName(element.tags?.name, "Scenic Road", element.id);
      const geometry = element.geometry ?? [];
      const lengthKm = computeLengthKm(geometry);
      const center = computeCenter(element);

      if (!center) {
        return undefined;
      }

      return {
        name,
        type: "road" as const,
        center: {
          type: "Point" as const,
          coordinates: [center.lon, center.lat],
        },
        lengthKm,
        country: "France" as const,
        tags: ["scenic"],
        createdAt,
      } satisfies ScenicRoad;
    })
    .filter((road): road is ScenicRoad => Boolean(road));
}

export async function main(): Promise<void> {
  console.log("🚀 Starting ETL: Fetching data from Overpass API...");
  
  console.log("📍 Fetching viewpoints...");
  const viewpoints = await fetchViewpointsFR();
  console.log(`   Found ${viewpoints.length} viewpoints`);
  
  console.log("⛰️  Fetching mountain passes...");
  const passes = await fetchMountainPassesFR();
  console.log(`   Found ${passes.length} mountain passes`);
  
  console.log("🛣️  Fetching scenic roads...");
  const roads = await fetchScenicRoadsFR();
  console.log(`   Found ${roads.length} scenic roads`);

  const payload = {
    spots: [...viewpoints, ...passes],
    roads,
  };

  const outputUrl = new URL("../../../scripts/seed.generated.json", import.meta.url);

  await writeFile(outputUrl, `${JSON.stringify(payload, null, 2)}\n`, "utf-8");
  
  console.log(`\n✅ Success! Generated seed file with:`);
  console.log(`   - ${viewpoints.length} viewpoints`);
  console.log(`   - ${passes.length} mountain passes`);
  console.log(`   - ${roads.length} scenic roads`);
  console.log(`   Total: ${payload.spots.length} spots, ${payload.roads.length} roads`);
  console.log(`\n📄 Output: scripts/seed.generated.json`);
}

main().catch((error) => {
  console.error("❌ Error during ETL:", error);
  process.exit(1);
});
