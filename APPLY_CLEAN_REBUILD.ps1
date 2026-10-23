param(
  [Parameter(Mandatory = $true)]
  [string]$TargetPath
)

$ErrorActionPreference = 'Stop'
$sourceRoot = (Resolve-Path -LiteralPath $PSScriptRoot).Path
if (-not (Test-Path -LiteralPath $TargetPath)) {
  throw "Target path does not exist: $TargetPath"
}
$targetRoot = (Resolve-Path -LiteralPath $TargetPath).Path
if (-not (Test-Path -LiteralPath (Join-Path $targetRoot '.git'))) {
  throw "Target folder is not a Git clone (missing .git): $targetRoot. Clone the GitHub repository into a fresh folder first."
}
if (-not (Test-Path -LiteralPath (Join-Path $targetRoot 'package.json'))) {
  throw "Target does not look like the Tây Thi project (package.json missing): $targetRoot"
}

$excludedTopLevel = @('.git', '.env', '.files.env', 'node_modules', 'dist', 'build', 'coverage')

function Copy-RebuildContents([string]$SourceDirectory, [string]$DestinationDirectory, [bool]$IsDataDirectory = $false) {
  New-Item -ItemType Directory -Force -Path $DestinationDirectory | Out-Null
  foreach ($child in Get-ChildItem -LiteralPath $SourceDirectory -Force) {
    if ($IsDataDirectory -and $child.Name -eq 'db.json') { continue }
    $destination = Join-Path $DestinationDirectory $child.Name
    if ($child.PSIsContainer) {
      if ($excludedTopLevel -contains $child.Name -and $SourceDirectory -eq $sourceRoot) { continue }
      Copy-RebuildContents $child.FullName $destination ($child.Name -eq 'data')
    } else {
      Copy-Item -LiteralPath $child.FullName -Destination $destination -Force
    }
  }
}

# Copy source into the existing fresh clone, but preserve its Git metadata, secrets,
# installed dependencies, build output and any existing local JSON snapshot.
foreach ($item in Get-ChildItem -LiteralPath $sourceRoot -Force) {
  if ($excludedTopLevel -contains $item.Name) { continue }
  $destination = Join-Path $targetRoot $item.Name
  if ($item.Name -eq 'data') {
    Copy-RebuildContents $item.FullName $destination $true
  } elseif ($item.PSIsContainer) {
    Copy-RebuildContents $item.FullName $destination $false
  } else {
    Copy-Item -LiteralPath $item.FullName -Destination $destination -Force
  }
}

# Remove obsolete executable wallet UI/routes only. Keep legacy schema fields for old records.
$obsoleteFiles = @(
  'controllers/walletController.ts',
  'routes/walletRoutes.ts',
  'src/pages/customer/WalletPage.tsx'
)
foreach ($relativePath in $obsoleteFiles) {
  $candidate = Join-Path $targetRoot $relativePath
  if (Test-Path -LiteralPath $candidate) {
    Remove-Item -LiteralPath $candidate -Force
    Write-Host "Removed obsolete e-wallet module: $relativePath" -ForegroundColor Yellow
  }
}

Write-Host 'Clean rebuild source applied.' -ForegroundColor Green
Write-Host "Target: $targetRoot"
Write-Host 'Preserved: .git, .env, .files.env, node_modules, dist and existing data/db.json.' -ForegroundColor Cyan
Write-Host 'Next: inspect git status/diff; run npm ci, npm run lint and npm run build.' -ForegroundColor Cyan
