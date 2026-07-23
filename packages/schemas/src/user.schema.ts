import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AuthServiceOptions } from '@repo/enums/auth.enums';
import { Suffix, UserRole, UserStatus } from '@repo/enums/user.enums';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ collection: 'user' })
export class User {
  @Prop({ type: String, required: true })
  first_name!: string;

  @Prop({ type: String, required: false, default: '' })
  middle_name!: string;

  @Prop({ type: String, required: true })
  last_name!: string;

  @Prop({ type: Suffix, required: false, default: '' })
  suffix!: string;

  @Prop({ type: String, required: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ })
  email!: string;

  @Prop({ type: String, required: false })
  password?: string;

  @Prop({ type: UserStatus, enum: UserStatus, required: false })
  status!: UserStatus;

  @Prop({
    type: [AuthServiceOptions],
    enum: AuthServiceOptions,
    required: true,
    default: [AuthServiceOptions.WITH_EMAIL_AND_PASSWORD],
  })
  auth_service!: AuthServiceOptions[];

  @Prop({ type: UserRole, enum: UserRole, required: true })
  role!: UserStatus;

  @Prop({ type: Date, required: false, default: Date.now })
  last_online!: Date;

  @Prop({ type: Date, required: false, default: Date.now })
  date_created!: Date;

  @Prop({ type: Date, required: false, default: Date.now })
  last_updated!: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
