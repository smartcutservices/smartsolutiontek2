param(
  [double]$MinimumRatio = 4.5
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-RelativeLuminance([string]$HexColor) {
  $hex = $HexColor.TrimStart('#')
  if ($hex.Length -ne 6 -or $hex -notmatch '^[0-9a-fA-F]{6}$') {
    throw "Expected an opaque #RRGGBB color, got '$HexColor'."
  }

  $channels = @()
  for ($index = 0; $index -lt 3; $index++) {
    $channel = [Convert]::ToInt32($hex.Substring($index * 2, 2), 16) / 255.0
    if ($channel -le 0.04045) {
      $channels += $channel / 12.92
    } else {
      $channels += [math]::Pow((($channel + 0.055) / 1.055), 2.4)
    }
  }

  return 0.2126 * $channels[0] + 0.7152 * $channels[1] + 0.0722 * $channels[2]
}

$checks = @(
  @{ Name = 'Feed primary'; Foreground = '#F6F7F4'; Background = '#101918' },
  @{ Name = 'Feed secondary'; Foreground = '#B5BFBA'; Background = '#101918' },
  @{ Name = 'Feed muted'; Foreground = '#A7B4AE'; Background = '#101918' },
  @{ Name = 'Feed accent'; Foreground = '#D4E47C'; Background = '#101918' },
  @{ Name = 'Feed strong accent'; Foreground = '#4F9284'; Background = '#101918' },
  @{ Name = 'Accent button text'; Foreground = '#1D2B25'; Background = '#D4E47C' },
  @{ Name = 'Brand badge text on strong accent'; Foreground = '#101918'; Background = '#4F9284' },
  @{ Name = 'Feed navigation button'; Foreground = '#F0F4F1'; Background = '#101918' },
  @{ Name = 'Wizard secondary'; Foreground = '#BDC9C2'; Background = '#101918' },
  @{ Name = 'Wizard primary'; Foreground = '#EEF2EF'; Background = '#101918' },
  @{ Name = 'Wizard summary'; Foreground = '#AEBBB3'; Background = '#101918' },
  @{ Name = 'Mock hero'; Foreground = '#24302A'; Background = '#F3F0E7' },
  @{ Name = 'Mock hero body'; Foreground = '#59665C'; Background = '#E4E8DC' },
  @{ Name = 'Mock card body'; Foreground = '#68736B'; Background = '#FFFEFA' },
  @{ Name = 'Application card body'; Foreground = '#68736B'; Background = '#F8F8F2' },
  @{ Name = 'Booking card body'; Foreground = '#68736B'; Background = '#F7FAF6' },
  @{ Name = 'Mock navigation'; Foreground = '#556057'; Background = '#F3F0E7' },
  @{ Name = 'Default mock action'; Foreground = '#FFFFFF'; Background = '#20302A' },
  @{ Name = 'Warm mock action'; Foreground = '#FFFFFF'; Background = '#873F2C' },
  @{ Name = 'Bold mock action'; Foreground = '#FFFFFF'; Background = '#71351D' },
  @{ Name = 'Elegant mock action'; Foreground = '#FFFFFF'; Background = '#493C33' }
)

$failed = @()
foreach ($check in $checks) {
  $foreground = Get-RelativeLuminance $check.Foreground
  $background = Get-RelativeLuminance $check.Background
  $ratio = ([math]::Max($foreground, $background) + 0.05) / ([math]::Min($foreground, $background) + 0.05)
  $status = if ($ratio -ge $MinimumRatio) { 'PASS' } else { 'FAIL' }
  '{0} {1}: {2:N2}:1 (minimum {3:N1}:1)' -f $status, $check.Name, $ratio, $MinimumRatio
  if ($ratio -lt $MinimumRatio) { $failed += $check.Name }
}

if ($failed.Count -gt 0) {
  throw "Contrast checks failed: $($failed -join ', ')"
}
