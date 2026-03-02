export enum Role {
  WorshipLeader = 'Worship Leader',
  Vocalist = 'Vocalist',
  ElectricGuitar = 'Electric Guitar',
  AcousticGuitar = 'Acoustic Guitar',
  Bass = 'Bass',
  Drums = 'Drums',
  Keys = 'Keys',
  AudioEngineer = 'Audio Engineer',
  Visuals = 'Visuals'
}

export type SystemRole = 'Admin' | 'Member';

export interface UnavailableDate {
  date: string; // YYYY-MM-DD
  reason?: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  systemRole: SystemRole; // New field for App Permissions
  avatar: string;
  status: 'Active' | 'Inactive' | 'Away';
  unavailableDates: UnavailableDate[];
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  originalKey: string;
  bpm: number;
  timeSignature: string;
  tags: string[];
  usageCount: number; // For analytics
  lastPlayed?: string;
  lyrics?: string;
  youtubeLink?: string;
  chordChartLink?: string;
  favoritedBy: string[]; // Array of Member IDs who favorited this song
}

export type AssignmentStatus = 'Pending' | 'Confirmed' | 'Declined';

export interface ServiceTeamMember {
  role: Role;
  memberId: string | null;
  status: AssignmentStatus;
}

export interface ServicePlan {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  title: string;
  team: ServiceTeamMember[];
  setlist: {
    songId: string;
    key: string;
    note?: string;
  }[];
  notes: string;
  rehearsal?: {
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    location: string;
  };
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
}