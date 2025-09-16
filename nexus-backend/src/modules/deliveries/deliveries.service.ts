/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Injectable } from '@nestjs/common';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';

@Injectable()
export class DeliveriesService {
  create(_createDeliveryDto: CreateDeliveryDto) {
    return 'This action adds a new delivery';
  }

  findAll() {
    return `This action returns all deliveries`;
  }

  findOne(id: number) {
    return `This action returns a #${id} delivery`;
  }

  update(id: number, _updateDeliveryDto: UpdateDeliveryDto) {
    return `This action updates a #${id} delivery`;
  }

  remove(id: number) {
    return `This action removes a #${id} delivery`;
  }
}
