import { AuthServiceOptions } from '@repo/enums/auth.enums';
import { Suffix } from '@repo/enums/user.enums';
import { User } from '@repo/schemas/user.schema';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateUserDto implements Partial<User> {
  @IsString()
  first_name!: string;

  @IsOptional()
  @IsString()
  middle_name?: string | undefined;

  @IsString()
  last_name!: string;

  @IsEnum(Suffix)
  suffix?: string | undefined;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  password?: string | undefined;

  @IsEnum(AuthServiceOptions)
  auth_service!: AuthServiceOptions[];
}
