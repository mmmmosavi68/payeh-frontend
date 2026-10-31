$root = (Get-Location).Path
$files = @(
  "src/lib/env.server.ts",
  "src/lib/security/tokens.ts",
  "src/lib/security/origin.ts",
  "src/lib/security/return-url.ts",
  "src/lib/auth/cookie-names.ts",
  "src/lib/auth/cookies.ts",
  "src/lib/auth/backend-session.ts",
  "src/lib/api/backend.ts",
  "src/lib/api/client.ts",
  "src/app/api/bff/[...path]/route.ts",
  "src/features/auth/api.ts",
  "src/features/auth/use-logout.ts"
)
foreach ($f in $files) {
  $full = [System.IO.Path]::Combine($root, $f.Replace('/', '\'))
  [System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($full)) | Out-Null
  if (-not [System.IO.File]::Exists($full)) { [System.IO.File]::WriteAllText($full, "") }
  Write-Host "OK  $f"
}