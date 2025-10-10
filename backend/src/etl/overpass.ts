import axios from "axios";

const DEFAULT_OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";
const DEFAULT_MAX_RETRIES = 5;
const BASE_DELAY_MS = 15_000;

type OverpassResponse = unknown;

function isRetryableStatus(status: number | undefined): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function overpass(
  query: string,
  endpoint: string = DEFAULT_OVERPASS_ENDPOINT,
  options?: { maxRetries?: number }
): Promise<OverpassResponse> {
  const maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;
  const body = `data=${encodeURIComponent(query)}`;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      const response = await axios.post(endpoint, body, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout: 180_000,
      });

      return response.data;
    } catch (error) {
      const status: number | undefined = (error as { response?: { status?: number } }).response?.status;

      if (attempt === maxRetries || !isRetryableStatus(status)) {
        throw error;
      }

      const delayMs = BASE_DELAY_MS * (attempt + 1);
      await delay(delayMs);
    }
  }

  throw new Error("Failed to fetch data from Overpass API after retries");
}
