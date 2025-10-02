import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Like, FindOptionsWhere } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CustomerAddress } from './entities/customer-address.entity';
import { CustomerContact } from './entities/customer-contact.entity';
import { CustomerPreferences } from './entities/customer-preferences.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerFilterDto } from './dto/customer-filter.dto';
import { CustomerStatus } from './enums/customer-status.enum';
import { AddressType } from './enums/address-type.enum';
import { ViaCepService } from './services/viacep.service';
import { GeocodingService } from './services/geocoding.service';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(CustomerAddress)
    private readonly addressRepository: Repository<CustomerAddress>,
    @InjectRepository(CustomerContact)
    private readonly contactRepository: Repository<CustomerContact>,
    @InjectRepository(CustomerPreferences)
    private readonly preferencesRepository: Repository<CustomerPreferences>,
    private readonly viaCepService: ViaCepService,
    private readonly geocodingService: GeocodingService,
    private readonly dataSource: DataSource,
  ) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if customer already exists
      const existingCustomer = await this.customerRepository.findOne({
        where: [{ taxId: createCustomerDto.taxId }, { email: createCustomerDto.email }],
      });

      if (existingCustomer) {
        if (existingCustomer.taxId === createCustomerDto.taxId) {
          throw new ConflictException('Customer with this tax ID already exists');
        }
        if (existingCustomer.email === createCustomerDto.email) {
          throw new ConflictException('Customer with this email already exists');
        }
      }

      // Create customer
      const {
        addresses: _addresses,
        contacts: _contacts,
        preferences: _preferences,
        ...customerData
      } = createCustomerDto;
      const customer = this.customerRepository.create(customerData);
      const savedCustomer = await queryRunner.manager.save(customer);

      // Process addresses if provided
      if (createCustomerDto.addresses && createCustomerDto.addresses.length > 0) {
        for (const addressDto of createCustomerDto.addresses) {
          // Validate CEP and fetch address data
          if (addressDto.zipCode) {
            try {
              const addressData = await this.viaCepService.validateAndFetchAddress(
                addressDto.zipCode,
              );

              // Merge fetched data with provided data
              Object.assign(addressDto, {
                street: addressDto.street ?? addressData.logradouro,
                neighborhood: addressDto.neighborhood ?? addressData.bairro,
                city: addressDto.city ?? addressData.localidade,
                state: addressDto.state ?? addressData.uf,
              });
            } catch (error) {
              // Continue with provided data if CEP validation fails
              console.warn(`CEP validation failed for ${addressDto.zipCode}:`, error);
            }
          }

          // Geocode address
          if (addressDto.street && addressDto.zipCode) {
            try {
              const coords = await this.geocodingService.geocodeAddress({
                street: addressDto.street ?? '',
                number: addressDto.number ?? '',
                neighborhood: addressDto.neighborhood ?? '',
                city: addressDto.city ?? '',
                state: addressDto.state ?? '',
                zipCode: addressDto.zipCode,
              });
              addressDto.latitude = coords.latitude;
              addressDto.longitude = coords.longitude;
            } catch (error) {
              console.warn('Geocoding failed:', error);
            }
          }

          const address = this.addressRepository.create({
            ...addressDto,
            customerId: savedCustomer.id,
          });
          await queryRunner.manager.save(address);
        }
      }

      // Process contacts if provided
      if (createCustomerDto.contacts && createCustomerDto.contacts.length > 0) {
        for (const contactDto of createCustomerDto.contacts) {
          const contact = this.contactRepository.create({
            ...contactDto,
            customerId: savedCustomer.id,
          });
          await queryRunner.manager.save(contact);
        }
      }

      // Process preferences if provided
      if (createCustomerDto.preferences) {
        const preferences = this.preferencesRepository.create({
          ...createCustomerDto.preferences,
          customerId: savedCustomer.id,
        });
        await queryRunner.manager.save(preferences);
      }

      await queryRunner.commitTransaction();

      // Return customer with all relations
      return this.findOne(savedCustomer.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to create customer');
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(filter: CustomerFilterDto): Promise<{
    data: Customer[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      type,
      category,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filter;

    const skip = (page - 1) * limit;
    const where: FindOptionsWhere<Customer> = {};

    // Build where conditions
    if (search) {
      where.name = Like(`%${search}%`);
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (category) {
      where.category = category;
    }

    // Execute query with pagination
    const [data, total] = await this.customerRepository.findAndCount({
      where,
      relations: ['addresses', 'contacts', 'preferences'],
      order: {
        [sortBy]: sortOrder.toUpperCase() as 'ASC' | 'DESC',
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: ['addresses', 'contacts', 'preferences'],
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const customer = await this.customerRepository.findOne({
        where: { id },
        relations: ['addresses', 'contacts', 'preferences'],
      });

      if (!customer) {
        throw new NotFoundException(`Customer with ID ${id} not found`);
      }

      // Check for conflicts with taxId or email
      if (updateCustomerDto.taxId || updateCustomerDto.email) {
        const existingCustomer = await this.customerRepository.findOne({
          where: [{ taxId: updateCustomerDto.taxId }, { email: updateCustomerDto.email }],
        });

        if (existingCustomer && existingCustomer.id !== id) {
          if (existingCustomer.taxId === updateCustomerDto.taxId) {
            throw new ConflictException('Customer with this tax ID already exists');
          }
          if (existingCustomer.email === updateCustomerDto.email) {
            throw new ConflictException('Customer with this email already exists');
          }
        }
      }

      // Update customer
      Object.assign(customer, updateCustomerDto);
      await queryRunner.manager.save(customer);

      // Process addresses updates if provided
      if (updateCustomerDto.addresses) {
        // Remove existing addresses
        await queryRunner.manager.delete(CustomerAddress, { customerId: id });

        // Add new addresses
        for (const addressDto of updateCustomerDto.addresses) {
          const address = this.addressRepository.create({
            ...addressDto,
            customerId: id,
          });
          await queryRunner.manager.save(address);
        }
      }

      // Process contacts updates if provided
      if (updateCustomerDto.contacts) {
        // Remove existing contacts
        await queryRunner.manager.delete(CustomerContact, { customerId: id });

        // Add new contacts
        for (const contactDto of updateCustomerDto.contacts) {
          const contact = this.contactRepository.create({
            ...contactDto,
            customerId: id,
          });
          await queryRunner.manager.save(contact);
        }
      }

      // Process preferences updates if provided
      if (updateCustomerDto.preferences) {
        // Remove existing preferences
        await queryRunner.manager.delete(CustomerPreferences, { customerId: id });

        // Add new preferences
        const preferences = this.preferencesRepository.create({
          ...updateCustomerDto.preferences,
          customerId: id,
        });
        await queryRunner.manager.save(preferences);
      }

      await queryRunner.commitTransaction();

      // Return updated customer with all relations
      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to update customer');
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string): Promise<void> {
    const customer = await this.customerRepository.findOne({ where: { id } });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    try {
      // Soft delete by setting status to INACTIVE and deletedAt
      customer.status = CustomerStatus.INACTIVE;
      customer.deletedAt = new Date();
      await this.customerRepository.save(customer);
    } catch {
      throw new InternalServerErrorException('Failed to delete customer');
    }
  }

  async restore(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    if (!customer.deletedAt) {
      throw new BadRequestException('Customer is not deleted');
    }

    try {
      customer.status = CustomerStatus.ACTIVE;
      delete customer.deletedAt;
      await this.customerRepository.save(customer);

      return this.findOne(id);
    } catch {
      throw new InternalServerErrorException('Failed to restore customer');
    }
  }

  async findByTaxId(taxId: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { taxId },
      relations: ['addresses', 'contacts', 'preferences'],
    });

    if (!customer) {
      throw new NotFoundException(`Customer with tax ID ${taxId} not found`);
    }

    return customer;
  }

  async findByEmail(email: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { email },
      relations: ['addresses', 'contacts', 'preferences'],
    });

    if (!customer) {
      throw new NotFoundException(`Customer with email ${email} not found`);
    }

    return customer;
  }

  // Address management methods
  async createAddress(
    customerId: string,
    createAddressDto: Partial<CustomerAddress>,
  ): Promise<CustomerAddress> {
    const customer = await this.customerRepository.findOne({ where: { id: customerId } });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    // Validate CEP and fetch address data
    if (createAddressDto.zipCode) {
      try {
        const addressData = await this.viaCepService.validateAndFetchAddress(
          createAddressDto.zipCode,
        );

        // Merge fetched data with provided data
        Object.assign(createAddressDto, {
          street: createAddressDto.street ?? addressData.logradouro,
          neighborhood: createAddressDto.neighborhood ?? addressData.bairro,
          city: createAddressDto.city ?? addressData.localidade,
          state: createAddressDto.state ?? addressData.uf,
        });
      } catch (error) {
        // Continue with provided data if CEP validation fails
        console.warn(`CEP validation failed for ${createAddressDto.zipCode}:`, error);
      }
    }

    // Geocode address
    if (createAddressDto.street && createAddressDto.zipCode) {
      try {
        const coords = await this.geocodingService.geocodeAddress({
          street: createAddressDto.street ?? '',
          number: createAddressDto.number ?? '',
          neighborhood: createAddressDto.neighborhood ?? '',
          city: createAddressDto.city ?? '',
          state: createAddressDto.state ?? '',
          zipCode: createAddressDto.zipCode,
        });
        createAddressDto.latitude = coords.latitude;
        createAddressDto.longitude = coords.longitude;
      } catch (error) {
        console.warn('Geocoding failed:', error);
      }
    }

    // If setting as primary, unset other primary addresses
    if (createAddressDto.isPrimary) {
      await this.addressRepository.update({ customerId }, { isPrimary: false });
    }

    const address = this.addressRepository.create({
      ...createAddressDto,
      customerId,
    });

    return this.addressRepository.save(address);
  }

  async findAddressesByCustomer(
    customerId: string,
    filters: { type?: string; isPrimary?: boolean },
  ): Promise<CustomerAddress[]> {
    const where: FindOptionsWhere<CustomerAddress> = { customerId, isActive: true };

    if (filters.type) {
      where.type = filters.type as AddressType;
    }

    if (filters.isPrimary !== undefined) {
      where.isPrimary = filters.isPrimary;
    }

    return this.addressRepository.find({
      where,
      order: { isPrimary: 'DESC', createdAt: 'ASC' },
    });
  }

  async findPrimaryAddress(customerId: string): Promise<CustomerAddress> {
    const address = await this.addressRepository.findOne({
      where: { customerId, isPrimary: true, isActive: true },
    });

    if (!address) {
      throw new NotFoundException(`Primary address not found for customer ${customerId}`);
    }

    return address;
  }

  async findAddressById(customerId: string, addressId: string): Promise<CustomerAddress> {
    const address = await this.addressRepository.findOne({
      where: { id: addressId, customerId, isActive: true },
    });

    if (!address) {
      throw new NotFoundException(
        `Address with ID ${addressId} not found for customer ${customerId}`,
      );
    }

    return address;
  }

  async updateAddress(
    customerId: string,
    addressId: string,
    updateAddressDto: Partial<CustomerAddress>,
  ): Promise<CustomerAddress> {
    const address = await this.findAddressById(customerId, addressId);

    // Validate CEP and fetch address data if provided
    if (updateAddressDto.zipCode) {
      try {
        const addressData = await this.viaCepService.validateAndFetchAddress(
          updateAddressDto.zipCode,
        );

        // Merge fetched data with provided data
        Object.assign(updateAddressDto, {
          street: updateAddressDto.street ?? addressData.logradouro,
          neighborhood: updateAddressDto.neighborhood ?? addressData.bairro,
          city: updateAddressDto.city ?? addressData.localidade,
          state: updateAddressDto.state ?? addressData.uf,
        });
      } catch (error) {
        console.warn(`CEP validation failed for ${updateAddressDto.zipCode}:`, error);
      }
    }

    // Geocode address if coordinates not provided but address data is
    if (
      (updateAddressDto.street || address.street) &&
      (updateAddressDto.zipCode || address.zipCode) &&
      !updateAddressDto.latitude &&
      !updateAddressDto.longitude
    ) {
      try {
        const addressData = { ...address, ...updateAddressDto };
        const coords = await this.geocodingService.geocodeAddress(addressData);
        updateAddressDto.latitude = coords.latitude;
        updateAddressDto.longitude = coords.longitude;
      } catch (error) {
        console.warn('Geocoding failed:', error);
      }
    }

    // If setting as primary, unset other primary addresses
    if (updateAddressDto.isPrimary && !address.isPrimary) {
      await this.addressRepository.update({ customerId }, { isPrimary: false });
    }

    Object.assign(address, updateAddressDto);
    return this.addressRepository.save(address);
  }

  async setPrimaryAddress(customerId: string, addressId: string): Promise<CustomerAddress> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Unset all primary addresses for this customer
      await queryRunner.manager.update(CustomerAddress, { customerId }, { isPrimary: false });

      // Set the new primary address
      const address = await queryRunner.manager.findOne(CustomerAddress, {
        where: { id: addressId, customerId, isActive: true },
      });

      if (!address) {
        throw new NotFoundException(
          `Address with ID ${addressId} not found for customer ${customerId}`,
        );
      }

      address.isPrimary = true;
      const updatedAddress = await queryRunner.manager.save(address);

      await queryRunner.commitTransaction();
      return updatedAddress;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async removeAddress(customerId: string, addressId: string): Promise<void> {
    const address = await this.findAddressById(customerId, addressId);

    if (address.isPrimary) {
      throw new BadRequestException(
        'Cannot delete primary address. Set another address as primary first.',
      );
    }

    // Soft delete by setting isActive to false
    address.isActive = false;
    await this.addressRepository.save(address);
  }
}
