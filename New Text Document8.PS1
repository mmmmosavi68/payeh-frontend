$root = (Get-Location).Path
$files = @(
  "src/lib/security/csp.ts",
  "src/lib/theme.ts",
  "src/lib/dates.ts",
  "src/components/shared/theme-script.tsx",
  "src/features/sessions/api.ts",
  "src/features/auth/me.ts"
)
foreach ($f in $files) {
  $full = [System.IO.Path]::Combine($root, $f.Replace('/', '\'))
  [System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($full)) | Out-Null
  if (-not [System.IO.File]::Exists($full)) { [System.IO.File]::WriteAllText($full, "") }
  Write-Host "OK  $f"
}