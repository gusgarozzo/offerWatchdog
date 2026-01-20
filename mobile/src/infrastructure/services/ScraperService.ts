import { parse } from "node-html-parser";

export interface ScrapedProduct {
  title: string | null;
  price: number | null;
  availability: string | null;
}

export class ScraperService {
  async scrape(url: string): Promise<ScrapedProduct> {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });
      const html = await response.text();
      const root = parse(html);

      let price: number | null = null;
      let title: string | null = null;
      let availability: string | null = null;

      // Price selectors (including Amazon & improved globals)
      const priceSelectors = [
        ".a-price-whole", // Amazon whole
        ".a-offscreen", // Amazon offscreen (full price)
        "#priceblock_ourprice", // Old Amazon
        ".apexPriceToPay", // New Amazon
        '[itemprop="price"]',
        'meta[property="og:price:amount"]',
        'meta[itemprop="price"]',
        ".andes-money-amount__fraction", // Mercado Libre
        ".ui-pdp-price__second-line .ui-pdp-price__part",
        ".price",
        ".current-price",
        ".product-price",
      ];

      const jsonLdElements = root.querySelectorAll(
        'script[type="application/ld+json"]',
      );
      for (const script of jsonLdElements) {
        try {
          const data = JSON.parse(script.text);
          // Handle both single object and array of objects
          const objects = Array.isArray(data) ? data : [data];

          for (const obj of objects) {
            if (
              obj["@type"] === "Product" ||
              obj["@type"]?.includes("Product")
            ) {
              if (obj.offers) {
                const offer = Array.isArray(obj.offers)
                  ? obj.offers[0]
                  : obj.offers;
                if (offer.price) {
                  price =
                    typeof offer.price === "string"
                      ? parseFloat(offer.price.replace(/[^0-9.]/g, ""))
                      : offer.price;
                }
              }
              if (obj.name && !title) title = obj.name;
              if (price) break;
            }
          }
          if (price) break;
        } catch (e) {
          // Ignore parse errors for individual scripts
        }
      }

      // If price not found via JSON-LD, try selectors
      if (!price) {
        for (const selector of priceSelectors) {
          const element = root.querySelector(selector);
          if (element) {
            let rawPrice: string | undefined;

            if (selector === ".a-price-whole") {
              // Special handling for Amazon: whole + fraction
              const fraction = root.querySelector(".a-price-fraction");
              rawPrice = element.text + (fraction ? "." + fraction.text : "");
            } else if (selector.startsWith("meta")) {
              rawPrice = element.getAttribute("content");
            } else {
              rawPrice = element.text;
            }

            if (rawPrice) {
              let cleanedPrice = rawPrice.replace(/[^0-9.,]/g, "").trim();
              if (!cleanedPrice) {
                // Try next selector if this one gave us an empty string after cleaning
                continue;
              }

              // Handle European/Latin American format (dots for thousands, comma for decimal)
              // or American format (commas for thousands, dot for decimal)
              if (cleanedPrice.includes(".") && cleanedPrice.includes(",")) {
                if (
                  cleanedPrice.lastIndexOf(".") > cleanedPrice.lastIndexOf(",")
                ) {
                  // Thousands: , Decimal: . (1,234.56)
                  cleanedPrice = cleanedPrice.replace(/,/g, "");
                } else {
                  // Thousands: . Decimal: , (1.234,56)
                  cleanedPrice = cleanedPrice
                    .replace(/\./g, "")
                    .replace(",", ".");
                }
              } else if (cleanedPrice.includes(",")) {
                // Assume comma is decimal if only one comma exists and no dot
                // Note: This can be ambiguous for thousands separator in some locales,
                // but for prices it usually works better as decimal.
                cleanedPrice = cleanedPrice.replace(",", ".");
              }

              const parsedPrice = parseFloat(cleanedPrice);
              if (!isNaN(parsedPrice)) {
                price = Number(parsedPrice.toFixed(2));
                break;
              }
            }
          }
        }
      }

      // Title selectors (including Amazon)
      const titleSelectors = [
        "#productTitle", // Amazon
        'meta[property="og:title"]',
        "h1",
        ".ui-pdp-title",
        '[itemprop="name"]',
      ];

      for (const selector of titleSelectors) {
        const element = root.querySelector(selector);
        if (element) {
          if (selector.startsWith("meta")) {
            title = element.getAttribute("content") || null;
          } else {
            title = element.text.trim() || null;
          }
          if (title) break;
        }
      }

      // Availability (Simplified keywords)
      const inStockKeywords = [
        "in stock",
        "disponible",
        "en stock",
        "stock disponible",
        "hay stock",
      ];
      const outOfStockKeywords = [
        "out of stock",
        "agotado",
        "sin stock",
        "no disponible",
        "sold out",
      ];

      const bodyText = root.text.toLowerCase();

      if (outOfStockKeywords.some((kw) => bodyText.includes(kw))) {
        availability = "Out of stock";
      } else if (inStockKeywords.some((kw) => bodyText.includes(kw))) {
        availability = "In stock";
      }

      return { title, price, availability };
    } catch (error) {
      console.error("Error scraping product:", error);
      return { title: null, price: null, availability: null };
    }
  }
}
