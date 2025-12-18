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
} from '@nestjs/swagger';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { AddressFilterDto } from './dto/address-filter.dto';
import { AddressResponseDto } from './dto/address-response.dto';
import { SearchCepDto } from './dto/search-cep.dto';
import { GeocodeDto } from './dto/geocode.dto';
import { CalculateDistanceDto } from './dto/calculate-distance.dto';
import { PaginatedResponseDto } from '@nexus/common';

/**
 * Controller de gerenciamento de endereços
 */
@ApiTags('Addresses')
@Controller('addresses')
@ApiBearerAuth()
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post('search-cep')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Buscar endereço por CEP',
    description: 'Consulta dados de endereço através do CEP usando ViaCEP',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Endereço encontrado',
    type: AddressResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'CEP inválido ou não encontrado',
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
  })
  @ApiBadRequestResponse({
    description: 'Endereço inválido ou não encontrado',
  })
  async geocode(@Body() geocodeDto: GeocodeDto): Promise<any> {
    return this.addressService.geocodeAddress(geocodeDto.address);
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
  async calculateDistance(@Body() calculateDistanceDto: CalculateDistanceDto): Promise<any> {
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
  async calculateRoute(@Body() calculateDistanceDto: CalculateDistanceDto): Promise<any> {
    return this.addressService.calculateRoute(
      calculateDistanceDto.origin,
      calculateDistanceDto.destination,
      calculateDistanceDto.mode,
    );
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
