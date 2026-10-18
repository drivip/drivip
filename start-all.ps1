$apps = @(
  @{name="home"; port=3000; path="E:\drivip\apps\home"},
  @{name="conductor"; port=3001; path="E:\drivip\apps\conductor"},
  @{name="linea"; port=3002; path="E:\drivip\apps\linea"},
  @{name="superadmin"; port=3003; path="E:\drivip\apps\superadmin"},
  @{name="cliente"; port=3004; path="E:\drivip\apps\cliente"},
  @{name="comercio"; port=3005; path="E:\drivip\apps\comercio"}
)

foreach ($app in $apps) {
  Push-Location $app.path
  Start-Process -FilePath "E:\program files\nodejs\node.exe" -ArgumentList "E:\drivip\node_modules\.pnpm\vite@6.4.3\node_modules\vite\bin\vite.js --port $($app.port) --host" -WorkingDirectory $app.path -WindowStyle Minimized
  Pop-Location
  Write-Host "Started $($app.name) on port $($app.port)"
}

Write-Host "`nWaiting for all apps..."
Start-Sleep -Seconds 8

foreach ($app in $apps) {
  try {
    $r = Invoke-WebRequest -Uri "http://localhost:$($app.port)" -UseBasicParsing -TimeoutSec 3
    Write-Host "$($app.name) -> OK ($($r.StatusCode))"
  } catch {
    Write-Host "$($app.name) -> FAILED"
  }
}
