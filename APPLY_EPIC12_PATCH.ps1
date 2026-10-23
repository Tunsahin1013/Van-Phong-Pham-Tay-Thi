$ErrorActionPreference = 'Stop'

# Run this script from the root of the Tây Thi project after extracting this patch into it.
if (-not (Test-Path -LiteralPath '.\package.json') -or -not (Test-Path -LiteralPath '.\src\App.tsx')) {
  throw 'Khong tim thay package.json va src\App.tsx. Hay giai nen patch vao thu muc goc cua du an Tay Thi.'
}

# Remove legacy e-wallet files that are no longer part of the product.
$legacyWalletFiles = @(
  '.\src\pages\customer\WalletPage.tsx',
  '.\controllers\walletController.ts',
  '.\routes\walletRoutes.ts'
)
foreach ($file in $legacyWalletFiles) {
  if (Test-Path -LiteralPath $file) {
    Remove-Item -LiteralPath $file -Force
    Write-Host "Da go bo file vi cu: $file" -ForegroundColor Yellow
  }
}

Write-Host ''
Write-Host 'Da ap dung cac thao tac don dep cho Epic 12.' -ForegroundColor Green
Write-Host 'Cac file source trong patch can duoc giai nen/ghi de vao dung duong dan trong thu muc du an.' -ForegroundColor Green
Write-Host 'Tiep theo hay chay: npm run lint va npm run build' -ForegroundColor Cyan
