import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Customer } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Logger } from '@app/common';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    try {
      const customer = await this.prisma.customer.create({
        data: createCustomerDto,
      });
      this.logger.log(`Created customer: ${customer.uuid}`);
      return customer;
    } catch (error) {
      // Prisma unique constraint violation
      if (error.code === 'P2002') {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async findAll(): Promise<Customer[]> {
    return this.prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(uuid: string): Promise<Customer> {
    const customer = await this.prisma.customer.findUnique({
      where: { uuid },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with UUID ${uuid} not found`);
    }

    return customer;
  }

  async update(uuid: string, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    try {
      const customer = await this.prisma.customer.update({
        where: { uuid },
        data: updateCustomerDto,
      });
      this.logger.log(`Updated customer: ${uuid}`);
      return customer;
    } catch (error) {
      // Prisma record not found
      if (error.code === 'P2025') {
        throw new NotFoundException(`Customer with UUID ${uuid} not found`);
      }
      // Prisma unique constraint violation
      if (error.code === 'P2002') {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async remove(uuid: string): Promise<Customer> {
    try {
      const customer = await this.prisma.customer.delete({
        where: { uuid },
      });
      this.logger.log(`Deleted customer: ${uuid}`);
      return customer;
    } catch (error) {
      // Prisma record not found
      if (error.code === 'P2025') {
        throw new NotFoundException(`Customer with UUID ${uuid} not found`);
      }
      throw error;
    }
  }
}
