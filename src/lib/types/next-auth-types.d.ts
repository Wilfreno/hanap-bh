import { User as UserType } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: UserType;
  }
  interface Profile {
    given_name: string;
    family_name: string;
    picture: string;
  }
  interface User extends Omit<UserType, "password"> {}
}

declare module "next-auth/jwt" {
  interface JWT extends UserType {}
}
