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
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerFilterDto } from './dto/customer-filter.dto';
import { CustomerAuditContextInterceptor, CustomerStatusInterceptor } from './interceptors';

@ApiTags('Customers')
@Controller('customers')
@UseInterceptors(CustomerAuditContextInterceptor, CustomerStatusInterceptor)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Customer created successfully',
    type: Customer,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Customer already exists',
  })
  create(@Body() createCustomerDto: CreateCustomerDto): Promise<Customer> {
    return this.customersService.create(createCustomerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all customers with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'inactive', 'blocked', 'prospect'],
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['individual', 'corporate'],
    description: 'Filter by type',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: ['standard', 'premium', 'vip'],
    description: 'Filter by category',
  })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field (default: created_at)' })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order (default: DESC)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customers retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/Customer' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  findAll(@Query() filter: CustomerFilterDto): Promise<{
    data: Customer[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.customersService.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a customer by ID' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer retrieved successfully',
    type: Customer,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customer not found',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Customer> {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a customer' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer updated successfully',
    type: Customer,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customer not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Customer with this tax ID or email already exists',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer> {
    return this.customersService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a customer' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customer not found',
  })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.customersService.remove(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft deleted customer' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer restored successfully',
    type: Customer,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customer not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Customer is not deleted',
  })
  restore(@Param('id', ParseUUIDPipe) id: string): Promise<Customer> {
    return this.customersService.restore(id);
  }

  @Get('tax-id/:taxId')
  @ApiOperation({ summary: 'Find customer by tax ID (CPF/CNPJ)' })
  @ApiParam({ name: 'taxId', description: 'Customer tax ID (CPF/CNPJ)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer retrieved successfully',
    type: Customer,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customer not found',
  })
  findByTaxId(@Param('taxId') taxId: string): Promise<Customer> {
    return this.customersService.findByTaxId(taxId);
  }

  @Get('email/:email')
  @ApiOperation({ summary: 'Find customer by email' })
  @ApiParam({ name: 'email', description: 'Customer email' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer retrieved successfully',
    type: Customer,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customer not found',
  })
  findByEmail(@Param('email') email: string): Promise<Customer> {
    return this.customersService.findByEmail(email);
  }
}
