import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get the welcome message' })
  @ApiResponse({
    status: 200,
    description: 'The welcome message was succesfully returned',
    schema: {
      type: 'string',
      example: 'Welcome to this application',
    },
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
