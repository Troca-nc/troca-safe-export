$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$env:USERPROFILE = Join-Path $PSScriptRoot '.expo-user'
$env:HOME = $env:USERPROFILE
$env:NODE_OPTIONS = '--use-system-ca'
& 'C:\Program Files\nodejs\node.exe' (Join-Path $PSScriptRoot 'serve-dist.js')
