import {
  IsArray,
  IsEnum,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength
} from "class-validator";
import {ApiProperty, PartialType} from "@nestjs/swagger";
import {NewsEntity} from "@src/entities";
import {NewsImportanceStatuses} from "@shared/enums";

export class CreateNewsDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @ApiProperty()
  title: string;

  @IsString()
  @IsOptional()
  @MinLength(5)
  @ApiProperty()
  description: string;

  @IsString()
  @IsOptional()
  @MinLength(5)
  @Matches(/^[a-zA-Z ]+$/, {
    message: '$property should contain letters and spaces',
  })
  @ApiProperty()
  link?: string;

  @IsString()
  @IsOptional()
  @MinLength(5)
  @Matches(/^[a-zA-Z ]+$/, {
    message: '$property should contain letters and spaces',
  })
  @ApiProperty()
  source?: string;

  @IsEnum(NewsImportanceStatuses)
  @IsOptional()
  @ApiProperty({ enum: NewsImportanceStatuses })
  importance?: NewsImportanceStatuses;
}

export class UpdateNewsDto extends PartialType(CreateNewsDto) {
  @IsOptional()
  news: NewsEntity;
}

export class ListNewsResponseDto {
  @IsArray()
  @ApiProperty()
  items: NewsEntity[];

  @IsNumber()
  @ApiProperty()
  amount: number;
}

export class NewsParams {
  @IsNumberString()
  @ApiProperty()
  public id: string;
}
