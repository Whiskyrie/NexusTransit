# Script para conectar ao banco de dados PostgreSQL
# Uso: .\scripts\connect-db.ps1

$env:PGPASSWORD = "postgres"

Write-Host "🔌 Conectando ao banco de dados NexusTransit..." -ForegroundColor Cyan
Write-Host ""

psql -h localhost -p 5432 -U postgres -d nexustransit

# Limpar senha da variável de ambiente
Remove-Item Env:\PGPASSWORD
