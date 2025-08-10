export type UUID = string;

export type Role = 'admin' | 'manager' | 'resident' | 'collector' | 'supervisor';

export interface JwtUserClaims {
  sub: UUID;
  email: string;
  roles: Role[];
}

export interface ApiHealth {
  status: 'ok' | 'error';
  service: string;
}