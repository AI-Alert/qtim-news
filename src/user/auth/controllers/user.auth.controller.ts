import {Body, Controller, Get, HttpCode, HttpStatus, Post, Request, UseGuards} from "@nestjs/common";
import {
  ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiConflictResponse, ApiForbiddenResponse,
  ApiInternalServerErrorResponse, ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import {
  CreatePasswordDto,
  EmailDto, LoginDto,
  RegisterDto,
  RegisterResponseDto,
  VerifyEmailDto,
  VerifyEmailResponseDto
} from "@src/user/auth/dto";
import {UserAuthService} from "@src/user/auth/services";
import {TokenPair} from "@constants/auth.constant";
import {JwtAuthUserGuardRedis, LocalUserAuthGuard} from "@src/auth/guards";

const VALIDATION_ERROR_EXAMPLE = {
  statusCode: 400,
  message: ['email must be an email'],
  error: 'Bad Request',
};

@ApiInternalServerErrorResponse({
  description:
    'Returned if there is an internal server error. Returns the error object.',
})
@ApiTags('User Authentication')
@Controller('user/auth')
export class UserAuthController {
  constructor(private readonly _authService: UserAuthService) {
  }

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user and send a verification code',
  })
  @ApiResponse({
    description:
      'Returned when the user is already registered and has completed all required steps.',
    status: 409,
    content: {
      'application/json': {
        example: {
          error: {
            code: 'REGISTER_USER_ALREADY_EXISTS',
          },
          statusCode: 409,
        },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description:
      'Returned when the transaction has failed. Includes the error object.',
  })
  @ApiOkResponse({
    description:
      'Returned when the user was registered successfully or if there is a user with that email that has not completed registration.',
    content: {
      'application/json': {
        example: {
          id: '123',
          email: 'test@mail.com',
          verificationCode: '123456',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Returned when the e-mail has failed validation',
    content: {
      'application/json': {
        example: VALIDATION_ERROR_EXAMPLE,
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<RegisterResponseDto> {
    return this._authService.register(registerDto);
  }

  @Post('verify-code')
  @ApiOperation({
    summary: 'Verify an email',
  })
  @ApiNotFoundResponse({
    description:
      "Returned when the user with the specified email wasn't found.",
    content: {
      'application/json': {
        example: {
          error: {
            code: 'USER_NOT_FOUND',
          },
          statusCode: 404,
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Returned when the entered verification code is wrong.',
    content: {
      'application/json': {
        example: {
          error: {
            code: 'WRONG_CODE',
            method: 'verify-email',
          },
          statusCode: 401,
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Returned when the e-mail has failed validation',
    content: {
      'application/json': {
        example: VALIDATION_ERROR_EXAMPLE,
      },
    },
  })
  @ApiOkResponse({
    description: 'Returned when the email was successfully verified.',
    content: {
      'application/json': {
        example: "Your email successfully verified",
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto): Promise<any | string> {
    return this._authService.verifyEmail(verifyEmailDto);
  }

  @Post('resend-verification-code')
  @ApiOperation({
    summary: 'Resend verification code',
  })
  @ApiNotFoundResponse({
    description:
      "Returned when the user with the specified email wasn't found.",
    content: {
      'application/json': {
        example: {
          error: {
            code: 'USER_NOT_FOUND',
          },
          statusCode: 404,
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Returned when one of the fields has failed validation',
    content: {
      'application/json': {
        example: VALIDATION_ERROR_EXAMPLE,
      },
    },
  })
  @ApiOkResponse({
    description: 'Returned when the message was successfully resent.',
    content: {
      'application/json': {
        example: {
          id: '123',
          email: 'test@mail.com',
          verificationCode: '123456',
        },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async sendEmailVerification(
    @Body() sendVerificationCodeDto: EmailDto,
  ): Promise<VerifyEmailResponseDto> {
    return this._authService.sendVerificationCode(sendVerificationCodeDto);
  }

  @Post('create-password')
  @ApiOperation({
    summary:
      'Create a new password and issue tokens (intended for registration and password reset)',
  })
  @ApiNotFoundResponse({
    description:
      "Returned when the user with the specified email wasn't found.",
    content: {
      'application/json': {
        example: {
          error: {
            code: 'USER_NOT_FOUND',
          },
          statusCode: 404,
        },
      },
    },
  })
  @ApiForbiddenResponse({
    description: "Returned when the user's email is not verified.",
    content: {
      'application/json': {
        example: {
          error: {
            code: 'UNVERIFIED_EMAIL',
          },
          statusCode: 403,
        },
      },
    },
  })
  @ApiConflictResponse({
    description:
      'Returned when the password for this user is already set (not equal to null).',
    content: {
      'application/json': {
        example: {
          error: {
            code: 'CREATE_PASSWORD_ALREADY_SET',
          },
          statusCode: 409,
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Returned when one of the fields has failed validation',
    content: {
      'application/json': {
        example: VALIDATION_ERROR_EXAMPLE,
      },
    },
  })
  @ApiOkResponse({
    description: 'Returned when a new password was successfully set.',
    content: {
      'application/json': {
        example: {
          accessToken: 'nyarlathotep',
          refreshToken: 'azotharoth',
        },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async createPassword(
    @Body() createPasswordDto: CreatePasswordDto,
  ): Promise<TokenPair> {
    return this._authService.createPassword(createPasswordDto);
  }

  @ApiOperation({ summary: 'Log in using email and password' })
  @ApiBody({
    required: true,
    examples: {
      test: {
        summary: 'A testing example.',
        value: {
          email: 'test@user.com',
          password: 'IR1descence!',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Returned when the credentials are invalid.',
    content: {
      'application/json': {
        example: {
          statusCode: 401,
          message: 'Unauthorized',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Returned when the credentials are valid.',
    content: {
      'application/json': {
        example: {
          accessToken: 'nyarlathotep',
          refreshToken: 'azotharoth',
        },
      },
    },
  })
  @UseGuards(LocalUserAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<TokenPair> {
    return this._authService.login(loginDto.email, loginDto.password);
  }

  @ApiOperation({ summary: 'Refresh tokens' })
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({
    description: 'Returned when the refresh token is invalid',
    content: {
      'application/json': {
        example: {
          statusCode: 401,
          message: 'Unauthorized',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Returned when the refresh token is valid.',
    content: {
      'application/json': {
        example: {
          accessToken: 'nyarlathotep',
          refreshToken: 'azotharoth',
        },
      },
    },
  })
  @Get('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Request() req: Request) {
    const refreshToken = req.headers['authorization'].replace('Bearer ', '');
    return this._authService.refresh(refreshToken);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Log user out using their refresh token' })
  @ApiUnauthorizedResponse({
    description: 'Returned when the refresh token is invalid.',
    content: {
      'application/json': {
        example: {
          statusCode: 401,
          message: 'Unauthorized',
        },
      },
    },
  })
  @ApiOkResponse({
    description:
      'Returned when the refresh token is valid and the user has been logged out (this refresh token will now be invalid).',
    content: {
      'application/json': {
        example: true,
      },
    },
  })
  @Post('logout')
  @UseGuards(JwtAuthUserGuardRedis)
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: Request) {
    const accessToken = req.headers['authorization'].replace('Bearer ', '');
    return this._authService.logout(accessToken);
  }
}
