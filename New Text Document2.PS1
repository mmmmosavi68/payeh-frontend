
$projectRoot = "D:\dev\payeh-frontend"

$files = @(
    "src/lib/fonts.ts",
    "src/i18n/routing.ts",
    "src/i18n/navigation.ts",
    "src/i18n/request.ts",
    "src/proxy.ts",
    "messages/fa.json",
    "messages/en.json",
    "src/app/not-found.tsx",
    "src/app/[locale]/layout.tsx",
    "src/app/[locale]/page.tsx",
    "src/components/providers/theme-provider.tsx",
    "src/components/shared/theme-toggle.tsx",
    "src/components/shared/locale-switcher.tsx"
)

if (-not (Test-Path -LiteralPath $projectRoot -PathType Container)) {
    throw "Project directory not found: $projectRoot"
}

foreach ($file in $files) {
    $fullPath = Join-Path $projectRoot $file
    $dir = Split-Path -Path $fullPath -Parent

    New-Item -ItemType Directory -Force -Path $dir |
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

$oldPage = Join-Path $projectRoot "src/app/page.tsx"

if (Test-Path -LiteralPath $oldPage -PathType Leaf) {
    Remove-Item -LiteralPath $oldPage
    Write-Host "Removed: src/app/page.tsx" -ForegroundColor Cyan
}
else {
    Write-Host "Already absent: src/app/page.tsx" -ForegroundColor Yellow
}

Write-Host "`nFile structure prepared successfully." -ForegroundColor Green
