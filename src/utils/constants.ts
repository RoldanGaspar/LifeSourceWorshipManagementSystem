import { Member, Role, Song, ServicePlan, Announcement } from '../types/types';

// Helper to get dynamic dates relative to today (Local Time)
const getRelativeDate = (daysOffset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return getLocalISOString(date);
};

// Helper to get YYYY-MM-DD in local time, preventing UTC shift errors
export const getLocalISOString = (date: Date = new Date()) => {
  const offset = date.getTimezoneOffset() * 60000;
  const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, -1);
  return localISOTime.split('T')[0];
};

export const MOCK_MEMBERS: Member[] = [
  { 
    id: '1', 
    name: 'Sarah Jenkins', 
    email: 'sarah@church.org', 
    roles: [Role.WorshipLeader, Role.Keys, Role.Vocalist], 
    systemRole: 'Admin',
    avatar: 'https://ui-avatars.com/api/?name=Sarah+Jenkins&background=random', 
    status: 'Active',
    unavailableDates: [{ date: getRelativeDate(14), reason: 'Vacation' }] 
  },
  { 
    id: '2', 
    name: 'Mike Ross', 
    email: 'mike@church.org', 
    roles: [Role.ElectricGuitar, Role.AcousticGuitar], 
    systemRole: 'Member',
    avatar: 'https://ui-avatars.com/api/?name=Mike+Ross&background=random', 
    status: 'Active',
    unavailableDates: []
  },
  { 
    id: '3', 
    name: 'David Kim', 
    email: 'david@church.org', 
    roles: [Role.Drums], 
    systemRole: 'Member',
    avatar: 'https://ui-avatars.com/api/?name=David+Kim&background=random', 
    status: 'Away',
    unavailableDates: [{ date: getRelativeDate(7), reason: 'Work Trip' }, { date: getRelativeDate(14), reason: 'Work Trip' }]
  },
  { 
    id: '4', 
    name: 'Jessica Chen', 
    email: 'jess@church.org', 
    roles: [Role.Bass], 
    systemRole: 'Member',
    avatar: 'https://ui-avatars.com/api/?name=Jessica+Chen&background=random', 
    status: 'Active',
    unavailableDates: []
  },
  { 
    id: '5', 
    name: 'Tom Baker', 
    email: 'tom@church.org', 
    roles: [Role.AudioEngineer], 
    systemRole: 'Admin',
    avatar: 'https://ui-avatars.com/api/?name=Tom+Baker&background=random', 
    status: 'Active',
    unavailableDates: []
  },
  { 
    id: '6', 
    name: 'Emily Stone', 
    email: 'emily@church.org', 
    roles: [Role.Vocalist], 
    systemRole: 'Member',
    avatar: 'https://ui-avatars.com/api/?name=Emily+Stone&background=random', 
    status: 'Active',
    unavailableDates: [{ date: getRelativeDate(21), reason: 'Sick Leave' }]
  },
];

export const MOCK_SONGS: Song[] = [
  { id: 's1', title: 'Amazing Grace (My Chains Are Gone)', artist: 'Chris Tomlin', originalKey: 'G', bpm: 72, timeSignature: '4/4', tags: ['Hymn', 'Classics'], usageCount: 15, lastPlayed: getRelativeDate(-7), favoritedBy: [] },
  { id: 's2', title: '10,000 Reasons', artist: 'Matt Redman', originalKey: 'F', bpm: 70, timeSignature: '4/4', tags: ['Worship', 'Thanksgiving'], usageCount: 22, lastPlayed: getRelativeDate(-14), favoritedBy: [] },
  { id: 's3', title: 'Way Maker', artist: 'Sinach', originalKey: 'E', bpm: 68, timeSignature: '4/4', tags: ['Anthem', 'Modern'], usageCount: 18, lastPlayed: getRelativeDate(-21), favoritedBy: [] },
  { id: 's4', title: 'Goodness of God', artist: 'Bethel Music', originalKey: 'Ab', bpm: 64, timeSignature: '4/4', tags: ['Ballad', 'Assurance'], usageCount: 10, lastPlayed: getRelativeDate(-3), favoritedBy: [] },
  { id: 's5', title: 'Graves Into Gardens', artist: 'Elevation Worship', originalKey: 'B', bpm: 74, timeSignature: '6/8', tags: ['High Energy', 'Rock'], usageCount: 8, lastPlayed: getRelativeDate(-30), favoritedBy: [] },
];

export const MOCK_SERVICES: ServicePlan[] = [
  {
    id: 'svc1',
    date: getRelativeDate(2), // 2 days from now
    time: '10:00',
    title: 'Sunday Morning Service',
    notes: 'Focus on gratitude. Special announcement regarding the food drive.',
    rehearsal: {
      date: getRelativeDate(0), // Today
      time: '19:00',
      location: 'Main Sanctuary'
    },
    team: [
      { role: Role.WorshipLeader, memberId: '1', status: 'Confirmed' },
      { role: Role.ElectricGuitar, memberId: '2', status: 'Pending' },
      { role: Role.Drums, memberId: null, status: 'Pending' },
      { role: Role.Bass, memberId: '4', status: 'Confirmed' },
    ],
    setlist: [
      { songId: 's3', key: 'E', note: 'Start with chorus' },
      { songId: 's1', key: 'G' },
      { songId: 's2', key: 'F', note: 'Prayer transition at end' },
    ]
  },
  {
    id: 'svc2',
    date: getRelativeDate(9), // 9 days from now
    time: '18:00',
    title: 'Youth Night',
    notes: 'High energy set requested.',
    rehearsal: {
      date: getRelativeDate(9),
      time: '16:00',
      location: 'Youth Hall'
    },
    team: [
      { role: Role.WorshipLeader, memberId: '1', status: 'Pending' },
      { role: Role.Drums, memberId: '3', status: 'Declined' },
    ],
    setlist: [
      { songId: 's5', key: 'B' },
    ]
  }
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: 'a1', title: 'Christmas Rehearsals Start Soon', content: 'We will begin practicing for the Christmas cantata next Thursday at 7 PM.', date: getRelativeDate(-2), author: 'Sarah Jenkins' },
  { id: 'a2', title: 'New In-Ear Monitors', content: 'The new Shure IEMs have arrived. Please bring your own sleeves if you have them.', date: getRelativeDate(-5), author: 'Tom Baker' },
];