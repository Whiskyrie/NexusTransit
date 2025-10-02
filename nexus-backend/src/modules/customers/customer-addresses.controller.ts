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
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CustomerAddress } from './entities/customer-address.entity';
import { CustomersService } from './customers.service';
import { CreateCustomerAddressDto } from './dto/create-customer-address.dto';
import { UpdateCustomerAddressDto } from './dto/update-customer-address.dto';

@ApiTags('Customer Addresses')
@Controller('customers/:customerId/addresses')
export class CustomerAddressesController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new address for a customer' })
  @ApiParam({ name: 'customerId', description: 'Customer UUID' })
  @ApiResponse({ status: 201, description: 'Address created successfully', type: CustomerAddress })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async create(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Body() createAddressDto: CreateCustomerAddressDto,
  ): Promise<CustomerAddress> {
    try {
      return await this.customersService.createAddress(customerId, createAddressDto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all addresses for a customer' })
  @ApiParam({ name: 'customerId', description: 'Customer UUID' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by address type' })
  @ApiQuery({ name: 'isPrimary', required: false, description: 'Filter by primary address' })
  @ApiResponse({ status: 200, description: 'List of addresses', type: [CustomerAddress] })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async findAll(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Query('type') type?: string,
    @Query('isPrimary') isPrimary?: string,
  ): Promise<CustomerAddress[]> {
    const filters = {
      type,
      isPrimary: isPrimary === 'true',
    };

    return await this.customersService.findAddressesByCustomer(customerId, filters);
  }

  @Get('primary')
  @ApiOperation({ summary: 'Get primary address for a customer' })
  @ApiParam({ name: 'customerId', description: 'Customer UUID' })
  @ApiResponse({ status: 200, description: 'Primary address', type: CustomerAddress })
  @ApiResponse({ status: 404, description: 'Customer or primary address not found' })
  async findPrimary(
    @Param('customerId', ParseUUIDPipe) customerId: string,
  ): Promise<CustomerAddress> {
    return await this.customersService.findPrimaryAddress(customerId);
  }

  @Get(':addressId')
  @ApiOperation({ summary: 'Get a specific address' })
  @ApiParam({ name: 'customerId', description: 'Customer UUID' })
  @ApiParam({ name: 'addressId', description: 'Address UUID' })
  @ApiResponse({ status: 200, description: 'Address details', type: CustomerAddress })
  @ApiResponse({ status: 404, description: 'Customer or address not found' })
  async findOne(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
  ): Promise<CustomerAddress> {
    return await this.customersService.findAddressById(customerId, addressId);
  }

  @Patch(':addressId')
  @ApiOperation({ summary: 'Update an address' })
  @ApiParam({ name: 'customerId', description: 'Customer UUID' })
  @ApiParam({ name: 'addressId', description: 'Address UUID' })
  @ApiResponse({ status: 200, description: 'Address updated successfully', type: CustomerAddress })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Customer or address not found' })
  async update(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
    @Body() updateAddressDto: UpdateCustomerAddressDto,
  ): Promise<CustomerAddress> {
    try {
      return await this.customersService.updateAddress(customerId, addressId, updateAddressDto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Patch(':addressId/set-primary')
  @ApiOperation({ summary: 'Set an address as primary' })
  @ApiParam({ name: 'customerId', description: 'Customer UUID' })
  @ApiParam({ name: 'addressId', description: 'Address UUID' })
  @ApiResponse({
    status: 200,
    description: 'Address set as primary successfully',
    type: CustomerAddress,
  })
  @ApiResponse({ status: 404, description: 'Customer or address not found' })
  async setPrimary(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
  ): Promise<CustomerAddress> {
    return await this.customersService.setPrimaryAddress(customerId, addressId);
  }

  @Delete(':addressId')
  @ApiOperation({ summary: 'Delete an address' })
  @ApiParam({ name: 'customerId', description: 'Customer UUID' })
  @ApiParam({ name: 'addressId', description: 'Address UUID' })
  @ApiResponse({ status: 200, description: 'Address deleted successfully' })
  @ApiResponse({ status: 404, description: 'Customer or address not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete primary address' })
  async remove(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
  ): Promise<void> {
    try {
      await this.customersService.removeAddress(customerId, addressId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
