import {IsDateString, IsEnum, IsNumber, IsOptional, IsString, Matches, MaxLength, MinLength} from "class-validator";
import {Transform} from "class-transformer";
import {ApiProperty} from "@nestjs/swagger";
import {Gender} from "@constants/user.constants";

export class PersonalInfoDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform((param) => param.value.trim())
  @Matches(/^[a-zA-Z ]+$/, {
    message: '$property should contain letters and spaces',
  })
  @ApiProperty()
  firstName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform((param) => param.value.trim())
  @Matches(/^[a-zA-Z ]+$/, {
    message: '$property should contain letters and spaces',
  })
  @ApiProperty()
  lastName: string;

  @IsEnum(Gender)
  @IsOptional()
  @ApiProperty({ enum: Gender })
  gender?: Gender;

  @IsDateString()
  @ApiProperty()
  dateOfBirth: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  age: number;
}

export class PasswordDto {
  @IsString()
  @ApiProperty()
  password: string;
}
