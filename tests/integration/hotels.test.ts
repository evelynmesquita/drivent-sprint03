import * as jwt from 'jsonwebtoken';
import { faker } from '@faker-js/faker';
import httpStatus from 'http-status';
import supertest from 'supertest';
import { cleanDb, generateValidToken } from '../helpers';
import { createEnrollmentWithAddress, createTicketType, createUser, createTicket, createHotel } from '../factories';
import app, { init } from '@/app';

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe('GET /hotels', () => {
  it('Should respond with status 401 if no token is given', async () => {
    const response = await server.get('/hotels');
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('Should respond with status 401 if there is no session for given token', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('Should respond with status 401 if given token is not valid', async () => {
    const token = faker.lorem.word();
    const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('When token is valid', () => {
    it('Should respond with 404 (not found) if the user doesnt have an enrollment', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      await createHotel();
      const { status } = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
      expect(status).toBe(httpStatus.NOT_FOUND);
    });

    it('Should respond with 404 (not found) if the user doesnt have a ticket', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      await createHotel();
      await createEnrollmentWithAddress(user);
      const { status } = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
      expect(status).toBe(httpStatus.NOT_FOUND);
    });

    it('Should respond with 402 (payment required) if the ticket was not paid (status: RESERVED)', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      await createHotel();
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType(false, true);
      await createTicket(enrollment.id, ticketType.id, 'RESERVED');
      const { status } = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
      expect(status).toBe(httpStatus.PAYMENT_REQUIRED);
    });

    it('Should respond with 402 (payment required) if the TicketType is remote (isRemote: true)', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      await createHotel();
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType(true, true);
      await createTicket(enrollment.id, ticketType.id, 'PAID');
      const { status } = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
      expect(status).toBe(httpStatus.PAYMENT_REQUIRED);
    });

    it('Should respond with 404 (not found) if an hotel doesnt exist', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const { status } = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
      expect(status).toBe(httpStatus.NOT_FOUND);
    });

    it('Should respond with 402 (payment required) if the TicketType doesnt have an hotel (includesHotel: false)', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      await createHotel();
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType(false, false);
      await createTicket(enrollment.id, ticketType.id, 'PAID');
      const { status } = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
      expect(status).toBe(httpStatus.PAYMENT_REQUIRED);
    });

    it('Should respond with 200 (OK) if everything is ok', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const hotel = await createHotel();
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType(false, true);
      await createTicket(enrollment.id, ticketType.id, 'PAID');
      const { status, body } = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
      expect(status).toBe(httpStatus.OK);
      expect(body).toEqual([
        {
          ...hotel,
          createdAt: hotel.createdAt.toISOString(),
          updatedAt: hotel.updatedAt.toISOString(),
        },
      ]);
    });
  });
});

describe('GET /hotels/:hotelId', () => {
  it('Should respond with status 401 if no token is given', async () => {
    const response = await server.get('/hotels/1');
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('Should respond with status 401 if given token is not valid', async () => {
    const token = faker.lorem.word();
    const response = await server.get('/hotels/1').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('Should respond with status 401 if there is no session for given token', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    const response = await server.get('/hotels/1').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('When token is valid', () => {
    it('Should respond with 404 (not found) if the user doesnt have an enrollment', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      await createHotel();
      const { status } = await server.get('/hotels/1').set('Authorization', `Bearer ${token}`);
      expect(status).toBe(httpStatus.NOT_FOUND);
    });

    it('Should respond with 404 (not found) if the user doesnt have a ticket', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const { id } = await createHotel();
      await createEnrollmentWithAddress(user);
      const { status } = await server.get(`/hotels/${id}`).set('Authorization', `Bearer ${token}`);
      expect(status).toBe(httpStatus.NOT_FOUND);
    });

    it('Should respond with 404 (not found) if an hotel with the provided hotelId doesnt exist', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType(false, true);
      await createTicket(enrollment.id, ticketType.id, 'PAID');
      const { status } = await server.get(`/hotels/1`).set('Authorization', `Bearer ${token}`);
      expect(status).toBe(httpStatus.NOT_FOUND);
    });

    it('Should respond with 402 (payment required) if the ticket was not paid (status: RESERVED)', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const { id } = await createHotel();
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType(false, true);
      await createTicket(enrollment.id, ticketType.id, 'RESERVED');
      const { status } = await server.get(`/hotels/${id}`).set('Authorization', `Bearer ${token}`);
      expect(status).toBe(httpStatus.PAYMENT_REQUIRED);
    });

    it('Should respond with 402 (payment required) if the TicketType is remote (isRemote: true)', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const { id } = await createHotel();
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType(true, true);
      await createTicket(enrollment.id, ticketType.id, 'PAID');
      const { status } = await server.get(`/hotels/${id}`).set('Authorization', `Bearer ${token}`);
      expect(status).toBe(httpStatus.PAYMENT_REQUIRED);
    });

    it('Should respond with 402 (payment required) if the TicketType doesnt have an hotel (includesHotel: false)', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const { id } = await createHotel();
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType(false, false);
      await createTicket(enrollment.id, ticketType.id, 'PAID');
      const { status } = await server.get(`/hotels/${id}`).set('Authorization', `Bearer ${token}`);
      expect(status).toBe(httpStatus.PAYMENT_REQUIRED);
    });

    it('Should respond with 404 (not found) if an hotel doesnt exist', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const { status } = await server.get('/hotels/1').set('Authorization', `Bearer ${token}`);
      expect(status).toBe(httpStatus.NOT_FOUND);
    });

    it('Should respond with 200 (OK) if everything is ok', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const hotel = await createHotel();
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType(false, true);
      await createTicket(enrollment.id, ticketType.id, 'PAID');
      const { status, body } = await server.get(`/hotels/${hotel.id}`).set('Authorization', `Bearer ${token}`);
      expect(status).toBe(httpStatus.OK);
      expect(body).toEqual({
        ...hotel,
        createdAt: hotel.createdAt.toISOString(),
        updatedAt: hotel.updatedAt.toISOString(),
        Rooms: [],
      });
    });
  });
});
