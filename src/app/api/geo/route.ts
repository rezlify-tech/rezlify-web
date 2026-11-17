import { NextResponse, type NextRequest } from "next/server";
import { slugify } from "@/lib/mock/locations";

/**
 * GET /api/geo : a best guess of the visitor's Nigerian state, from their internet connection.
 * On Vercel the location comes from request headers (no outside service, nothing stored).
 * Locally there's no location, so set GEO_DEV_REGION=ON (a state code) in .env.local to test.
 * Returns { state: "lagos" } or { state: null } when we can't tell.
 */

// ISO 3166-2:NG codes → state names (as in our list).
const REGIONS: Record<string, string> = {
  AB: "Abia", AD: "Adamawa", AK: "Akwa Ibom", AN: "Anambra", BA: "Bauchi", BY: "Bayelsa",
  BE: "Benue", BO: "Borno", CR: "Cross River", DE: "Delta", EB: "Ebonyi", ED: "Edo",
  EK: "Ekiti", EN: "Enugu", FC: "FCT Abuja", GO: "Gombe", IM: "Imo", JI: "Jigawa",
  KD: "Kaduna", KN: "Kano", KT: "Katsina", KE: "Kebbi", KO: "Kogi", KW: "Kwara",
  LA: "Lagos", NA: "Nasarawa", NI: "Niger", OG: "Ogun", ON: "Ondo", OS: "Osun",
  OY: "Oyo", PL: "Plateau", RI: "Rivers", SO: "Sokoto", TA: "Taraba", YO: "Yobe", ZA: "Zamfara",
};

export function GET(request: NextRequest) {
  const devRegion = process.env.NODE_ENV !== "production" ? process.env.GEO_DEV_REGION : undefined;
  const country = devRegion ? "NG" : request.headers.get("x-vercel-ip-country");
  const region = (devRegion ?? request.headers.get("x-vercel-ip-country-region") ?? "").toUpperCase();

  const name = country === "NG" ? REGIONS[region] : undefined;

  return NextResponse.json(
    { state: name ? slugify(name) : null },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
