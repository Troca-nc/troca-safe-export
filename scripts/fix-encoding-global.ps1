$files = Get-ChildItem -Path "frontend/src" -Recurse -Include "*.tsx","*.ts" |
  Where-Object { 
    $bytes = [System.IO.File]::ReadAllBytes($_.FullName)
    $bytes -contains 0xEF -and $bytes -contains 0xBF -and $bytes -contains 0xBD
  }
$latin1 = [System.Text.Encoding]::GetEncoding("iso-8859-1")
$utf8 = New-Object System.Text.UTF8Encoding $false
$count = 0
foreach ($file in $files) {
  $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
  $content = $latin1.GetString($bytes)
  $newBytes = $utf8.GetBytes($content)
  [System.IO.File]::WriteAllBytes($file.FullName, $newBytes)
  Write-Host "Corrigé : $($file.Name)"
  $count++
}
Write-Host "`n$count fichiers reconvertis."
