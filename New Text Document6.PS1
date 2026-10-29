$root = (Get-Location).Path
$files = @(
  "src/types/auth.ts",
  "src/lib/api/errors.ts",
  "src/features/auth/error-message.ts",
  "src/features/auth/components/recaptcha-widget.tsx",
  "src/features/auth/components/use-captcha.tsx",
  "src/features/auth/components/otp-step.tsx",
  "src/features/auth/components/mobile-login.tsx",
  "src/features/auth/components/password-login.tsx"
)
foreach ($f in $files) {
  $full = [System.IO.Path]::Combine($root, $f.Replace('/', '\'))
  [System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($full)) | Out-Null
  if (-not [System.IO.File]::Exists($full)) { [System.IO.File]::WriteAllText($full, "") }
  Write-Host "OK  $f"
}