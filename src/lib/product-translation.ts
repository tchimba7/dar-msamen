const DEFAULT_LIBRE_TRANSLATE_URL = "https://libretranslate.com/translate";

type ProductTextPayload = {
  shortDescription: string;
  description: string;
  rawMaterials: string;
  nutritionFacts: string;
  recommendations: string;
};

function normalizeText(value: string) {
  return value.trim();
}

async function translateWithLibreTranslate(text: string) {
  if (!text.trim()) {
    return "";
  }

  const response = await fetch(process.env.LIBRE_TRANSLATE_URL ?? DEFAULT_LIBRE_TRANSLATE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: text,
      source: "fr",
      target: "ar",
      format: "text",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`LibreTranslate request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as { translatedText?: string };
  return typeof payload.translatedText === "string" ? payload.translatedText.trim() : "";
}

export async function translateProductTextsToArabic(
  source: ProductTextPayload,
): Promise<ProductTextPayload> {
  const provider = (process.env.PRODUCT_TRANSLATION_PROVIDER ?? "none").trim().toLowerCase();
  const normalized: ProductTextPayload = {
    shortDescription: normalizeText(source.shortDescription),
    description: normalizeText(source.description),
    rawMaterials: normalizeText(source.rawMaterials),
    nutritionFacts: normalizeText(source.nutritionFacts),
    recommendations: normalizeText(source.recommendations),
  };

  if (provider !== "libretranslate") {
    return normalized;
  }

  try {
    const [shortDescription, description, rawMaterials, nutritionFacts, recommendations] =
      await Promise.all([
        translateWithLibreTranslate(normalized.shortDescription),
        translateWithLibreTranslate(normalized.description),
        translateWithLibreTranslate(normalized.rawMaterials),
        translateWithLibreTranslate(normalized.nutritionFacts),
        translateWithLibreTranslate(normalized.recommendations),
      ]);

    return {
      shortDescription,
      description,
      rawMaterials,
      nutritionFacts,
      recommendations,
    };
  } catch {
    // If translation provider is unavailable, keep French text as fallback content.
    return normalized;
  }
}
