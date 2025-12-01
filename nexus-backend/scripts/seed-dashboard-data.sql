-- ==================================================
-- Script de População de Dados para Dashboard
-- NexusTransit - Dados de Teste
-- ==================================================

-- Limpar dados existentes (opcional - comentar se não quiser limpar)
-- TRUNCATE TABLE deliveries, drivers, vehicles, routes, customers CASCADE;

-- ==================================================
-- 1. CUSTOMERS (Clientes)
-- ==================================================
INSERT INTO customers (id, name, email, phone, document_type, document_number, customer_type, status, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Empresa ABC Ltda', 'contato@empresaabc.com.br', '11987654321', 'CNPJ', '12345678000190', 'BUSINESS', 'ACTIVE', NOW() - INTERVAL '90 days', NOW()),
  (gen_random_uuid(), 'Comércio XYZ', 'vendas@comercioxyz.com.br', '11876543210', 'CNPJ', '98765432000180', 'BUSINESS', 'ACTIVE', NOW() - INTERVAL '85 days', NOW()),
  (gen_random_uuid(), 'João Silva', 'joao.silva@email.com', '11765432109', 'CPF', '12345678901', 'INDIVIDUAL', 'ACTIVE', NOW() - INTERVAL '80 days', NOW()),
  (gen_random_uuid(), 'Maria Santos', 'maria.santos@email.com', '11654321098', 'CPF', '98765432109', 'INDIVIDUAL', 'ACTIVE', NOW() - INTERVAL '75 days', NOW()),
  (gen_random_uuid(), 'Supermercado Bom Preço', 'compras@bompreco.com.br', '11543210987', 'CNPJ', '11223344000155', 'BUSINESS', 'ACTIVE', NOW() - INTERVAL '70 days', NOW())
ON CONFLICT (document_number) DO NOTHING;

-- ==================================================
-- 2. DRIVERS (Motoristas)
-- ==================================================
INSERT INTO drivers (id, full_name, cpf, date_of_birth, phone, email, cnh_number, cnh_category, cnh_expiration_date, mopp_number, mopp_expiration_date, status, hiring_date, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Carlos Alberto dos Santos', '11122233344', '1985-05-15', '11998877665', 'carlos.santos@nexus.com', '12345678901', 'D', '2026-12-31', 'MOPP123456', '2026-06-30', 'AVAILABLE', '2023-01-10', NOW() - INTERVAL '90 days', NOW()),
  (gen_random_uuid(), 'Pedro Henrique Silva', '22233344455', '1990-08-20', '11887766554', 'pedro.silva@nexus.com', '23456789012', 'E', '2027-03-31', 'MOPP234567', '2027-01-15', 'AVAILABLE', '2023-03-15', NOW() - INTERVAL '85 days', NOW()),
  (gen_random_uuid(), 'Fernando Costa Lima', '33344455566', '1988-12-10', '11776655443', 'fernando.lima@nexus.com', '34567890123', 'D', '2026-09-30', 'MOPP345678', '2026-11-20', 'ON_ROUTE', '2023-05-20', NOW() - INTERVAL '80 days', NOW()),
  (gen_random_uuid(), 'Roberto Almeida Souza', '44455566677', '1992-03-25', '11665544332', 'roberto.souza@nexus.com', '45678901234', 'E', '2027-06-30', 'MOPP456789', '2027-04-10', 'AVAILABLE', '2023-07-01', NOW() - INTERVAL '75 days', NOW()),
  (gen_random_uuid(), 'José Carlos Pereira', '55566677788', '1987-11-30', '11554433221', 'jose.pereira@nexus.com', '56789012345', 'D', '2026-08-31', 'MOPP567890', '2026-10-25', 'UNAVAILABLE', '2023-02-14', NOW() - INTERVAL '70 days', NOW())
ON CONFLICT (cpf) DO NOTHING;

-- ==================================================
-- 3. VEHICLES (Veículos)
-- ==================================================
INSERT INTO vehicles (id, license_plate, brand, model, year, vehicle_type, fuel_type, capacity_kg, capacity_m3, status, acquisition_date, last_maintenance_date, next_maintenance_date, odometer_km, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'ABC1D23', 'Mercedes-Benz', 'Accelo 1016', 2022, 'TRUCK', 'DIESEL', 3500.00, 18.00, 'ACTIVE', '2022-01-15', NOW() - INTERVAL '30 days', NOW() + INTERVAL '60 days', 45000, NOW() - INTERVAL '90 days', NOW()),
  (gen_random_uuid(), 'DEF2E34', 'Volkswagen', 'Delivery 11.180', 2023, 'TRUCK', 'DIESEL', 5000.00, 25.00, 'IN_ROUTE', '2023-03-20', NOW() - INTERVAL '20 days', NOW() + INTERVAL '70 days', 28000, NOW() - INTERVAL '85 days', NOW()),
  (gen_random_uuid(), 'GHI3F45', 'Iveco', 'Daily 55C16', 2021, 'VAN', 'DIESEL', 2800.00, 15.00, 'ACTIVE', '2021-06-10', NOW() - INTERVAL '45 days', NOW() + INTERVAL '45 days', 62000, NOW() - INTERVAL '80 days', NOW()),
  (gen_random_uuid(), 'JKL4G56', 'Ford', 'Cargo 1719', 2023, 'TRUCK', 'DIESEL', 7000.00, 35.00, 'ACTIVE', '2023-08-05', NOW() - INTERVAL '15 days', NOW() + INTERVAL '75 days', 15000, NOW() - INTERVAL '75 days', NOW()),
  (gen_random_uuid(), 'MNO5H67', 'Renault', 'Master', 2022, 'VAN', 'DIESEL', 2500.00, 13.00, 'MAINTENANCE', '2022-11-22', NOW() - INTERVAL '5 days', NOW() + INTERVAL '25 days', 38000, NOW() - INTERVAL '70 days', NOW())
ON CONFLICT (license_plate) DO NOTHING;

-- ==================================================
-- 4. ROUTES (Rotas)
-- ==================================================
WITH inserted_drivers AS (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn FROM drivers LIMIT 5),
     inserted_vehicles AS (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn FROM vehicles LIMIT 5)
INSERT INTO routes (id, name, description, type, status, vehicle_id, driver_id, planned_date, planned_start_time, planned_end_time, actual_start_time, actual_end_time, estimated_distance_km, actual_distance_km, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Rota São Paulo - Campinas ' || gs.n,
  'Entrega de produtos eletrônicos',
  'DELIVERY',
  CASE 
    WHEN gs.n <= 30 THEN 'COMPLETED'
    WHEN gs.n <= 35 THEN 'IN_PROGRESS'
    ELSE 'PLANNED'
  END,
  v.id,
  d.id,
  (NOW() - INTERVAL '1 day' * (40 - gs.n))::date,
  '08:00:00'::time,
  '18:00:00'::time,
  CASE WHEN gs.n <= 30 THEN NOW() - INTERVAL '1 day' * (40 - gs.n) + INTERVAL '8 hours' ELSE NULL END,
  CASE WHEN gs.n <= 30 THEN NOW() - INTERVAL '1 day' * (40 - gs.n) + INTERVAL '16 hours' ELSE NULL END,
  120.50 + (gs.n * 5.3),
  CASE WHEN gs.n <= 30 THEN 125.80 + (gs.n * 5.1) ELSE NULL END,
  NOW() - INTERVAL '60 days',
  NOW()
FROM generate_series(1, 40) gs(n)
CROSS JOIN (SELECT id, ROW_NUMBER() OVER (ORDER BY random()) as rn FROM inserted_vehicles) v
CROSS JOIN (SELECT id, ROW_NUMBER() OVER (ORDER BY random()) as rn FROM inserted_drivers) d
WHERE v.rn = ((gs.n - 1) % 5) + 1 AND d.rn = ((gs.n - 1) % 5) + 1;

-- ==================================================
-- 5. DELIVERIES (Entregas)
-- ==================================================
WITH route_data AS (
  SELECT 
    id as route_id,
    status as route_status,
    ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM routes
  LIMIT 40
),
customer_data AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY random()) as rn FROM customers
)
INSERT INTO deliveries (
  id, tracking_code, customer_id, route_id, 
  pickup_address, pickup_city, pickup_state, pickup_zipcode, pickup_latitude, pickup_longitude,
  delivery_address, delivery_city, delivery_state, delivery_zipcode, delivery_latitude, delivery_longitude,
  status, priority, delivery_type,
  scheduled_date, pickup_datetime, delivery_datetime,
  weight_kg, volume_m3, declared_value,
  delivery_instructions, recipient_name, recipient_phone,
  created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  'NXT' || LPAD(gs.n::text, 10, '0'),
  c.id,
  r.route_id,
  -- Pickup
  'Rua das Flores, ' || (gs.n * 10),
  'São Paulo',
  'SP',
  '01000-000',
  -23.5505 + (random() * 0.1),
  -46.6333 + (random() * 0.1),
  -- Delivery
  'Av. Principal, ' || (gs.n * 15),
  CASE WHEN gs.n % 3 = 0 THEN 'Campinas' WHEN gs.n % 3 = 1 THEN 'Santos' ELSE 'São José dos Campos' END,
  'SP',
  '13000-000',
  -23.0 + (random() * 0.5),
  -47.0 + (random() * 0.5),
  -- Status baseado na rota
  CASE 
    WHEN r.route_status = 'COMPLETED' AND gs.n % 10 != 0 THEN 'DELIVERED'
    WHEN r.route_status = 'COMPLETED' AND gs.n % 10 = 0 THEN 'FAILED'
    WHEN r.route_status = 'IN_PROGRESS' AND gs.n % 2 = 0 THEN 'OUT_FOR_DELIVERY'
    WHEN r.route_status = 'IN_PROGRESS' THEN 'IN_TRANSIT'
    ELSE 'PENDING'
  END,
  CASE WHEN gs.n % 5 = 0 THEN 'URGENT' WHEN gs.n % 3 = 0 THEN 'HIGH' ELSE 'NORMAL' END,
  CASE WHEN gs.n % 4 = 0 THEN 'EXPRESS' ELSE 'STANDARD' END,
  -- Datas
  (NOW() - INTERVAL '1 day' * (45 - gs.n))::date,
  CASE WHEN r.route_status != 'PLANNED' THEN NOW() - INTERVAL '1 day' * (45 - gs.n) + INTERVAL '9 hours' ELSE NULL END,
  CASE WHEN r.route_status = 'COMPLETED' THEN NOW() - INTERVAL '1 day' * (45 - gs.n) + INTERVAL '15 hours' ELSE NULL END,
  -- Dimensões
  50.0 + (gs.n * 2.5),
  0.5 + (gs.n * 0.1),
  500.00 + (gs.n * 25.00),
  -- Instruções
  CASE WHEN gs.n % 3 = 0 THEN 'Entregar apenas com destinatário presente' ELSE 'Ligar antes de entregar' END,
  'Cliente ' || gs.n,
  '1199' || LPAD((1000000 + gs.n)::text, 7, '0'),
  NOW() - INTERVAL '60 days',
  NOW()
FROM generate_series(1, 120) gs(n)
CROSS JOIN route_data r
CROSS JOIN customer_data c
WHERE r.rn = ((gs.n - 1) % 40) + 1 AND c.rn = ((gs.n - 1) % 5) + 1;

-- ==================================================
-- 6. DELIVERY ATTEMPTS (Tentativas de Entrega)
-- ==================================================
INSERT INTO delivery_attempts (
  id, delivery_id, attempt_number, attempt_datetime,
  status, failure_reason, notes,
  latitude, longitude, photo_url, signature_url,
  created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  d.id,
  1,
  d.delivery_datetime - INTERVAL '1 hour',
  CASE d.status 
    WHEN 'DELIVERED' THEN 'SUCCESS'
    WHEN 'FAILED' THEN 'FAILED'
    ELSE 'PENDING'
  END,
  CASE d.status WHEN 'FAILED' THEN 'RECIPIENT_UNAVAILABLE' ELSE NULL END,
  CASE d.status 
    WHEN 'DELIVERED' THEN 'Entrega realizada com sucesso'
    WHEN 'FAILED' THEN 'Destinatário ausente, tentaremos novamente'
    ELSE NULL
  END,
  d.delivery_latitude,
  d.delivery_longitude,
  CASE d.status WHEN 'DELIVERED' THEN 'https://storage.example.com/photos/' || d.id || '.jpg' ELSE NULL END,
  CASE d.status WHEN 'DELIVERED' THEN 'https://storage.example.com/signatures/' || d.id || '.jpg' ELSE NULL END,
  NOW() - INTERVAL '30 days',
  NOW()
FROM deliveries d
WHERE d.status IN ('DELIVERED', 'FAILED');

-- ==================================================
-- 7. DELIVERY STATUS HISTORY (Histórico de Status)
-- ==================================================
WITH delivery_statuses AS (
  SELECT 
    id as delivery_id,
    status,
    created_at,
    pickup_datetime,
    delivery_datetime
  FROM deliveries
)
INSERT INTO delivery_status_history (id, delivery_id, status, changed_at, changed_by, notes, location_latitude, location_longitude, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  ds.delivery_id,
  'PENDING',
  ds.created_at,
  'SYSTEM',
  'Entrega criada no sistema',
  NULL, NULL,
  ds.created_at,
  ds.created_at
FROM delivery_statuses ds
UNION ALL
SELECT 
  gen_random_uuid(),
  ds.delivery_id,
  'IN_TRANSIT',
  ds.pickup_datetime,
  'SYSTEM',
  'Entrega coletada e em trânsito',
  -23.5505, -46.6333,
  ds.pickup_datetime,
  ds.pickup_datetime
FROM delivery_statuses ds
WHERE ds.pickup_datetime IS NOT NULL
UNION ALL
SELECT 
  gen_random_uuid(),
  ds.delivery_id,
  ds.status,
  ds.delivery_datetime,
  'SYSTEM',
  CASE ds.status 
    WHEN 'DELIVERED' THEN 'Entrega concluída com sucesso'
    WHEN 'FAILED' THEN 'Falha na entrega'
    ELSE 'Status atualizado'
  END,
  -23.0, -47.0,
  ds.delivery_datetime,
  ds.delivery_datetime
FROM delivery_statuses ds
WHERE ds.delivery_datetime IS NOT NULL;

-- ==================================================
-- VERIFICAÇÃO DOS DADOS INSERIDOS
-- ==================================================
SELECT 'Customers' as tabela, COUNT(*) as total FROM customers
UNION ALL
SELECT 'Drivers', COUNT(*) FROM drivers
UNION ALL
SELECT 'Vehicles', COUNT(*) FROM vehicles
UNION ALL
SELECT 'Routes', COUNT(*) FROM routes
UNION ALL
SELECT 'Deliveries', COUNT(*) FROM deliveries
UNION ALL
SELECT 'Delivery Attempts', COUNT(*) FROM delivery_attempts
UNION ALL
SELECT 'Delivery Status History', COUNT(*) FROM delivery_status_history;

-- ==================================================
-- ESTATÍSTICAS RÁPIDAS
-- ==================================================
SELECT 
  'Dashboard Stats' as info,
  (SELECT COUNT(*) FROM deliveries WHERE status = 'DELIVERED') as entregas_concluidas,
  (SELECT COUNT(*) FROM deliveries WHERE status = 'FAILED') as entregas_falhas,
  (SELECT COUNT(*) FROM deliveries WHERE status IN ('PENDING', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'PICKED_UP')) as entregas_em_andamento,
  (SELECT COUNT(*) FROM drivers WHERE status = 'AVAILABLE') as motoristas_disponiveis,
  (SELECT COUNT(*) FROM vehicles WHERE status = 'ACTIVE') as veiculos_ativos,
  (SELECT COUNT(*) FROM routes WHERE status = 'COMPLETED') as rotas_completas;
