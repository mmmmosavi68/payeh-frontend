$root = (Get-Location).Path
$files = @(
  "scripts/patch-users-messages.mjs",
  "src/features/users/api.ts",
  "src/features/users/error-message.ts"
)
foreach ($f in $files) {
  $full = [System.IO.Path]::Combine($root, $f.Replace('/', '\'))
  [System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($full)) | Out-Null
  if (-not [System.IO.File]::Exists($full)) { [System.IO.File]::WriteAllText($full, "") }
  Write-Host "OK  $f"
}