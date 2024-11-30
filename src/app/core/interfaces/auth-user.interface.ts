import { Roles } from './roles.enum';

export interface AuthUser {
  id: string;
  email: string;
  canUpload: boolean;
  role: Roles;
}
