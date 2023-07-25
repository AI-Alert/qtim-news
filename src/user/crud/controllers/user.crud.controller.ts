import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiInternalServerErrorResponse, ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse
} from "@nestjs/swagger";
import {Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Query, Request, UseGuards} from "@nestjs/common";
import {UserCrudService} from "@src/user/crud/services";
import {JwtAuthUserGuardRedis} from "@src/auth/guards";
import {UserEntity} from "@src/entities";
import {PasswordDto, PersonalInfoDto} from "@src/user/crud/dto";

export const EXAMPLE_USER = {
  id: '123',
  firstName: 'Tom',
  lastName: 'Sample',
  gender: 'male',
  dateOfBirth: '1999-01-01',
};

@ApiTags('User CRUD')
@ApiUnauthorizedResponse({
  description: 'Returns when the provided access token is invalid',
  content: {
    'application/json': {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  },
})
@ApiInternalServerErrorResponse({
  description:
    'Returns when there is an internal server error. Also returns the error object.',
})
@Controller('user/crud')
export class UserCrudController {
  constructor(private readonly _crudService: UserCrudService) {
  }

  @Get('account')
  @UseGuards(JwtAuthUserGuardRedis)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Find currently logged in user' })
  @ApiOkResponse({
    description: 'Returns the user',
    content: {
      'application/json': {
        example: EXAMPLE_USER,
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async findProfile(@Request() req): Promise<UserEntity> {
    return this._crudService.findById(req.user.id);
  }

  @Patch('/personal-info')
  @UseGuards(JwtAuthUserGuardRedis)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Edit the currently logged in user's personal info",
  })
  @ApiOkResponse({
    description:
      'Returns the user before or after update (configurable with query)',
    content: {
      'application/json': {
        example: EXAMPLE_USER,
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Returns when a field has failed validation',
    content: {
      'application/json': {
        example: {
          statusCode: 400,
          message: ['dateOfBirth must be a valid ISO 8601 date string'],
          error: 'Bad Request',
        },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async updatePersonalInfo(
    @Request() request,
    @Body() personalInfoDto: PersonalInfoDto,
    @Query('returnOld') returnOld = false,
  ): Promise<UserEntity> {
    return this._crudService.update(
      request.user.id,
      personalInfoDto,
      returnOld,
    );
  }

  @Delete('account')
  @UseGuards(JwtAuthUserGuardRedis)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete the current account. Irreversible.',
    requestBody: {
      content: {
        'application/json': {
          schema: {
            example: {
              password: 'IR1descence!',
            },
          },
        },
      },
    },
  })
  async removeAccount(
    @Request() request,
    @Body() passwordDto: PasswordDto,
  ): Promise<boolean> {
    return this._crudService.remove(request.user.id, passwordDto.password);
  }
}
