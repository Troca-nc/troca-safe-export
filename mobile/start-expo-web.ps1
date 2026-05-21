$ErrorActionPreference = 'Stop'
$env:USERPROFILE = Join-Path $PSScriptRoot '.expo-user'
$env:HOME = $env:USERPROFILE
$env:NODE_OPTIONS = '--use-system-ca'
Set-Location $PSScriptRoot
$logOut = Join-Path $PSScriptRoot '.expo-web.out.log'
$logErr = Join-Path $PSScriptRoot '.expo-web.err.log'
Remove-Item $logOut, $logErr -ErrorAction SilentlyContinue
Start-Transcript -Path $logOut -Append | Out-Null
try {
  & 'C:\Program Files\nodejs\npm.cmd' run start -- --web *>> $logOut
} catch {
  $_ | Out-File -FilePath $logErr -Append
  throw
} finally {
  Stop-Transcript | Out-Null
}
