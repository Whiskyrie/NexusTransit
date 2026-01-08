import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiServiceUnavailableResponse,
} from '@nestjs/swagger';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { AddressFilterDto } from './dto/address-filter.dto';
import { AddressResponseDto } from './dto/address-response.dto';
import { SearchCepDto } from './dto/search-cep.dto';
import { GeocodeDto } from './dto/geocode.dto';
import { CalculateDistanceDto } from './dto/calculate-distance.dto';
import {
  ValidateAddressDto,
  ValidateAddressResponseDto,
  ReverseGeocodeRequestDto,
  ReverseGeocodeResponseDto,
  GeocodeRequestDto,
  GeocodeResponseDto,
  PlaceAutocompleteRequestDto,
  PlaceAutocompleteResponseDto,
  PlaceDetailsRequestDto,
  PlaceDetailsResponseDto,
} from './dto';
import { PaginatedResponseDto } from '@nexus/common';
import type { DistanceMatrixResponse, RouteResponse } from '@nexus/geo-services';
import { AddressValidationService } from './services/address-validation.service';
import { GeocodingService } from './services/geocoding.service';

/**
 * Controller de gerenciamento de endereços
 */
@ApiTags('Addresses')
@Controller('addresses')
@ApiBearerAuth()
export class AddressController {
  constructor(
    private readonly addressService: AddressService,
    private readonly addressValidationService: AddressValidationService,
    private readonly geocodingService: GeocodingService,
  ) {}

  @Post('search-cep')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Buscar endereço por CEP',
    description: 'Consulta dados de endereço através do CEP usando ViaCEP',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Endereço encontrado com sucesso',
    type: AddressResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'CEP inválido (formato incorreto ou fora do range válido)',
  })
  @ApiNotFoundResponse({
    description: 'CEP não encontrado na base dos Correios',
  })
  @ApiServiceUnavailableResponse({
    description: 'Serviço de consulta de CEP temporariamente indisponível',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async searchCep(@Body() searchCepDto: SearchCepDto): Promise<AddressResponseDto> {
    return this.addressService.searchByCep(searchCepDto.cep);
  }

  @Post('geocode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Geocodificar endereço',
    description: 'Converte um endereço em coordenadas geográficas',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Endereço geocodificado com sucesso',
    type: GeocodeResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Endereço inválido ou não encontrado',
  })
  async geocode(@Body() geocodeDto: GeocodeRequestDto): Promise<GeocodeResponseDto> {
    return this.addressService.geocodeAddress(geocodeDto.address);
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validar endereço',
    description:
      'Valida se um endereço possui todos os campos necessários e se os dados são válidos',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Validação concluída',
    type: ValidateAddressResponseDto,
  })
  validateAddress(@Body() address: ValidateAddressDto): ValidateAddressResponseDto {
    const validation = this.addressValidationService.validateAddress({
      street: address.street,
      number: address.number,
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      cep: address.cep,
      latitude: address.latitude,
      longitude: address.longitude,
    });

    return {
      is_valid: validation.isValid,
      errors: validation.errors ?? [],
      warnings: validation.warnings,
    };
  }

  @Post('reverse-geocode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reverse geocoding',
    description: 'Converte coordenadas geográficas em endereço',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Endereço encontrado com sucesso',
    type: ReverseGeocodeResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Coordenadas inválidas',
  })
  async reverseGeocode(
    @Body() coords: ReverseGeocodeRequestDto,
  ): Promise<ReverseGeocodeResponseDto> {
    return this.geocodingService.reverseGeocode({
      latitude: coords.latitude,
      longitude: coords.longitude,
    });
  }

  @Post('calculate-distance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calcular distância entre endereços',
    description: 'Calcula a distância e tempo de viagem entre dois endereços',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Distância calculada com sucesso',
  })
  @ApiBadRequestResponse({
    description: 'Endereços inválidos',
  })
  async calculateDistance(
    @Body() calculateDistanceDto: CalculateDistanceDto,
  ): Promise<DistanceMatrixResponse> {
    return this.addressService.calculateDistance(
      calculateDistanceDto.origin,
      calculateDistanceDto.destination,
      calculateDistanceDto.mode,
    );
  }

  @Post('calculate-route')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calcular rota entre endereços',
    description: 'Calcula a melhor rota entre dois endereços',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rota calculada com sucesso',
  })
  @ApiBadRequestResponse({
    description: 'Endereços inválidos',
  })
  async calculateRoute(@Body() calculateDistanceDto: CalculateDistanceDto): Promise<RouteResponse> {
    return this.addressService.calculateRoute(
      calculateDistanceDto.origin,
      calculateDistanceDto.destination,
      calculateDistanceDto.mode,
    );
  }

  @Post('autocomplete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Autocomplete de endereços',
    description: 'Retorna sugestões de endereços enquanto o usuário digita',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sugestões retornadas com sucesso',
    type: PlaceAutocompleteResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Parâmetros de busca inválidos',
  })
  @ApiNotFoundResponse({
    description: 'Nenhuma sugestão encontrada',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async placeAutocomplete(
    @Body() autocompleteDto: PlaceAutocompleteRequestDto,
  ): Promise<PlaceAutocompleteResponseDto> {
    const options: any = {};

    if (autocompleteDto.types) {
      options.types = autocompleteDto.types;
    }

    if (autocompleteDto.country) {
      options.componentRestrictions = { country: autocompleteDto.country };
    }

    if (autocompleteDto.lat && autocompleteDto.lng) {
      options.location = {
        lat: autocompleteDto.lat,
        lng: autocompleteDto.lng,
      };
    }

    if (autocompleteDto.radius) {
      options.radius = autocompleteDto.radius;
    }

    return this.geocodingService.placeAutocomplete(autocompleteDto.input, options);
  }

  @Post('place-details')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obter detalhes de um lugar',
    description: 'Retorna detalhes completos de um lugar através do place_id',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Detalhes retornados com sucesso',
    type: PlaceDetailsResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Place ID inválido',
  })
  @ApiNotFoundResponse({
    description: 'Lugar não encontrado',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async placeDetails(@Body() detailsDto: PlaceDetailsRequestDto): Promise<PlaceDetailsResponseDto> {
    const result = await this.geocodingService.placeDetails(detailsDto.placeId);

    return {
      formatted_address: result.result.formatted_address,
      geometry: result.result.geometry,
      address_components: result.result.address_components,
      place_id: result.result.place_id,
      types: result.result.types,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar novo endereço',
    description: 'Cria um novo endereço no sistema',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Endereço criado com sucesso',
    type: AddressResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async create(@Body() createDto: CreateAddressDto): Promise<AddressResponseDto> {
    return this.addressService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar endereços',
    description: 'Lista endereços com filtros, paginação e busca',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Número da página',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Itens por página (máximo 100)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de endereços',
    type: [AddressResponseDto],
  })
  async findAll(
    @Query() filterDto: AddressFilterDto,
  ): Promise<PaginatedResponseDto<AddressResponseDto>> {
    return this.addressService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar endereço por ID',
    description: 'Retorna detalhes completos do endereço',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do endereço',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Endereço encontrado',
    type: AddressResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Endereço não encontrado',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<AddressResponseDto> {
    return this.addressService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar endereço',
    description: 'Atualiza campos específicos do endereço',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do endereço',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Endereço atualizado com sucesso',
    type: AddressResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Endereço não encontrado',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateAddressDto,
  ): Promise<AddressResponseDto> {
    return this.addressService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover endereço',
    description: 'Soft delete do endereço',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do endereço',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Endereço removido com sucesso',
  })
  @ApiNotFoundResponse({
    description: 'Endereço não encontrado',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.addressService.remove(id);
  }
}
