import { User } from '../models/user.entity';
export interface UserDTO extends Partial<User> {
    speciality?: string;
}