import { CommonFirestore } from './firestore';
import { Roles } from './roles.enum';

export interface AuthUser extends CommonFirestore {
  email: string;
  role: Roles;
}
