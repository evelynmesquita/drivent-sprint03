import { prisma } from '@/config';

async function getHotels() {
  return prisma.hotel.findMany();
}

async function getEnrollmentByUserId(userId: number) {
  return await prisma.enrollment.findUnique({
    where: { userId },
  });
}

async function getTicketWithTypeByEnrollmentId(enrollmentId: number) {
  return await prisma.ticket.findUnique({
    where: { enrollmentId },
    include: { TicketType: true },
  });
}

async function getHotelsWithRoomsById(hotelId: number) {
  return await prisma.hotel.findUnique({
    where: { id: hotelId },
    include: { Rooms: true },
  });
}

export const hotelsRepository = {
  getHotels,
  getEnrollmentByUserId,
  getTicketWithTypeByEnrollmentId,
  getHotelsWithRoomsById,
};
