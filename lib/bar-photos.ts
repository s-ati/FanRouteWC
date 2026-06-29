// AUTO-GENERATED: real Google Maps photos for bars AND watch-party venues,
// downloaded once and self-hosted under public/images/{bars,venues}/ so they
// never depend on Google's short-lived signed URLs (which 403 after a few
// weeks). Keyed by venue id. Regenerate with scripts/download-bar-photos.py
// (bars) / scripts/download-venue-photos.py (venues) then this generator.

export const BAR_PHOTOS: Record<string, string> = {
  "1920bar": "/images/bars/1920bar.jpg",
  "abbey-tavern": "/images/bars/abbey-tavern.jpg",
  "ace-s": "/images/bars/ace-s.jpg",
  "bartlett-hall": "/images/bars/bartlett-hall.jpg",
  "benders-bar-grill": "/images/bars/benders-bar-grill.jpg",
  "bissap-baobab": "/images/bars/bissap-baobab.jpg",
  "bluestone-lane-sf": "/images/bars/bluestone-lane-sf.jpg",
  "bus-stop-saloon": "/images/bars/bus-stop-saloon.jpg",
  "buzzworks": "/images/bars/buzzworks.jpg",
  "cafe-st-jorge": "/images/bars/cafe-st-jorge.jpg",
  "candlestick-park-sports-bar": "/images/bars/candlestick-park-sports-bar.jpg",
  "chief-sullivans": "/images/bars/chief-sullivans.jpg",
  "chieftain-irish-pub": "/images/bars/chieftain-irish-pub.jpg",
  "danny-coyles": "/images/bars/danny-coyles.jpg",
  "dogpatch-saloon": "/images/bars/dogpatch-saloon.jpg",
  "dubliner": "/images/bars/dubliner.jpg",
  "el-farolito-bar": "/images/bars/el-farolito-bar.png",
  "final-final": "/images/bars/final-final.jpg",
  "gold-club-sf": "/images/bars/gold-club-sf.png",
  "grubstake-diner": "/images/bars/grubstake-diner.jpg",
  "hi-tops": "/images/bars/hi-tops.jpg",
  "hockey-haven": "/images/bars/hockey-haven.jpg",
  "international-sports-bar": "/images/bars/international-sports-bar.png",
  "irish-bank": "/images/bars/irish-bank.jpg",
  "irish-times": "/images/bars/irish-times.png",
  "jilli": "/images/bars/jilli.jpg",
  "joodang": "/images/bars/joodang.jpg",
  "kezar-pub": "/images/bars/kezar-pub.jpg",
  "laughing-monk-brewing": "/images/bars/laughing-monk-brewing.jpg",
  "mad-dog-in-the-fog": "/images/bars/mad-dog-in-the-fog.jpg",
  "maggie-mcgarrys": "/images/bars/maggie-mcgarrys.jpg",
  "matterhorn-restaurant-bakery": "/images/bars/matterhorn-restaurant-bakery.jpg",
  "mcteagues-saloon": "/images/bars/mcteagues-saloon.jpg",
  "napper-tandy": "/images/bars/napper-tandy.jpg",
  "nickies-pub": "/images/bars/nickies-pub.jpg",
  "north-beach-italian-cluster": "/images/bars/north-beach-italian-cluster.jpg",
  "pig-and-whistle": "/images/bars/pig-and-whistle.jpg",
  "players-sports-grill-pier-39": "/images/bars/players-sports-grill-pier-39.jpg",
  "red-jack-saloon": "/images/bars/red-jack-saloon.jpg",
  "richmond-republic-draught-house": "/images/bars/richmond-republic-draught-house.jpg",
  "rikkis": "/images/bars/rikkis.jpg",
  "royal-exchange": "/images/bars/royal-exchange.jpg",
  "schroeders": "/images/bars/schroeders.jpg",
  "sf-athletic-club": "/images/bars/sf-athletic-club.jpg",
  "sf-brewing-co": "/images/bars/sf-brewing-co.png",
  "sf-italian-athletic-club": "/images/bars/sf-italian-athletic-club.jpg",
  "sool-bar-lounge": "/images/bars/sool-bar-lounge.jpg",
  "splash-thrive-city": "/images/venues/splash-thrive-city.jpg",
  "standard-deviant-brewing": "/images/bars/standard-deviant-brewing.jpg",
  "steins-beer-garden": "/images/bars/steins-beer-garden.jpg",
  "the-boardroom": "/images/bars/the-boardroom.jpg",
  "the-lark": "/images/bars/the-lark.jpg",
  "timeout-tavern": "/images/bars/timeout-tavern.jpg",
  "toronado": "/images/bars/toronado.jpg",
  "underdogs-cantina": "/images/bars/underdogs-cantina.jpg",
  "underdogs-too": "/images/bars/underdogs-too.jpg",
  "valley-tavern": "/images/bars/valley-tavern.jpg",
  "wreck-room": "/images/bars/wreck-room.jpg",
  "zzan-sf": "/images/bars/zzan-sf.jpg",
  "china-basin-park-mission-rock": "/images/venues/china-basin-park-mission-rock.jpg",
  "pier-39": "/images/venues/pier-39.jpg",
  "the-crossing-at-east-cut": "/images/venues/the-crossing-at-east-cut.jpg",
  "the-midway": "/images/venues/the-midway.jpg",
  "thrive-city": "/images/venues/thrive-city.jpg",
};

// Real self-hosted photo for a venue id, or null if we don't have one.
export function realBarPhoto(id: string | null | undefined): string | null {
  if (!id) return null;
  return BAR_PHOTOS[id] ?? null;
}

// Best usable photo for a venue: the self-hosted real photo first, otherwise
// the row's own URL unless it's a known-broken Google signed URL, else null.
// Use this anywhere a venue photo is rendered.
export function venuePhoto(
  id: string | null | undefined,
  existing?: string | null,
): string | null {
  const real = realBarPhoto(id);
  if (real) return real;
  if (
    existing &&
    !existing.includes("googleusercontent.com/gps-cs-s") &&
    !existing.includes("googleusercontent.com/places")
  ) {
    return existing;
  }
  return null;
}
