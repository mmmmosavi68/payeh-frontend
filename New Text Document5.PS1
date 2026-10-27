$root = (Get-Location).Path

$files = @(
  "src/types/common.ts",
  "src/types/user.ts",
  "src/types/session.ts",
  "src/hooks/use-debounced-value.ts",
  "src/hooks/use-remote-data.ts",
  "src/lib/mock/utils.ts",
  "src/lib/mock/users.ts",
  "src/lib/mock/sessions.ts",
  "src/components/shared/form-field.tsx",
  "src/components/shared/confirm-dialog.tsx",
  "src/components/shared/data-states.tsx",
  "src/components/shared/sample-notice.tsx",
  "src/features/users/schemas/user-schema.ts",
  "src/features/users/components/user-form-dialog.tsx",
  "src/features/users/components/users-table.tsx",
  "src/features/sessions/components/sessions-list.tsx"
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