import type {
  CreateUserInput,
  UpdateUserProfileInput,
  User,
  UserId,
} from "./types";

export interface UserRepository {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(input: CreateUserInput): Promise<User>;
  updateProfile(id: UserId, input: UpdateUserProfileInput): Promise<User>;
  updatePassword(id: UserId, passwordHash: string): Promise<void>;
}
