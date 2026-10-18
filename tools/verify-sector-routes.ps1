param(
  [string]$BaseUri = "http://127.0.0.1:3010"
)

$ErrorActionPreference = "Stop"
$registryPath = Join-Path $PSScriptRoot "../apps/public-web/features/sectors/registry.ts"
$registry = [IO.File]::ReadAllText((Resolve-Path $registryPath), [Text.Encoding]::UTF8)
$matches = [Regex]::Matches($registry, '\["([a-z0-9-]+)",')
$sectorIds = @($matches | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique)
if ($sectorIds.Count -ne 69) {
  throw "Expected 69 sector route IDs; found $($sectorIds.Count)."
}

$failures = [Collections.Generic.List[string]]::new()
foreach ($sectorId in $sectorIds) {
  $uri = "$($BaseUri.TrimEnd('/'))/templates/$sectorId"
  try {
    $response = Invoke-WebRequest -Uri $uri -UseBasicParsing -TimeoutSec 15
    $title = [Regex]::Match($response.Content, '<title>(.*?)</title>').Groups[1].Value
    if ($response.StatusCode -ne 200 -or -not $response.Content.Contains("PROFIL CANDIDAT") -or -not $title.Contains("Smart Solutions Tech")) {
      $failures.Add("$sectorId returned $($response.StatusCode) with unexpected page markers.")
    }
  } catch {
    $failures.Add("$sectorId failed: $($_.Exception.Message)")
  }
}

if ($failures.Count -gt 0) {
  $failures | ForEach-Object { Write-Error $_ }
  throw "$($failures.Count) of $($sectorIds.Count) sector routes failed."
}

Write-Output "Local route QA passed: all $($sectorIds.Count) candidate sector pages returned HTTP 200 with profile and product title markers from $BaseUri."
