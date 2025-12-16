import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  UpdateUserDto,
  PublicUserResponseDto,
  UserDetailResponseDto,
  RegisterUserRequestDto,
  UserListResponseDto,
} from './dto/users.dto';
import { LoginResponseDto } from '../session/session.dto';
import { AuthService } from '../auth/auth.service';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles';
import { CheckUserAccessGuard } from '../auth/guards/userAcces.guard';
import { CurrentUser } from '../auth/decorators/currentUser.decorator';
import { type Session } from '../types/auth';
import { ParseUserIdPipe } from '../pipes/parseUserId.pipe';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async registerUser(
    @Body() registerDto: RegisterUserRequestDto,
  ): Promise<LoginResponseDto> {
    const token = await this.authService.register(registerDto);
    return { token };
  }

  @Roles(Role.ADMIN)
  @Get()
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'List of all users',
    type: UserListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(): Promise<UserListResponseDto> {
    return this.usersService.findAll();
  }

  @Roles(Role.USER, Role.ADMIN)
  @UseGuards(CheckUserAccessGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get user details with tickets' })
  @ApiResponse({
    status: 200,
    description: 'User details',
    type: UserDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (Not your profile)' })
  async findOne(
    @Param('id', ParseUserIdPipe) id: number | 'me',
    @CurrentUser() user: Session,
  ): Promise<UserDetailResponseDto> {
    return this.usersService.findOne(id === 'me' ? user.id : id);
  }

  @Roles(Role.USER, Role.ADMIN)
  @UseGuards(CheckUserAccessGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({
    status: 200,
    description: 'User updated',
    type: PublicUserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async update(
    @Param('id', ParseUserIdPipe) id: number | 'me',
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: Session,
  ): Promise<PublicUserResponseDto> {
    return this.usersService.updateById(
      id === 'me' ? user.id : id,
      updateUserDto,
    );
  }

  @Roles(Role.ADMIN, Role.USER)
  @UseGuards(CheckUserAccessGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete user account' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async remove(
    @Param('id', ParseUserIdPipe) id: number | 'me',
    @CurrentUser() user: Session,
  ): Promise<{ message: string }> {
    await this.usersService.remove(id === 'me' ? user.id : id);
    return { message: `User ${id} succesvol verwijderd` };
  }
}
