import { Test, type TestingModule } from '@nestjs/testing';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { ClsService } from 'nestjs-cls';

describe('CustomersController', () => {
  let controller: CustomersController;

  const mockCustomersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockClsService = {
    get: jest.fn(),
    set: jest.fn(),
    getId: jest.fn(),
    run: jest.fn(),
    runWith: jest.fn(),
    enter: jest.fn(),
    enterWith: jest.fn(),
    exit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomersController],
      providers: [
        {
          provide: CustomersService,
          useValue: mockCustomersService,
        },
        {
          provide: ClsService,
          useValue: mockClsService,
        },
      ],
    }).compile();

    controller = module.get<CustomersController>(CustomersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
