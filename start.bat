concurrently --names "home,conductor,linea,superadmin,cliente" --prefix-colors "cyan,blue,green,red,yellow" ^
  "cd /d E:\drivip\apps\home && node E:\drivip\node_modules\.pnpm\vite@6.4.3\node_modules\vite\bin\vite.js --port 3000 --host" ^
  "cd /d E:\drivip\apps\conductor && node E:\drivip\node_modules\.pnpm\vite@6.4.3\node_modules\vite\bin\vite.js --port 3001 --host" ^
  "cd /d E:\drivip\apps\linea && node E:\drivip\node_modules\.pnpm\vite@6.4.3\node_modules\vite\bin\vite.js --port 3002 --host" ^
  "cd /d E:\drivip\apps\superadmin && node E:\drivip\node_modules\.pnpm\vite@6.4.3\node_modules\vite\bin\vite.js --port 3003 --host" ^
  "cd /d E:\drivip\apps\cliente && node E:\drivip\node_modules\.pnpm\vite@6.4.3\node_modules\vite\bin\vite.js --port 3004 --host"
