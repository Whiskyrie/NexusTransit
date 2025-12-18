import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
import { Address } from './entities/address.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { AddressFilterDto } from './dto/address-filter.dto';
import { AddressResponseDto } from './dto/address-response.dto';
import { PaginatedResponseDto } from '@nexus/common';
import {
  ViaCepService,
  GoogleMapsService,
  DistanceMatrixResponse,
  RouteResponse,
} from '@nexus/geo-services';

/**
 * Serviço de gerenciamento de endereços
 */
@Injectable()
export class AddressService {
  private readonly logger = new Logger(AddressService.name);

  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    private readonly viaCepService: ViaCepService,
    private readonly googleMapsService: GoogleMapsService,
  ) {}

  /**
   * Busca endereço por CEP usando ViaCEP
   */
  async searchByCep(cep: string): Promise<AddressResponseDto> {
    this.logger.log(`Buscando endereço por CEP: ${cep}`);

    try {
      const viaCepData = await this.viaCepService.getAddressByZipCode(cep);

      // Criar objeto de resposta
      const response: AddressResponseDto = {
        id: '', // Não tem ID pois não está salvo no banco
        cep: viaCepData.zipCode,
        street: viaCepData.street,
        neighborhood: viaCepData.neighborhood,
        city: viaCepData.city,
        state: viaCepData.state,
        complement: viaCepData.complement,
        ibge_code: viaCepData.ibgeCode,
        ddd: viaCepData.ddd,
        country: 'Brasil',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Tentar obter coordenadas via Google Maps
      const fullAddress = `${viaCepData.street}, ${viaCepData.neighborhood}, ${viaCepData.city}, ${viaCepData.state}`;
      try {
        const geocoded = await this.googleMapsService.geocode(fullAddress);
        if (geocoded?.results?.length && geocoded.results.length > 0) {
          const result = geocoded.results[0];
          response.latitude = result.geometry.location.lat;
          response.longitude = result.geometry.location.lng;
          response.formatted_address = result.formatted_address;
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        this.logger.warn(`Falha ao geocodificar endereço: ${errorMessage}`);
      }

      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`Erro ao buscar CEP: ${errorMessage}`);
      throw new BadRequestException('CEP não encontrado ou inválido');
    }
  }

  /**
   * Geocodifica um endereço completo
   */
  async geocodeAddress(address: string): Promise<{
    latitude: number;
    longitude: number;
    formatted_address: string;
    place_id: string;
  }> {
    this.logger.log(`Geocodificando endereço: ${address}`);

    try {
      const response = await this.googleMapsService.geocode(address);

      if (response.results && response.results.length > 0) {
        const result = response.results[0];
        return {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
          formatted_address: result.formatted_address,
          place_id: result.place_id,
        };
      }

      throw new BadRequestException('Endereço não encontrado');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`Erro ao geocodificar endereço: ${errorMessage}`);
      throw new BadRequestException('Endereço não encontrado');
    }
  }

  /**
   * Calcula distância entre dois endereços
   */
  async calculateDistance(origin: string, destination: string): Promise<DistanceMatrixResponse> {
    this.logger.log(`Calculando distância de ${origin} para ${destination}`);

    try {
      return await this.googleMapsService.getDistanceMatrix([origin], [destination]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`Erro ao calcular distância: ${errorMessage}`);
      throw new BadRequestException('Erro ao calcular distância');
    }
  }

  /**
   * Calcula rota entre dois endereços
   */
  async calculateRoute(origin: string, destination: string): Promise<RouteResponse> {
    this.logger.log(`Calculando rota de ${origin} para ${destination}`);

    try {
      return await this.googleMapsService.getRoutes(origin, destination);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`Erro ao calcular rota: ${errorMessage}`);
      throw new BadRequestException('Erro ao calcular rota');
    }
  }

  /**
   * Cria um novo endereço
   */
  async create(createDto: CreateAddressDto): Promise<AddressResponseDto> {
    this.logger.log('Criando novo endereço');

    // Se tem CEP mas faltam dados, buscar no ViaCEP
    if (createDto.cep && (!createDto.street || !createDto.city)) {
      try {
        const viaCepData = await this.viaCepService.getAddressByZipCode(createDto.cep);
        createDto.street = createDto.street || viaCepData.street;
        createDto.neighborhood = createDto.neighborhood || viaCepData.neighborhood;
        createDto.city = createDto.city || viaCepData.city;
        createDto.state = createDto.state || viaCepData.state;
        createDto.ibge_code = createDto.ibge_code ?? viaCepData.ibgeCode;
        createDto.ddd = createDto.ddd ?? viaCepData.ddd;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        this.logger.warn(`Falha ao buscar CEP: ${errorMessage}`);
      }
    }

    // Se não tem coordenadas, tentar geocodificar
    if (!createDto.latitude || !createDto.longitude) {
      try {
        const fullAddress = `${createDto.street}, ${createDto.number ?? ''}, ${createDto.neighborhood}, ${createDto.city}, ${createDto.state}`;
        const geocoded = await this.googleMapsService.geocode(fullAddress);
        if (geocoded?.results?.length && geocoded.results.length > 0) {
          const result = geocoded.results[0];
          createDto.latitude = result.geometry.location.lat;
          createDto.longitude = result.geometry.location.lng;
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        this.logger.warn(`Falha ao geocodificar: ${errorMessage}`);
      }
    }

    const address = this.addressRepository.create(createDto);
    const saved = await this.addressRepository.save(address);

    this.logger.log(`Endereço criado: ${saved.id}`);

    return this.mapToResponseDto(saved);
  }

  /**
   * Lista endereços com filtros e paginação
   */
  async findAll(filterDto: AddressFilterDto): Promise<PaginatedResponseDto<AddressResponseDto>> {
    const { page = 1, limit = 10, search, ...filters } = filterDto;

    const where: FindOptionsWhere<Address> = {};

    if (search) {
      where.street = ILike(`%${search}%`);
    }

    if (filters.cep) {
      where.cep = filters.cep;
    }

    if (filters.city) {
      where.city = ILike(`%${filters.city}%`);
    }

    if (filters.state) {
      where.state = filters.state;
    }

    if (filters.neighborhood) {
      where.neighborhood = ILike(`%${filters.neighborhood}%`);
    }

    if (filters.street) {
      where.street = ILike(`%${filters.street}%`);
    }

    if (filters.is_active !== undefined) {
      where.is_active = filters.is_active;
    }

    const [addresses, total] = await this.addressRepository.findAndCount({
      where,
      take: limit,
      skip: (page - 1) * limit,
      order: { created_at: 'DESC' },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: addresses.map(a => this.mapToResponseDto(a)),
      meta: {
        page,
        limit,
        total,
        total_pages: totalPages,
        has_previous: page > 1,
        has_next: page < totalPages,
      },
    };
  }

  /**
   * Busca um endereço por ID
   */
  async findOne(id: string): Promise<AddressResponseDto> {
    const address = await this.addressRepository.findOne({
      where: { id },
    });

    if (!address) {
      throw new NotFoundException(`Endereço com ID ${id} não encontrado`);
    }

    return this.mapToResponseDto(address);
  }

  /**
   * Atualiza um endereço
   */
  async update(id: string, updateDto: UpdateAddressDto): Promise<AddressResponseDto> {
    const address = await this.findAddressOrFail(id);

    // Se mudou o endereço, tentar geocodificar novamente
    if (updateDto.street || updateDto.number || updateDto.city || updateDto.state) {
      try {
        const fullAddress = `${updateDto.street ?? address.street}, ${updateDto.number ?? address.number ?? ''}, ${updateDto.neighborhood ?? address.neighborhood}, ${updateDto.city ?? address.city}, ${updateDto.state ?? address.state}`;
        const geocoded = await this.googleMapsService.geocode(fullAddress);
        if (geocoded?.results?.length && geocoded.results.length > 0) {
          const result = geocoded.results[0];
          updateDto.latitude = result.geometry.location.lat;
          updateDto.longitude = result.geometry.location.lng;
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        this.logger.warn(`Falha ao geocodificar: ${errorMessage}`);
      }
    }

    Object.assign(address, updateDto);
    const updated = await this.addressRepository.save(address);

    this.logger.log(`Endereço atualizado: ${id}`);

    return this.mapToResponseDto(updated);
  }

  /**
   * Remove um endereço (soft delete)
   */
  async remove(id: string): Promise<void> {
    const address = await this.findAddressOrFail(id);

    await this.addressRepository.softRemove(address);

    this.logger.log(`Endereço removido: ${id}`);
  }

  /**
   * Busca endereço ou lança exceção
   */
  private async findAddressOrFail(id: string): Promise<Address> {
    const address = await this.addressRepository.findOne({ where: { id } });

    if (!address) {
      throw new NotFoundException(`Endereço com ID ${id} não encontrado`);
    }

    return address;
  }

  /**
   * Mapeia entidade para DTO de resposta
   */
  private mapToResponseDto(address: Address): AddressResponseDto {
    const dto = new AddressResponseDto();
    Object.assign(dto, address);
    return dto;
  }
}
