import {IsNumber, IsOptional} from "class-validator";
import {Transform} from "class-transformer";

export class PaginationQuery {
  @IsNumber()
  @Transform(({ value }) => +value)
  @IsOptional()
  skip?: number;

  @IsNumber()
  @Transform(({ value }) => +value)
  @IsOptional()
  limit?: number;
}
