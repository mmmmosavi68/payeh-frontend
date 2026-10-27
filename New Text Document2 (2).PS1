
$projectRoot = "D:\dev\payeh-frontend"

$files = @(
    "src/components/layout/brand.tsx",
    "src/components/layout/nav-config.ts",
    "src/components/layout/sidebar-nav.tsx",
    "src/components/layout/user-menu.tsx",
    "src/components/layout/page-header.tsx",
    "src/components/layout/dashboard-shell.tsx",
    "src/features/dashboard/components/stat-card.tsx",
    "src/features/dashboard/components/recent-sign-ins.tsx",
    "src/lib/mock/dashboard.ts",
    "src/app/[locale]/(dashboard)/layout.tsx",
    "src/app/[locale]/(dashboard)/dashboard/page.tsx",
    "src/app/[locale]/(dashboard)/users/page.tsx",
    "src/app/[locale]/(dashboard)/sessions/page.tsx"
)

if (-not (Test-Path -LiteralPath $projectRoot -PathType Container)) {
    throw "Project directory not found: $projectRoot"
}

foreach ($file in $files) {
    $fullPath = Join-Path $projectRoot $file
    $directory = Split-Path -Path $fullPath -Parent

    New-Item -ItemType Directory -Force -Path $directory |
        Out-Null

    if (-not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
        New-Item -ItemType File -Path $fullPath |
            Out-Null

        Write-Host "Created: $file" -ForegroundColor Green
    }
    else {
        Write-Host "Exists:  $file" -ForegroundColor Yellow
    }
}

Write-Host "`nCompleted: $($files.Count) files checked." -ForegroundColor Cyan
