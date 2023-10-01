import { notFoundError, paymentRequiredError } from '@/errors';
import { hotelsRepository } from '@/repositories';

async function getHotels(userId: number) {
  const enrollment = await hotelsRepository.getEnrollmentByUserId(userId);
  if (!enrollment) throw notFoundError('You do not have an enrollment yet');

  const ticket = await hotelsRepository.getTicketWithTypeByEnrollmentId(enrollment.id);
  if (!ticket) throw notFoundError('You do not have a ticket yet');

  if (ticket.status === 'RESERVED') throw paymentRequiredError('You still need to pay for the ticket');

  if (ticket.TicketType.isRemote) throw paymentRequiredError('Your ticket is for a remote event');

  if (!ticket.TicketType.includesHotel) throw paymentRequiredError('Your ticket does not include a hotel');

  const hotels = await hotelsRepository.getHotels();
  if (hotels.length === 0) throw notFoundError('Sorry, but we do not have any hotels right now');

  return hotels;
}

async function getHotelsById(userId: number, hotelId: number) {
  await getHotels(userId);

  const hotel = await hotelsRepository.getHotelsWithRoomsById(hotelId);
  if (!hotel) throw notFoundError('This hotel does not exist');

  return hotel;
}

export const hotelsService = {
  getHotels,
  getHotelsById,
};
