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
          const objects = Array.isArray(data) ? data : [data];

          for (const obj of objects) {
            if (
              obj["@type"] === "Product" ||
              obj["@type"]?.includes("Product")
            ) {
              // Extraction from Offers
              if (obj.offers) {
                const offer = Array.isArray(obj.offers)
                  ? obj.offers[0]
                  : obj.offers;

                if (offer.price && !price) {
                  price =
                    typeof offer.price === "string"
                      ? parseFloat(offer.price.replace(/[^0-9.]/g, ""))
                      : offer.price;
                }

                if (offer.availability && !availability) {
                  const availValue = String(offer.availability).toLowerCase();
                  if (availValue.includes("instock")) {
                    availability = "In stock";
                  } else if (availValue.includes("outofstock")) {
                    availability = "Out of stock";
                  }
                }
              }
              if (obj.name && !title) title = obj.name;
            }
          }
          if (price && availability && title) break;
        } catch (e) {
          // Ignore parse errors
        }
      }

      // 2. Meta Tags Availability
      if (!availability) {
        const availMeta =
          root.querySelector('meta[property="og:availability"]') ||
          root.querySelector('meta[name="availability"]');
        if (availMeta) {
          const content =
            availMeta.getAttribute("content")?.toLowerCase() || "";
          if (content.includes("instock") || content.includes("available")) {
            availability = "In stock";
          } else if (
            content.includes("oos") ||
            content.includes("out of stock")
          ) {
            availability = "Out of stock";
          }
        }
      }

      // If price not found via JSON-LD, try selectors
      if (!price) {
        for (const selector of priceSelectors) {
          const element = root.querySelector(selector);
          if (element) {
            let rawPrice: string | undefined;

            if (selector === ".a-price-whole") {
              const fraction = root.querySelector(".a-price-fraction");
              rawPrice = element.text + (fraction ? "." + fraction.text : "");
            } else if (selector.startsWith("meta")) {
              rawPrice = element.getAttribute("content");
            } else {
              rawPrice = element.text;
            }

            if (rawPrice) {
              let cleanedPrice = rawPrice.replace(/[^0-9.,]/g, "").trim();
              if (!cleanedPrice) continue;

              if (cleanedPrice.includes(".") && cleanedPrice.includes(",")) {
                if (
                  cleanedPrice.lastIndexOf(".") > cleanedPrice.lastIndexOf(",")
                ) {
                  cleanedPrice = cleanedPrice.replace(/,/g, "");
                } else {
                  cleanedPrice = cleanedPrice
                    .replace(/\./g, "")
                    .replace(",", ".");
                }
              } else if (cleanedPrice.includes(",")) {
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

      // Title selectors
      const titleSelectors = [
        "#productTitle",
        'meta[property="og:title"]',
        "h1",
        ".ui-pdp-title",
        '[itemprop="name"]',
      ];

      if (!title) {
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
      }

      // 3. Specific Availability Selectors
      if (!availability) {
        const stockSelectors = [
          "#availability", // Amazon
          "#add-to-cart-button", // Amazon indicator
          ".ui-pdp-stock-information__title", // ML Catalog
          ".ui-pdp-buybox__quantity__available",
          ".stock-status",
          ".out-of-stock",
          "#outOfStock",
        ];

        for (const selector of stockSelectors) {
          const element = root.querySelector(selector);
          if (element) {
            if (selector === "#add-to-cart-button") {
              availability = "In stock";
              break;
            }

            const text = element.text.toLowerCase();
            if (
              text.includes("disponible") ||
              text.includes("in stock") ||
              text.includes("disponibles")
            ) {
              availability = "In stock";
              break;
            } else if (
              text.includes("agotado") ||
              text.includes("out of stock") ||
              text.includes("sin stock") ||
              text.includes("no disponible") ||
              text.includes("unavailable")
            ) {
              availability = "Out of stock";
              break;
            }
          }
        }
      }

      // 4. Fallback Keyword Search (Last resort, refined)
      if (!availability) {
        const bodyText = root.text.toLowerCase();

        // Check positive indicators first to avoid generic "no disponible" conflicts
        const inStockKeywords = [
          "stock disponible",
          "hay stock",
          "en stock",
          "disponible",
        ];
        const outOfStockKeywords = [
          "agotado",
          "no disponible",
          "sin stock",
          "out of stock",
        ];

        if (inStockKeywords.some((kw) => bodyText.includes(kw))) {
          availability = "In stock";
        } else if (outOfStockKeywords.some((kw) => bodyText.includes(kw))) {
          availability = "Out of stock";
        }
      }

      return { title, price, availability };
    } catch (error) {
      console.error("Error scraping product:", error);
      return { title: null, price: null, availability: null };
    }
  }
}
