import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import {HttpException, Injectable} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {UserEntity} from "@src/entities";

export function IsUserEmailUnique(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      propertyName,
      target: object.constructor,
      options: validationOptions,
      validator: UserEmailUniqueValidator,
    });
  };
}

@ValidatorConstraint({ name: 'EmailUnique', async: true })
@Injectable()
export class UserEmailUniqueValidator
  implements ValidatorConstraintInterface
{
  constructor(
    @InjectRepository(UserEntity)
    private readonly _userRepository: Repository<UserEntity>,
  ) {}
  async validate(value: string) {
    const user = await this._userRepository.findOneBy({
      email: value,
    });
    if (!user) {
      return true;
    }
    const isPasswordSet =
      user.passwordHash !== null &&
      !user.verification.passwordVerificationCode;
    if (!isPasswordSet) {
      return true;
    }

    throw new HttpException('REGISTER USER ALREADY EXISTS', 409);
  }
}
