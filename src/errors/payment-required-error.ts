import { ApplicationError } from '@/protocols';

export function paymentRequiredError(message = 'payment required'): ApplicationError {
  return {
    name: 'PaymentRequired',
    message,
  };
}
