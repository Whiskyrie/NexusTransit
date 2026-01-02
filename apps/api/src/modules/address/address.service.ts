import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
import { Address } from './entities/address.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { AddressFilterDto } from './dto/address-filter.dto';
import { AddressResponseDto } from './dto/address-response.dto';
import { PaginatedResponseDto } from '@nexus/common';
import { GoogleMapsService, DistanceMatrixResponse, RouteResponse } from '@nexus/geo-services';
import { CepLookupService } from './services/cep-lookup.service';
import { AddressValidationService } from './services/address-validation.service';
import { GeocodingService } from './services/geocoding.service';

/**
 * Serviço de gerenciamento de endereços
 */
@Injectable()
export class AddressService {
  private readonly logger = new Logger(AddressService.name);

  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    private readonly cepLookupService: CepLookupService,
    private readonly addressValidationService: AddressValidationService,
    private readonly geocodingService: GeocodingService,
    private readonly googleMapsService: GoogleMapsService,
  ) {}

  /**
   * Busca endereço por CEP usando CepLookupService
   */
  async searchByCep(cep: string): Promise<AddressResponseDto> {
    this.logger.log(`Buscando endereço por CEP: ${cep}`);

    const cepData = await this.cepLookupService.lookupCep(cep);

    this.logger.log(
      `Endereço encontrado para CEP ${cep}: ${cepData.street}, ${cepData.city}/${cepData.state}`,
    );

    // Criar objeto de resposta
    const response: AddressResponseDto = {
      id: '', // Não tem ID pois não está salvo no banco
      cep: cepData.cep,
      street: cepData.street,
      neighborhood: cepData.neighborhood,
      city: cepData.city,
      state: cepData.state,
      complement: '',
      ibge_code: cepData.ibge_code,
      ddd: cepData.ddd,
      country: 'Brasil',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Tentar obter coordenadas via GeocodingService
    try {
      const geocodingRequest = {
        street: cepData.street,
        neighborhood: cepData.neighborhood,
        city: cepData.city,
        state: cepData.state,
        country: 'BR',
        postal_code: cepData.cep,
      };

      const geocoded = await this.geocodingService.geocode(geocodingRequest);
      response.latitude = geocoded.latitude;
      response.longitude = geocoded.longitude;
      response.formatted_address = geocoded.formatted_address;

      this.logger.log(
        `Coordenadas obtidas para CEP ${cep}: ${response.latitude}, ${response.longitude}`,
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.warn(`Falha ao geocodificar endereço para CEP ${cep}: ${errorMessage}`);
    }

    return response;
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

    const geocoded = await this.geocodingService.geocode({
      street: address,
      neighborhood: '',
      city: '',
      state: '',
      country: 'BR',
    });

    return {
      latitude: geocoded.latitude,
      longitude: geocoded.longitude,
      formatted_address: geocoded.formatted_address,
      place_id: '',
    };
  }

  /**
   * Calcula distância entre dois endereços
   */
  async calculateDistance(
    origin: string,
    destination: string,
    mode?: string,
  ): Promise<DistanceMatrixResponse> {
    this.logger.log(
      `Calculando distância de ${origin} para ${destination} (modo: ${mode ?? 'driving'})`,
    );

    try {
      return await this.googleMapsService.getDistanceMatrix([origin], [destination], mode);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`Erro ao calcular distância: ${errorMessage}`);
      throw new BadRequestException('Erro ao calcular distância');
    }
  }

  /**
   * Calcula rota entre dois endereços
   */
  async calculateRoute(origin: string, destination: string, mode?: string): Promise<RouteResponse> {
    this.logger.log(
      `Calculando rota de ${origin} para ${destination} (modo: ${mode ?? 'driving'})`,
    );

    try {
      return await this.googleMapsService.getRoutes(origin, destination, mode);
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

    // Autocompletar dados com CEP se necessário
    if (createDto.cep && (!createDto.street || !createDto.city)) {
      try {
        const autocompleted = await this.addressValidationService.autocompleteFromCep(
          createDto.cep,
        );

        createDto.street = createDto.street ?? autocompleted.street;
        createDto.neighborhood = createDto.neighborhood ?? autocompleted.neighborhood;
        createDto.city = createDto.city ?? autocompleted.city;
        createDto.state = createDto.state ?? autocompleted.state;
        createDto.ibge_code = createDto.ibge_code ?? autocompleted.ibge_code;
        createDto.ddd = createDto.ddd ?? autocompleted.ddd;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        this.logger.warn(`Falha ao autocompletar com CEP: ${errorMessage}`);
      }
    }

    // Geocodificar se não tem coordenadas
    if (!createDto.latitude || !createDto.longitude) {
      try {
        const geocoded = await this.geocodingService.geocode({
          street: createDto.street,
          number: createDto.number,
          neighborhood: createDto.neighborhood,
          city: createDto.city,
          state: createDto.state,
          country: createDto.country ?? 'BR',
          postal_code: createDto.cep,
        });

        createDto.latitude = geocoded.latitude;
        createDto.longitude = geocoded.longitude;
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
        const geocoded = await this.geocodingService.geocode({
          street: updateDto.street ?? address.street,
          number: updateDto.number ?? address.number,
          neighborhood: updateDto.neighborhood ?? address.neighborhood,
          city: updateDto.city ?? address.city,
          state: updateDto.state ?? address.state,
          country: updateDto.country ?? address.country ?? 'BR',
          postal_code: updateDto.cep ?? address.cep,
        });

        updateDto.latitude = geocoded.latitude;
        updateDto.longitude = geocoded.longitude;
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
