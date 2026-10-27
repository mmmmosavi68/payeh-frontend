$root = (Get-Location).Path

$files = @(
  "src/app/[locale]/(auth)/layout.tsx",
  "src/app/[locale]/(auth)/login/page.tsx",
  "src/features/auth/schemas/login-schema.ts",
  "src/features/auth/components/auth-field.tsx",
  "src/features/auth/components/captcha-slot.tsx",
  "src/features/auth/components/credentials-form.tsx",
  "src/features/auth/components/otp-form.tsx",
  "src/features/auth/components/login-card.tsx",
  "src/lib/mock/auth.ts",
  "src/lib/digits.ts"
)

foreach ($f in $files) {
  $full = [System.IO.Path]::Combine($root, $f.Replace('/', '\'))
  $dir  = [System.IO.Path]::GetDirectoryName($full)
  [System.IO.Directory]::CreateDirectory($dir) | Out-Null
  if (-not [System.IO.File]::Exists($full)) {
    [System.IO.File]::WriteAllText($full, "")
  }
  Write-Host "OK  $f"
}