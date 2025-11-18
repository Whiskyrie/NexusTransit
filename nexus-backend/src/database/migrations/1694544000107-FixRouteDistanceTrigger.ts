import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class FixRouteDistanceTrigger1694544000107 implements MigrationInterface {
  name = 'FixRouteDistanceTrigger1694544000107';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Remover trigger antigo que usa PostGIS
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS calculate_route_distance_trigger ON routes
    `);

    // 2. Remover função antiga que usa PostGIS
    await queryRunner.query(`
      DROP FUNCTION IF EXISTS calculate_route_distance()
    `);

    // 3. Criar nova função usando tipo POINT nativo do PostgreSQL
    // POINT nativo usa operadores diferentes: point[0] para X, point[1] para Y
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION calculate_route_distance()
      RETURNS TRIGGER AS $$
      DECLARE
        lat1 FLOAT;
        lon1 FLOAT;
        lat2 FLOAT;
        lon2 FLOAT;
        earth_radius FLOAT := 6371; -- Raio da Terra em km
        dlat FLOAT;
        dlon FLOAT;
        a FLOAT;
        c FLOAT;
      BEGIN
        -- Calcular distância automática se as coordenadas foram fornecidas
        IF NEW.origin_coordinates IS NOT NULL AND NEW.destination_coordinates IS NOT NULL THEN
          -- Extrair coordenadas do tipo POINT nativo
          -- POINT(x,y) onde x é latitude e y é longitude
          lat1 := NEW.origin_coordinates[0];
          lon1 := NEW.origin_coordinates[1];
          lat2 := NEW.destination_coordinates[0];
          lon2 := NEW.destination_coordinates[1];
          
          -- Fórmula de Haversine para calcular distância entre dois pontos na Terra
          dlat := radians(lat2 - lat1);
          dlon := radians(lon2 - lon1);
          
          a := sin(dlat/2) * sin(dlat/2) + 
               cos(radians(lat1)) * cos(radians(lat2)) * 
               sin(dlon/2) * sin(dlon/2);
          c := 2 * atan2(sqrt(a), sqrt(1-a));
          
          NEW.estimated_distance_km := earth_radius * c;
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 4. Criar novo trigger
    await queryRunner.query(`
      CREATE TRIGGER calculate_route_distance_trigger
        BEFORE INSERT OR UPDATE ON routes
        FOR EACH ROW
        WHEN (NEW.origin_coordinates IS NOT NULL AND NEW.destination_coordinates IS NOT NULL)
        EXECUTE FUNCTION calculate_route_distance()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover trigger novo
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS calculate_route_distance_trigger ON routes
    `);

    // Remover função nova
    await queryRunner.query(`
      DROP FUNCTION IF EXISTS calculate_route_distance()
    `);

    // Recriar função antiga com PostGIS (mesmo que não funcione, para manter consistência)
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION calculate_route_distance()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.origin_coordinates IS NOT NULL AND NEW.destination_coordinates IS NOT NULL THEN
          NEW.distance_km = ST_Distance(
            ST_Transform(ST_GeomFromText('POINT(' || ST_X(NEW.origin_coordinates) || ' ' || ST_Y(NEW.origin_coordinates) || ')', 4326), 3857),
            ST_Transform(ST_GeomFromText('POINT(' || ST_X(NEW.destination_coordinates) || ' ' || ST_Y(NEW.destination_coordinates) || ')', 4326), 3857)
          ) / 1000;
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Recriar trigger antigo
    await queryRunner.query(`
      CREATE TRIGGER calculate_route_distance_trigger
        BEFORE INSERT OR UPDATE ON routes
        FOR EACH ROW
        WHEN (NEW.origin_coordinates IS NOT NULL AND NEW.destination_coordinates IS NOT NULL)
        EXECUTE FUNCTION calculate_route_distance()
    `);
  }
}
