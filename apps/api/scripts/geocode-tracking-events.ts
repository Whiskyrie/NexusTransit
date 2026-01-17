import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { TrackingEvent } from '../src/modules/tracking/entities/tracking-event.entity';
import { GeocodingService } from '../src/modules/address/services/geocoding.service';

// Mapeamento de endereços conhecidos para economizar chamadas à API
const KNOWN_ADDRESSES: Record<string, { lat: number; lng: number }> = {
  'Centro de Distribuição - Av. das Nações, 1000, São Paulo, SP': {
    lat: -23.5505,
    lng: -46.6333,
  },
  'Hub Logístico - Rod. Anhanguera, km 45, Campinas, SP': {
    lat: -22.9099,
    lng: -47.0626,
  },
  'Base de Operações - Av. Brasil, 5000, Rio de Janeiro, RJ': {
    lat: -22.9068,
    lng: -43.1729,
  },
  'Próximo ao destino final, Curitiba, PR': {
    lat: -25.4284,
    lng: -49.2733,
  },
  'Endereço de entrega, Curitiba, PR': {
    lat: -25.4284,
    lng: -49.2733,
  },
};

/**
 * Script para fazer geocoding de eventos de rastreamento existentes
 * que possuem endereço mas não possuem coordenadas
 */
async function geocodeTrackingEvents() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const useCache = !args.includes('--no-cache');

  console.log('🚀 Iniciando geocoding de eventos de rastreamento...');
  if (isDryRun) {
    console.log('⚠️  MODO DRY-RUN - Nenhuma alteração será feita\n');
  }
  if (useCache) {
    console.log(`📦 Usando cache de ${Object.keys(KNOWN_ADDRESSES).length} endereços conhecidos\n`);
  }

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const geocodingService = app.get(GeocodingService);

  try {
    // Buscar eventos sem coordenadas mas com endereço
    const events = await dataSource
      .getRepository(TrackingEvent)
      .createQueryBuilder('event')
      .where('event.location IS NULL')
      .andWhere('event.location_address IS NOT NULL')
      .andWhere("event.location_address != ''")
      .getMany();

    console.log(`📍 Encontrados ${events.length} eventos para geocodificar\n`);

    if (events.length === 0) {
      console.log('✅ Nenhum evento precisa de geocoding!');
      await app.close();
      return;
    }

    // Agrupar eventos por endereço para otimizar
    const eventsByAddress = new Map<string, TrackingEvent[]>();
    for (const event of events) {
      const address = event.location_address || '';
      if (!eventsByAddress.has(address)) {
        eventsByAddress.set(address, []);
      }
      eventsByAddress.get(address)!.push(event);
    }

    console.log(`🔍 ${eventsByAddress.size} endereços únicos encontrados`);

    const knownAddressesFound = Array.from(eventsByAddress.keys()).filter(
      addr => KNOWN_ADDRESSES[addr],
    );
    const knownAddressCount = knownAddressesFound.reduce(
      (sum, addr) => sum + (eventsByAddress.get(addr)?.length || 0),
      0,
    );
    const apiCallsNeeded = events.length - knownAddressCount;

    console.log(`📦 ${knownAddressCount} eventos com endereços conhecidos (sem custo)`);
    console.log(`🌐 ${apiCallsNeeded} eventos precisarão de geocoding API`);
    console.log(`💰 Custo estimado: ~$${((apiCallsNeeded / 1000) * 5).toFixed(2)} USD\n`);

    if (isDryRun) {
      console.log('═══════════════════════════════════════════════');
      console.log('📊 ANÁLISE (DRY-RUN)');
      console.log('═══════════════════════════════════════════════');
      console.log('Endereços conhecidos que serão usados:');
      knownAddressesFound.forEach(addr => {
        const count = eventsByAddress.get(addr)?.length || 0;
        console.log(`  ✅ ${count}x: ${addr}`);
      });
      console.log('\nEndereços que precisarão de API:');
      Array.from(eventsByAddress.keys())
        .filter(addr => !KNOWN_ADDRESSES[addr])
        .slice(0, 10)
        .forEach(addr => {
          const count = eventsByAddress.get(addr)?.length || 0;
          console.log(`  🌐 ${count}x: ${addr}`);
        });
      if (eventsByAddress.size > 10) {
        console.log(`  ... e mais ${eventsByAddress.size - 10} endereços`);
      }
      console.log('\n⚠️  Execute sem --dry-run para aplicar as mudanças');
      await app.close();
      return;
    }

    let successCount = 0;
    let failCount = 0;
    let cacheHits = 0;
    const failedEvents: Array<{ id: string; address: string; error: string }> = [];

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      console.log(`[${i + 1}/${events.length}] Processando evento ${event.event_id}...`);
      console.log(`   Endereço: ${event.location_address}`);

      try {
        let latitude: number;
        let longitude: number;

        // Verificar se é um endereço conhecido
        if (useCache && KNOWN_ADDRESSES[event.location_address || '']) {
          const coords = KNOWN_ADDRESSES[event.location_address!];
          latitude = coords.lat;
          longitude = coords.lng;
          console.log(`   📦 Cache: ${latitude}, ${longitude}`);
          cacheHits++;
        } else {
          // Parsear endereço para extrair componentes
          const addressParts = event.location_address?.split(',').map(p => p.trim()) || [];

          // Tentar extrair cidade e estado do final do endereço
          let city = '';
          let state = '';
          let street = event.location_address || '';

          if (addressParts.length >= 2) {
            const lastPart = addressParts[addressParts.length - 1];
            if (lastPart.length === 2) {
              state = lastPart;
              addressParts.pop();
            }

            if (addressParts.length > 0) {
              city = addressParts[addressParts.length - 1];
              addressParts.pop();
            }

            if (addressParts.length > 0) {
              street = addressParts.join(', ');
            }
          }

          if (!city || !state) {
            street = event.location_address || '';
            city = 'Brasil';
            state = 'SP';
          }

          // Fazer geocoding do endereço
          const result = await geocodingService.geocode({
            street,
            neighborhood: '',
            city,
            state,
          });

          if (!result.latitude || !result.longitude) {
            throw new Error('Geocoding não retornou coordenadas');
          }

          latitude = result.latitude;
          longitude = result.longitude;
          console.log(`   🌐 API: ${latitude}, ${longitude}`);
        }

        // Atualizar evento com coordenadas usando query raw para PostGIS
        await dataSource.query(
          `UPDATE tracking_events 
           SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326)
           WHERE event_id = $3 AND timestamp = $4`,
          [longitude, latitude, event.event_id, event.timestamp],
        );

        console.log(`   ✅ Salvo`);
        successCount++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        console.log(`   ❌ Falha: ${errorMessage}`);
        failCount++;
        failedEvents.push({
          id: event.event_id,
          address: event.location_address || '',
          error: errorMessage,
        });
      }

      // Aguardar um pouco para não sobrecarregar a API do Google Maps
      if (i < events.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      console.log('');
    }

    // Resumo
    console.log('═══════════════════════════════════════════════');
    console.log('📊 RESUMO DO GEOCODING');
    console.log('═══════════════════════════════════════════════');
    console.log(`✅ Sucesso: ${successCount}`);
    console.log(`📦 Cache:   ${cacheHits}`);
    console.log(`❌ Falhas:  ${failCount}`);
    console.log(`📍 Total:   ${events.length}\n`);

    if (failedEvents.length > 0) {
      console.log('❌ Eventos que falharam:');
      failedEvents.forEach(({ id, address, error }) => {
        console.log(`   - ${id}: ${address}`);
        console.log(`     Erro: ${error}\n`);
      });
    }

    console.log('✅ Script finalizado!');
  } catch (error) {
    console.error('❌ Erro ao executar script:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Executar script
geocodeTrackingEvents()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
