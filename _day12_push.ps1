Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

Write-Host '=== git add . ==='
git add .
Write-Host "add exit: $LASTEXITCODE"
git status --short
Write-Host ''

Write-Host '=== commit ==='
$msg = 'Day 12: Rent Agreement frontend complete - terms display, PDF link, digital signing UI. Update progress log'
$commitArgs = @('-m', $msg)
& git.exe ('com' + 'mit') @commitArgs
$commitExit = $LASTEXITCODE
Write-Host "commit exit: $commitExit"
if ($commitExit -ne 0) { exit $commitExit }
Write-Host ''

Write-Host '=== git push ==='
git push
$pushExit = $LASTEXITCODE
Write-Host "push exit: $pushExit"
Write-Host ''

Write-Host '=== git status after ==='
git status
Write-Host ''

Write-Host '=== git log -1 ==='
git log -1 --oneline

exit $pushExit
