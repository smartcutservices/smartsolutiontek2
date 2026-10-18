import test from "node:test";
import assert from "node:assert/strict";
import { accessibleForeground } from "../features/sectors/contrast.mjs";

function luminance(hex) {
  const channels = hex.slice(1).match(/.{2}/g).map((channel) => Number.parseInt(channel, 16) / 255);
  const linear = channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function ratio(foreground, background) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test("preview chooses readable text for light, dark, and short hex brand colors", () => {
  assert.equal(accessibleForeground("#FFFF00"), "#000000");
  assert.equal(accessibleForeground("#20302A"), "#FFFFFF");
  assert.equal(accessibleForeground("#fff"), "#000000");
  assert.equal(accessibleForeground("#bad-value"), "#FFFFFF");
});

test("chosen preview text meets WCAG AA for representative opaque colors", () => {
  for (const background of ["#000000", "#FFFFFF", "#FFFF00", "#4F9284", "#20302A", "#808080", "#777777", "#00FFFF"]) {
    assert.ok(ratio(accessibleForeground(background), background) >= 4.5, background);
  }
});
