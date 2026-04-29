// Tour identifiers — pure data, importable from anywhere (server,
// client, server actions). Kept out of '/lib/actions/tutorial.ts' so
// that file stays a pure 'use server' module.

export type TourId =
  | 'dashboard'
  | 'inbox'
  | 'calendar'
  | 'projects'
  | 'clients'
  | 'finances'
  | 'contracts'
  | 'gear'
  | 'links'
  | 'forms'
  | 'settings';

export const ALL_TOUR_IDS: TourId[] = [
  'dashboard',
  'inbox',
  'calendar',
  'projects',
  'clients',
  'finances',
  'contracts',
  'gear',
  'links',
  'forms',
  'settings',
];
