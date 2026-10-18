$ErrorActionPreference = 'Stop'

$questionnairePath = Join-Path $PSScriptRoot '..\apps\public-web\features\sectors\questionnaire.ts'
$registryPath = Join-Path $PSScriptRoot '..\apps\public-web\features\sectors\registry.ts'
$templatePath = Join-Path $PSScriptRoot '..\apps\public-web\features\sectors\sector-template.tsx'
$labelsPath = Join-Path $PSScriptRoot '..\apps\public-web\features\sectors\section-labels.mjs'
$questionnaire = [IO.File]::ReadAllText((Resolve-Path $questionnairePath))
$registry = [IO.File]::ReadAllText((Resolve-Path $registryPath))
$template = [IO.File]::ReadAllText((Resolve-Path $templatePath))
$labelsSource = [IO.File]::ReadAllText((Resolve-Path $labelsPath))

$registryIds = [regex]::Matches($registry, '(?m)^\s*\[\s*"(?<id>[a-z0-9-]+)"\s*,') | ForEach-Object { $_.Groups['id'].Value }
$profilePattern = '(?m)^\s*"(?<id>[a-z0-9-]+)"\s*:\s*\{\s*prompt:\s*"(?<prompt>(?:[^"\\]|\\.)*)",\s*choices:\s*\[(?<choices>[^\]]*)\],\s*followUp:\s*"(?<followUp>(?:[^"\\]|\\.)*)"\s*\},?\s*$'
$profileMatches = [regex]::Matches($questionnaire, $profilePattern)
$profiles = @{}
$prompts = [Collections.Generic.List[string]]::new()
$issues = [Collections.Generic.List[string]]::new()

foreach ($match in $profileMatches) {
  $id = $match.Groups['id'].Value
  $prompt = $match.Groups['prompt'].Value
  if ($profiles.ContainsKey($id)) { $issues.Add("Duplicate questionnaire profile: $id") }
  if ($prompts.Contains($prompt)) { $issues.Add("Duplicate sector-specific prompt: $id") }
  $prompts.Add($prompt)
  $choices = [regex]::Matches($match.Groups['choices'].Value, '"(?:[^"\\]|\\.)*"').Count
  if ([string]::IsNullOrWhiteSpace($match.Groups['prompt'].Value)) { $issues.Add("Empty sector prompt: $id") }
  if ([string]::IsNullOrWhiteSpace($match.Groups['followUp'].Value)) { $issues.Add("Empty sector follow-up: $id") }
  if ($choices -lt 2) { $issues.Add("Fewer than two sector choices: $id") }
  $profiles[$id] = $true
}

if ($registryIds.Count -ne 69) { $issues.Add("Expected 69 registry profiles, found $($registryIds.Count)") }
if (($registryIds | Sort-Object -Unique).Count -ne $registryIds.Count) { $issues.Add('Registry contains duplicate profile IDs') }
if ($profileMatches.Count -ne 69) { $issues.Add("Expected 69 sector-questionnaire profiles, found $($profileMatches.Count)") }
if (($prompts | Sort-Object -Unique).Count -ne 69) { $issues.Add("Expected 69 distinct sector prompts, found $(($prompts | Sort-Object -Unique).Count)") }
foreach ($id in $registryIds) { if (-not $profiles.ContainsKey($id)) { $issues.Add("Missing sector questionnaire profile: $id") } }
foreach ($id in $profiles.Keys) { if ($id -notin $registryIds) { $issues.Add("Questionnaire profile has no registry entry: $id") } }

$labelsBody = [regex]::Match($labelsSource, 'const SECTOR_LABELS = \{(?<body>[\s\S]*?)\r?\n\};').Groups['body'].Value
$labelEntries = [regex]::Matches($labelsBody, '(?m)^\s*"?(?<id>[a-z0-9-]+)"?\s*:\s*\{(?<properties>[^}]*)\}')
$sectionLabelIds = @{}
foreach ($entry in $labelEntries) {
  $id = $entry.Groups['id'].Value
  if ($sectionLabelIds.ContainsKey($id)) { $issues.Add("Duplicate sector section-label override: $id") }
  $keys = [regex]::Matches($entry.Groups['properties'].Value, '(?<![\w-])(overview|services|gallery|testimonials|contact|payments)\s*:')
  if ($keys.Count -lt 5 -or $keys.Count -gt 6) { $issues.Add("Sector section-label override must refine at least five stable sections: $id") }
  $sectionLabelIds[$id] = $true
}
if ($labelEntries.Count -ne 69) { $issues.Add("Expected 69 sector-specific section-label overrides, found $($labelEntries.Count)") }
foreach ($id in $registryIds) { if (-not $sectionLabelIds.ContainsKey($id)) { $issues.Add("Missing sector-specific section-label override: $id") } }
foreach ($id in $sectionLabelIds.Keys) { if ($id -notin $registryIds) { $issues.Add("Section-label override has no registry profile: $id") } }

$questionCount = [regex]::Matches($questionnaire, '(?m)^\s*question\(').Count
if ($questionCount -ne 23) { $issues.Add("Expected 23 question declarations, found $questionCount") }

foreach ($flow in @('order', 'booking', 'application', 'content', 'contact')) {
  if ($flow -eq 'contact') {
    if ($template -notmatch 'mock-contact-cards') { $issues.Add('Preview renderer does not include the contact-flow fallback') }
  } elseif ($template -notmatch "sector\.flow === `"$flow`"") {
    $issues.Add("Preview renderer does not explicitly handle flow: $flow")
  }
}

if ($issues.Count -gt 0) {
  Write-Error ("Sector profile audit failed ({0} issue(s)):`n- {1}" -f $issues.Count, ($issues -join "`n- "))
  exit 1
}

Write-Output "Static sector-profile audit passed: $($registryIds.Count) registry IDs, $($profileMatches.Count) distinct questionnaire profiles, $($labelEntries.Count) sector-label overrides, $questionCount question declarations, and five preview flows."
