
$projectRoot = "D:\dev\payeh-frontend"

$dirs = @(
  "src/app/[locale]/(auth)/login",
  "src/app/[locale]/(dashboard)/dashboard",
  "src/app/[locale]/(dashboard)/users",
  "src/app/[locale]/(dashboard)/sessions",
  "src/app/api/bff",
  "src/components/layout",
  "src/components/providers",
  "src/components/shared",
  "src/features/auth/components",
  "src/features/auth/schemas",
  "src/features/users/components",
  "src/features/sessions/components",
  "src/features/dashboard/components",
  "src/hooks",
  "src/i18n",
  "src/lib/api",
  "src/lib/auth",
  "src/lib/security",
  "src/lib/mock",
  "src/types",
  "messages",
  "public/fonts"
)

if (-not (Test-Path -LiteralPath $projectRoot)) {
    throw "Project directory not found: $projectRoot"
}

foreach ($d in $dirs) {
    $fullPath = Join-Path $projectRoot $d

    New-Item -ItemType Directory -Force -Path $fullPath |
        Out-Null

    $gitkeep = Join-Path $fullPath ".gitkeep"

    if (-not (Test-Path -LiteralPath $gitkeep)) {
        New-Item -ItemType File -Path $gitkeep |
            Out-Null
    }
}

Write-Host "Done: $($dirs.Count) folders checked/created." -ForegroundColor Green
