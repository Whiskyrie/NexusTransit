-- ==================================================
-- Script Mínimo de População - Dashboard NexusTransit
-- Execute este script se quiser apenas dados básicos
-- ==================================================

-- ==================================================
-- 1. CUSTOMERS (5 clientes)
-- ==================================================
DO $$
DECLARE
  customer_ids uuid[] := ARRAY[
    gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 
    gen_random_uuid(), gen_random_uuid()
  ];
BEGIN
  INSERT INTO customers (id, name, email, phone, document_type, document_number, customer_type, status, created_at, updated_at)
  VALUES 
    (customer_ids[1], 'Empresa ABC Ltda', 'abc@empresa.com', '11987654321', 'CNPJ', '12345678000190', 'BUSINESS', 'ACTIVE', NOW() - INTERVAL '60 days', NOW()),
    (customer_ids[2], 'Loja XYZ', 'xyz@loja.com', '11876543210', 'CNPJ', '98765432000180', 'BUSINESS', 'ACTIVE', NOW() - INTERVAL '50 days', NOW()),
    (customer_ids[3], 'João Silva', 'joao@email.com', '11765432109', 'CPF', '12345678901', 'INDIVIDUAL', 'ACTIVE', NOW() - INTERVAL '40 days', NOW()),
    (customer_ids[4], 'Maria Santos', 'maria@email.com', '11654321098', 'CPF', '98765432109', 'INDIVIDUAL', 'ACTIVE', NOW() - INTERVAL '30 days', NOW()),
    (customer_ids[5], 'Comércio 123', 'comercio@123.com', '11543210987', 'CNPJ', '11223344000155', 'BUSINESS', 'ACTIVE', NOW() - INTERVAL '20 days', NOW())
  ON CONFLICT (document_number) DO NOTHING;
END $$;

-- ==================================================
-- 2. DRIVERS (3 motoristas)
-- ==================================================
DO $$
DECLARE
  driver_ids uuid[] := ARRAY[gen_random_uuid(), gen_random_uuid(), gen_random_uuid()];
BEGIN
  INSERT INTO drivers (id, full_name, cpf, date_of_birth, phone, email, cnh_number, cnh_category, cnh_expiration_date, mopp_number, mopp_expiration_date, status, hiring_date, created_at, updated_at)
  VALUES 
    (driver_ids[1], 'Carlos Santos', '11122233344', '1985-05-15', '11998877665', 'carlos@nexus.com', '12345678901', 'D', '2026-12-31', 'MOPP123456', '2026-06-30', 'AVAILABLE', '2023-01-10', NOW() - INTERVAL '60 days', NOW()),
    (driver_ids[2], 'Pedro Silva', '22233344455', '1990-08-20', '11887766554', 'pedro@nexus.com', '23456789012', 'E', '2027-03-31', 'MOPP234567', '2027-01-15', 'ON_ROUTE', '2023-03-15', NOW() - INTERVAL '50 days', NOW()),
    (driver_ids[3], 'Fernando Lima', '33344455566', '1988-12-10', '11776655443', 'fernando@nexus.com', '34567890123', 'D', '2026-09-30', 'MOPP345678', '2026-11-20', 'AVAILABLE', '2023-05-20', NOW() - INTERVAL '40 days', NOW())
  ON CONFLICT (cpf) DO NOTHING;
END $$;

-- ==================================================
-- 3. VEHICLES (3 veículos)
-- ==================================================
DO $$
DECLARE
  vehicle_ids uuid[] := ARRAY[gen_random_uuid(), gen_random_uuid(), gen_random_uuid()];
BEGIN
  INSERT INTO vehicles (id, license_plate, brand, model, year, vehicle_type, fuel_type, capacity_kg, capacity_m3, status, acquisition_date, last_maintenance_date, next_maintenance_date, odometer_km, created_at, updated_at)
  VALUES 
    (vehicle_ids[1], 'ABC1D23', 'Mercedes-Benz', 'Accelo 1016', 2022, 'TRUCK', 'DIESEL', 3500.00, 18.00, 'ACTIVE', '2022-01-15', NOW() - INTERVAL '30 days', NOW() + INTERVAL '60 days', 45000, NOW() - INTERVAL '60 days', NOW()),
    (vehicle_ids[2], 'DEF2E34', 'Volkswagen', 'Delivery', 2023, 'TRUCK', 'DIESEL', 5000.00, 25.00, 'IN_ROUTE', '2023-03-20', NOW() - INTERVAL '20 days', NOW() + INTERVAL '70 days', 28000, NOW() - INTERVAL '50 days', NOW()),
    (vehicle_ids[3], 'GHI3F45', 'Iveco', 'Daily', 2021, 'VAN', 'DIESEL', 2800.00, 15.00, 'ACTIVE', '2021-06-10', NOW() - INTERVAL '45 days', NOW() + INTERVAL '45 days', 62000, NOW() - INTERVAL '40 days', NOW())
  ON CONFLICT (license_plate) DO NOTHING;
END $$;

-- ==================================================
-- 4. ROUTES (20 rotas)
-- ==================================================
DO $$
DECLARE
  driver_id uuid;
  vehicle_id uuid;
  route_id uuid;
  i int;
BEGIN
  FOR i IN 1..20 LOOP
    -- Seleciona driver e veículo de forma rotativa
    SELECT id INTO driver_id FROM drivers ORDER BY random() LIMIT 1;
    SELECT id INTO vehicle_id FROM vehicles ORDER BY random() LIMIT 1;
    
    route_id := gen_random_uuid();
    
    INSERT INTO routes (
      id, name, description, type, status, 
      vehicle_id, driver_id, 
      planned_date, planned_start_time, planned_end_time,
      actual_start_time, actual_end_time,
      estimated_distance_km, actual_distance_km,
      created_at, updated_at
    )
    VALUES (
      route_id,
      'Rota ' || i,
      'Rota de entrega ' || i,
      'DELIVERY',
      CASE 
        WHEN i <= 15 THEN 'COMPLETED'
        WHEN i <= 18 THEN 'IN_PROGRESS'
        ELSE 'PLANNED'
      END,
      vehicle_id,
      driver_id,
      (NOW() - INTERVAL '1 day' * (25 - i))::date,
      '08:00:00'::time,
      '18:00:00'::time,
      CASE WHEN i <= 15 THEN NOW() - INTERVAL '1 day' * (25 - i) + INTERVAL '8 hours' ELSE NULL END,
      CASE WHEN i <= 15 THEN NOW() - INTERVAL '1 day' * (25 - i) + INTERVAL '16 hours' ELSE NULL END,
      100.00 + (i * 10.0),
      CASE WHEN i <= 15 THEN 105.00 + (i * 9.5) ELSE NULL END,
      NOW() - INTERVAL '30 days',
      NOW()
    );
  END LOOP;
END $$;

-- ==================================================
-- 5. DELIVERIES (60 entregas - 3 por rota)
-- ==================================================
DO $$
DECLARE
  route_record RECORD;
  customer_id uuid;
  delivery_id uuid;
  j int;
  delivery_status text;
BEGIN
  FOR route_record IN (SELECT id, status FROM routes ORDER BY created_at) LOOP
    FOR j IN 1..3 LOOP
      -- Seleciona cliente aleatório
      SELECT id INTO customer_id FROM customers ORDER BY random() LIMIT 1;
      
      delivery_id := gen_random_uuid();
      
      -- Define status baseado na rota
      IF route_record.status = 'COMPLETED' THEN
        delivery_status := CASE WHEN j = 3 THEN 'FAILED' ELSE 'DELIVERED' END;
      ELSIF route_record.status = 'IN_PROGRESS' THEN
        delivery_status := CASE WHEN j = 1 THEN 'OUT_FOR_DELIVERY' ELSE 'IN_TRANSIT' END;
      ELSE
        delivery_status := 'PENDING';
      END IF;
      
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
      VALUES (
        delivery_id,
        'NXT' || LPAD((FLOOR(random() * 9999999) + 1)::text, 10, '0'),
        customer_id,
        route_record.id,
        'Rua Origem, ' || (j * 100),
        'São Paulo',
        'SP',
        '01000-000',
        -23.5505 + (random() * 0.1),
        -46.6333 + (random() * 0.1),
        'Rua Destino, ' || (j * 200),
        CASE WHEN j % 2 = 0 THEN 'Campinas' ELSE 'Santos' END,
        'SP',
        '13000-000',
        -23.0 + (random() * 0.5),
        -47.0 + (random() * 0.5),
        delivery_status,
        CASE WHEN j = 1 THEN 'URGENT' WHEN j = 2 THEN 'HIGH' ELSE 'NORMAL' END,
        CASE WHEN j % 2 = 0 THEN 'EXPRESS' ELSE 'STANDARD' END,
        NOW()::date - j,
        CASE WHEN delivery_status != 'PENDING' THEN NOW() - INTERVAL '1 day' * j + INTERVAL '9 hours' ELSE NULL END,
        CASE WHEN delivery_status IN ('DELIVERED', 'FAILED') THEN NOW() - INTERVAL '1 day' * j + INTERVAL '15 hours' ELSE NULL END,
        10.0 + (j * 5.0),
        0.2 + (j * 0.1),
        200.00 + (j * 50.00),
        'Entregar no horário comercial',
        'Cliente ' || j,
        '11999' || LPAD((100000 + j)::text, 6, '0'),
        NOW() - INTERVAL '30 days',
        NOW()
      );
      
      -- Adiciona histórico de status
      INSERT INTO delivery_status_history (id, delivery_id, status, changed_at, changed_by, notes, created_at, updated_at)
      VALUES 
        (gen_random_uuid(), delivery_id, 'PENDING', NOW() - INTERVAL '2 days', 'SYSTEM', 'Entrega criada', NOW(), NOW());
      
      IF delivery_status != 'PENDING' THEN
        INSERT INTO delivery_status_history (id, delivery_id, status, changed_at, changed_by, notes, created_at, updated_at)
        VALUES 
          (gen_random_uuid(), delivery_id, 'IN_TRANSIT', NOW() - INTERVAL '1 day', 'SYSTEM', 'Em trânsito', NOW(), NOW());
      END IF;
      
      IF delivery_status IN ('DELIVERED', 'FAILED') THEN
        INSERT INTO delivery_status_history (id, delivery_id, status, changed_at, changed_by, notes, created_at, updated_at)
        VALUES 
          (gen_random_uuid(), delivery_id, delivery_status, NOW() - INTERVAL '12 hours', 'SYSTEM', 
           CASE delivery_status WHEN 'DELIVERED' THEN 'Entrega concluída' ELSE 'Falha na entrega' END, 
           NOW(), NOW());
           
        -- Adiciona tentativa de entrega
        INSERT INTO delivery_attempts (
          id, delivery_id, attempt_number, attempt_datetime, status, 
          failure_reason, notes, created_at, updated_at
        )
        VALUES (
          gen_random_uuid(), delivery_id, 1, NOW() - INTERVAL '12 hours',
          CASE delivery_status WHEN 'DELIVERED' THEN 'SUCCESS' ELSE 'FAILED' END,
          CASE delivery_status WHEN 'FAILED' THEN 'RECIPIENT_UNAVAILABLE' ELSE NULL END,
          CASE delivery_status WHEN 'DELIVERED' THEN 'Entrega realizada' ELSE 'Ninguém para receber' END,
          NOW(), NOW()
        );
      END IF;
      
    END LOOP;
  END LOOP;
END $$;

-- ==================================================
-- VERIFICAÇÃO
-- ==================================================
SELECT 
  'TOTAIS INSERIDOS' as categoria,
  (SELECT COUNT(*) FROM customers) as customers,
  (SELECT COUNT(*) FROM drivers) as drivers,
  (SELECT COUNT(*) FROM vehicles) as vehicles,
  (SELECT COUNT(*) FROM routes) as routes,
  (SELECT COUNT(*) FROM deliveries) as deliveries,
  (SELECT COUNT(*) FROM delivery_attempts) as attempts,
  (SELECT COUNT(*) FROM delivery_status_history) as history;

-- Estatísticas por status
SELECT 
  'DELIVERIES POR STATUS' as info,
  status,
  COUNT(*) as total,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM deliveries), 2) as percentual
FROM deliveries
GROUP BY status
ORDER BY total DESC;
