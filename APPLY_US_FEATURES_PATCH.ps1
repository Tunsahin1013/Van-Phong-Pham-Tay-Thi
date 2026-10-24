param(
  [Parameter(Mandatory = $true)]
  [string]$TargetPath
)

$ErrorActionPreference = 'Stop'
$sourceRoot = (Resolve-Path -LiteralPath $PSScriptRoot).Path
if (-not (Test-Path -LiteralPath $TargetPath)) { throw "Target path does not exist: $TargetPath" }
$targetRoot = (Resolve-Path -LiteralPath $TargetPath).Path
if (-not (Test-Path -LiteralPath (Join-Path $targetRoot '.git'))) {
  throw "Target folder is not a Git clone (missing .git): $targetRoot. Clone your branch into a separate folder first."
}
if (-not (Test-Path -LiteralPath (Join-Path $targetRoot 'package.json'))) {
  throw "Target does not look like the Tây Thi project (package.json missing): $targetRoot"
}

$relativeFiles = @(
  '.env.example',
  'api/index.ts', 'config/db.ts',
  'controllers/authController.ts', 'controllers/cartController.ts', 'controllers/categoryController.ts',
  'controllers/chatController.ts', 'controllers/inventoryController.ts', 'controllers/loyaltyController.ts',
  'controllers/notificationController.ts', 'controllers/orderController.ts', 'controllers/productController.ts',
  'controllers/reportController.ts', 'controllers/reviewController.ts', 'controllers/siteContentController.ts',
  'controllers/supplierController.ts', 'controllers/systemController.ts', 'controllers/userController.ts', 'controllers/voucherController.ts',
  'data/.gitkeep', 'data/seedData.ts', 'data/siteContentDefaults.ts',
  'middleware/auth.ts', 'middleware/systemAudit.ts',
  'models/SiteContent.ts', 'models/index.ts',
  'routes/authRoutes.ts', 'routes/cartRoutes.ts', 'routes/categoryRoutes.ts', 'routes/chatRoutes.ts', 'routes/index.ts',
  'routes/inventoryRoutes.ts', 'routes/loyaltyRoutes.ts', 'routes/notificationRoutes.ts', 'routes/orderRoutes.ts',
  'routes/productRoutes.ts', 'routes/reportRoutes.ts', 'routes/reviewRoutes.ts', 'routes/siteContentRoutes.ts',
  'routes/supplierRoutes.ts', 'routes/systemRoutes.ts', 'routes/userRoutes.ts', 'routes/voucherRoutes.ts',
  'server.ts', 'services/dataStore.ts', 'services/systemPersistence.ts',
  'src/App.tsx', 'src/api.ts', 'src/components/AuthModal.tsx', 'src/components/Footer.tsx', 'src/components/Header.tsx',
  'src/i18n.ts', 'src/pages/admin/AdminDashboard.tsx', 'src/pages/admin/SystemManagementPanel.tsx',
  'src/pages/customer/AccountPage.tsx', 'src/pages/customer/CheckoutPage.tsx', 'src/pages/customer/OrdersPage.tsx',
  'src/pages/customer/ProductDetailPage.tsx', 'src/pages/customer/ProductsPage.tsx', 'src/pages/customer/ResetPasswordPage.tsx',
  'src/pages/customer/VouchersPage.tsx', 'src/pages/employee/EmployeeDashboard.tsx', 'src/systemAdmin.css', 'src/utils/printOrder.ts'
)

foreach ($relativePath in $relativeFiles) {
  $sourceFile = Join-Path $sourceRoot $relativePath
  if (-not (Test-Path -LiteralPath $sourceFile)) { throw "Patch file missing: $relativePath" }
  $destinationFile = Join-Path $targetRoot $relativePath
  $destinationDirectory = Split-Path -Parent $destinationFile
  New-Item -ItemType Directory -Force -Path $destinationDirectory | Out-Null
  Copy-Item -LiteralPath $sourceFile -Destination $destinationFile -Force
  Write-Host "Applied $relativePath" -ForegroundColor Green
}

# Remove executable wallet modules from the app. Keep legacy wallet data fields/transactions for history compatibility.
$obsoleteFiles = @('controllers/walletController.ts', 'routes/walletRoutes.ts', 'src/pages/customer/WalletPage.tsx')
foreach ($relativePath in $obsoleteFiles) {
  $candidate = Join-Path $targetRoot $relativePath
  if (Test-Path -LiteralPath $candidate) {
    Remove-Item -LiteralPath $candidate -Force
    Write-Host "Removed obsolete wallet module: $relativePath" -ForegroundColor Yellow
  }
}

Write-Host ''
Write-Host 'US04–US38 patch applied.' -ForegroundColor Green
Write-Host 'Preserved: .git, .env, .files.env, data/db.json, node_modules, dist, src/pages/customer/HomePage.tsx, src/bannerSlides.ts, src/styles.css, package.json and package-lock.json.' -ForegroundColor Cyan
Write-Host 'Next: inspect git diff/status, run npm run lint and npm run build, then test locally before committing.' -ForegroundColor Cyan
