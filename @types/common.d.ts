export interface CommonPhoneNumber {
  number: string;
  type: string;
  isPrimary: boolean;
}

export interface CommonEmail {
  email: string;
  type: string;
  isPrimary: boolean;
}

export type CommonGender = 'Male' | 'Female' | 'Non-Binary' | 'Prefer Not to Say' | 'Other' | null;
