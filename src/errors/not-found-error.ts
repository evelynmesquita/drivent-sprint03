import { ApplicationError } from '@/protocols';

export function notFoundError(message: string = 'No result for this search!'): ApplicationError {
  return {
    name: 'NotFoundError',
    message
  };
}