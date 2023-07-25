import {ApiProperty} from "@nestjs/swagger";
import {IsEmail, IsNotEmpty, IsString, IsStrongPassword, NotContains} from "class-validator";
import {Transform} from "class-transformer";
import {IsUserEmailUnique} from "@src/user/validators";

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  @Transform((param) => param.value.toLowerCase())
  @IsUserEmailUnique()
  @ApiProperty({ example: 'test@user.com' })
  readonly email: string;
}

export class RegisterResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  email: string;

  @ApiProperty()
  verificationCode: string;
}

export class EmailDto {
  @IsEmail()
  @IsNotEmpty()
  @Transform((param) => param.value.toLowerCase())
  @ApiProperty({ example: 'test@user.com' })
  readonly email: string;
}

export class VerifyEmailDto extends EmailDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  readonly verificationCode: string;
}

export class VerifyEmailResponseDto extends EmailDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  readonly verificationCode: string;
}

export class CreatePasswordDto extends EmailDto {
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 0,
  })
  @NotContains(' ', {
    message: '$property cannot have spaces',
  })
  @IsNotEmpty()
  @ApiProperty()
  readonly password: string;
}

export class LoginDto extends CreatePasswordDto {}
