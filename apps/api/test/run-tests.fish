#!/usr/bin/env fish

# Script para testar endpoints da API NexusTransit
# Uso: ./run-tests.fish [base_url]

set BASE_URL $argv[1]
if test -z "$BASE_URL"
    set BASE_URL "http://localhost:3033"
end

set GREEN '\033[0;32m'
set RED '\033[0;31m'
set BLUE '\033[0;34m'
set NC '\033[0m' # No Color

function test_endpoint
    set method $argv[1]
    set endpoint $argv[2]
    set description $argv[3]
    set data $argv[4]

    printf "\n$BLUE🧪 $description$NC\n"
    
    if test -z "$data"
        set response (curl -s -X $method "$BASE_URL$endpoint")
    else
        set response (curl -s -X $method "$BASE_URL$endpoint" \
            -H 'Content-Type: application/json' \
            -d $data)
    end
    
    set status_code (echo $response | jq -r '.statusCode // 200')
    
    if test $status_code -ge 200 -a $status_code -lt 300
        printf "$GREEN✅ PASSED$NC - Status: $status_code\n"
        echo $response | jq '.' | head -20
        return 0
    else
        printf "$RED❌ FAILED$NC - Status: $status_code\n"
        echo $response | jq '.'
        return 1
    end
end

printf "\n$BLUE════════════════════════════════════$NC\n"
printf "$BLUE  NEXUS TRANSIT API TESTS$NC\n"
printf "$BLUE  Base URL: $BASE_URL$NC\n"
printf "$BLUE════════════════════════════════════$NC\n"

# 1. Health Check
test_endpoint GET "/health" "Health Check"

# 2. Service Orders - Listar
test_endpoint GET "/service-orders" "Listar Service Orders"

# 3. Service Orders - Listar com filtro
test_endpoint GET "/service-orders?status=PENDING" "Filtrar por Status PENDING"

# 4. Service Orders - Buscar por número
test_endpoint GET "/service-orders/number/OS-2024-00001" "Buscar por Número de Ordem"

# 5. Service Orders - Criar
set create_data '{"service_type":"DELIVERY","title":"Teste automatizado","description":"Ordem criada por script de teste","priority":"HIGH","scheduled_date":"2024-12-20T10:00:00Z","estimated_cost":750}'
test_endpoint POST "/service-orders" "Criar Nova Service Order" $create_data

# 6. Service Orders - Buscar por ID (usa última criada)
set NEW_ID (curl -s "$BASE_URL/service-orders" | jq -r '.data[0].id')
if test -n "$NEW_ID"
    test_endpoint GET "/service-orders/$NEW_ID" "Buscar Service Order por ID"
    
    # 7. Atualizar para SCHEDULED
    set update_data '{"status":"SCHEDULED"}'
    test_endpoint PATCH "/service-orders/$NEW_ID" "Atualizar para SCHEDULED" $update_data
    
    # 8. Iniciar ordem
    test_endpoint POST "/service-orders/$NEW_ID/start" "Iniciar Ordem (start)"
    
    # 9. Cancelar ordem
    set cancel_data '{"reason":"Teste de cancelamento automatizado"}'
    test_endpoint POST "/service-orders/$NEW_ID/cancel" "Cancelar Ordem" $cancel_data
end

# 10. Service Orders - Paginação
test_endpoint GET "/service-orders?page=1&limit=5" "Paginação (5 itens)"

# 11. Service Orders - Buscar por tipo
test_endpoint GET "/service-orders?service_type=MAINTENANCE" "Filtrar por Tipo de Serviço"

# 12. Service Orders - Buscar por prioridade
test_endpoint GET "/service-orders?priority=HIGH" "Filtrar por Prioridade HIGH"

printf "\n$BLUE════════════════════════════════════$NC\n"
printf "$BLUE  TESTES CONCLUÍDOS$NC\n"
printf "$BLUE════════════════════════════════════$NC\n\n"
