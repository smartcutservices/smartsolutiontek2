const DARK = "#000000";
const LIGHT = "#FFFFFF";

function luminance(hex) {
  const normalized = hex.slice(1);
  const channels = normalized.length === 3
    ? [...normalized].map((channel) => Number.parseInt(channel + channel, 16))
    : [0, 2, 4].map((offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16));
  const [r, g, b] = channels.map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Return the stronger opaque text color for an opaque 3 or 6 digit hex background. */
export function accessibleForeground(background) {
  if (typeof background !== "string" || !/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(background)) return LIGHT;
  const bg = luminance(background);
  const darkRatio = (bg + 0.05) / (luminance(DARK) + 0.05);
  const lightRatio = 1.05 / (bg + 0.05);
  return darkRatio >= lightRatio ? DARK : LIGHT;
}
