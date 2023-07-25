import {HttpException, Injectable, NotFoundException, UnauthorizedException} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {UserEntity, UserVerificationEntity} from "@src/entities";
import {Repository} from "typeorm";
import {RegisterDto} from "@src/user/auth/dto";
import {ExistingUser} from "@src/user/auth/types";
import {compareHash} from "@shared/utils";

@Injectable()
export class UserCrudService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly _userRepository: Repository<UserEntity>,
    @InjectRepository(UserVerificationEntity)
    private readonly _verificationRepository: Repository<UserVerificationEntity>,
  ) {
  }

  private async _createVerification(
    registerDto: RegisterDto,
  ): Promise<UserVerificationEntity> {
    const verificationBody = {
      ...registerDto,
      verifiedEmail: false,
    };

    return this._verificationRepository.save(verificationBody);
  }

  async create(
    registerDto: RegisterDto,
  ): Promise<UserEntity | ExistingUser> {
    const user = await this.findByEmail(registerDto.email);
    if (user) {
      const { verifiedEmail, updatedAt } = user.verification;
      const isPasswordSet = user.passwordHash !== null;
      if (!verifiedEmail || !isPasswordSet) {
        return {
          id: user.id,
          verifiedEmail,
          isPasswordSet,
          updatedAt,
        };
      }

      throw new HttpException('Register user already exists', 409);
    }

    const verification = await this._createVerification(registerDto);

    const userBody = {
      ...registerDto,
      lastPasswordResetDate: new Date(),
      verification,
    };

    return this._userRepository.save(userBody);
  };

  findByEmail(email: string): Promise<UserEntity> {
    return this._userRepository.findOneBy({ email });
  }

  findById(id: number): Promise<UserEntity> {
    return this._userRepository.findOneBy({ id });
  }

  async update(
    id: number,
    partialEntity: Partial<UserEntity>,
    returnOld = false,
  ) {
    let entityToReturn;
    if (returnOld) {
      entityToReturn = this._userRepository.findOneBy({ id });
    }
    await this._userRepository.update({ id }, partialEntity);
    entityToReturn ??= this._userRepository.findOneBy({ id });

    return entityToReturn;
  }

  async remove(id: number, password: string): Promise<boolean> {
    const user = await this._userRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException();
    }

    const passwordCorrect = await compareHash(password, user.passwordHash);
    if (!passwordCorrect) {
      throw new UnauthorizedException('Incorrect Password');
    }

    await this._userRepository.remove(user);
    return true;
  }


}
