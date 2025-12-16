import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @SkipThrottle() // Zorg ervoor dat rate limiting er niet voor zorgt dat de health check crasht op Render
  @Get('ping')
  @Public()
  @ApiOperation({ summary: 'Check to see if the server is online' })
  @ApiResponse({
    status: 200,
    description: 'Server is online',
    schema: {
      type: 'object',
      properties: {
        pong: { type: 'boolean', example: true },
      },
    },
  })
  ping(): { pong: boolean } {
    return { pong: true };
  }
}
