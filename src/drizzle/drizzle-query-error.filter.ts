import type { ExceptionFilter } from '@nestjs/common';
import { Catch, ConflictException, NotFoundException } from '@nestjs/common';
import { DrizzleQueryError } from 'drizzle-orm';

@Catch(DrizzleQueryError)
export class DrizzleQueryErrorFilter implements ExceptionFilter {
  catch(error: DrizzleQueryError) {
    if (!error.cause || !('code' in error.cause)) {
      throw new Error(error.message || 'Unknown database error');
    }

    const {
      cause: { code, message },
    } = error;

    switch (code) {
      case 'ER_DUP_ENTRY':
        if (message.includes('idx_place_name_unique')) {
          throw new ConflictException('A place with this name already exists');
        } else if (message.includes('idx_user_email_unique')) {
          throw new ConflictException(
            'There is already a user with this email address',
          );
        } else {
          throw new ConflictException('This item already exists');
        }
      case 'ER_NO_REFERENCED_ROW_2':
        if (message.includes('user_id')) {
          throw new NotFoundException('No user with this id exists');
        } else if (message.includes('event_id')) {
          throw new NotFoundException('No event with this id exists');
        } else if (message.includes('location_id')) {
          throw new NotFoundException('No location with this id exists');
        }
        break;
    }

    throw error;
  }
}
