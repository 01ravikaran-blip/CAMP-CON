# Start Setup
Write-Host "🚀 Starting Smart Campus Super-App..." -ForegroundColor Green

# 1. Start MongoDB Backend Services
Write-Host "Starting Microservices..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend/auth-service; node index.js"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend/verification-service; node index.js"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend/social-graph-service; node index.js"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend/marketplace-service; node index.js"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend/events-service; node index.js"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend/chat-service; node index.js"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend/wallet-service; node index.js"

# 2. Start Frontend
Write-Host "Starting Frontend..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd apps/web; npm run dev"

Write-Host "✅ All Systems Go!" -ForegroundColor Cyan
Write-Host "🌍 App running at http://localhost:3000"
Write-Host "📜 Services running on Ports 3001-3007"
