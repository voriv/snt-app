export interface Member {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  birthDate: Date | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMemberData {
  userId: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  phone?: string;
  email?: string;
  note?: string;
}

export interface UpdateMemberData {
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
  note?: string;
}
