import { Injectable } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  create(_createCustomerDto: CreateCustomerDto): string {
    return 'This action adds a new customer';
  }

  findAll(): string {
    return `This action returns all customers`;
  }

  findOne(id: number): string {
    return `This action returns a #${id} customer`;
  }

  update(id: number, _updateCustomerDto: UpdateCustomerDto): string {
    return `This action updates a #${id} customer`;
  }

  remove(id: number): string {
    return `This action removes a #${id} customer`;
  }
}
