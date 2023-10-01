import faker from '@faker-js/faker';
import { Hotel } from '@prisma/client';
import { prisma } from '@/config';

export function createHotel(): Promise<Hotel> {
  return prisma.hotel.create({
    data: {
      name: faker.name.findName(),
      image: faker.internet.url(),
      updatedAt: new Date()
    },
  });
}