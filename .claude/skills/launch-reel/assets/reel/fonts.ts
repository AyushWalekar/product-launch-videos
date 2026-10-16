// Load the product's font here (match the site: check `brand.bodyFont` from capture-flow / capture output).
// Any family from @remotion/google-fonts works: import { loadFont } from "@remotion/google-fonts/<Family>".
// For system-font products, skip loading and set brand.font to the CSS stack instead.
import { loadFont } from "@remotion/google-fonts/Inter";

loadFont("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });
