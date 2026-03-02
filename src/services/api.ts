import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, writeBatch, onSnapshot, addDoc, query, orderBy, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Member, Song, ServicePlan, Announcement, AssignmentStatus } from "../types/types";
import { MOCK_MEMBERS, MOCK_SONGS, MOCK_SERVICES, MOCK_ANNOUNCEMENTS } from "../utils/constants";

// --- Real-Time Subscriptions ---

export const api = {
  // Subscribe to Members
  subscribeMembers: (callback: (members: Member[]) => void) => {
    const q = query(collection(db, "members"));
    return onSnapshot(q, (snapshot) => {
      const members = snapshot.docs.map(doc => doc.data() as Member);
      callback(members);
    });
  },

  // Subscribe to Songs
  subscribeSongs: (callback: (songs: Song[]) => void) => {
    const q = query(collection(db, "songs"), orderBy("title"));
    return onSnapshot(q, (snapshot) => {
      const songs = snapshot.docs.map(doc => doc.data() as Song);
      callback(songs);
    });
  },

  // Subscribe to Services (Optimized for Production: Only -30 days to Future)
  subscribeServices: (callback: (services: ServicePlan[]) => void) => {
    const today = new Date();
    today.setDate(today.getDate() - 30); // Keep 30 days of history
    const dateStr = today.toISOString().split('T')[0];

    // Filter by date string comparison (Works because YYYY-MM-DD is lexicographically sortable)
    const q = query(
      collection(db, "services"), 
      where("date", ">=", dateStr)
    );
    
    return onSnapshot(q, (snapshot) => {
      const services = snapshot.docs.map(doc => doc.data() as ServicePlan);
      const sorted = services.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      callback(sorted);
    });
  },

  // Subscribe to Announcements
  subscribeAnnouncements: (callback: (announcements: Announcement[]) => void) => {
    const q = query(collection(db, "announcements"));
    return onSnapshot(q, (snapshot) => {
      const announcements = snapshot.docs.map(doc => doc.data() as Announcement);
      // Sort by date desc
      const sorted = announcements.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      callback(sorted);
    });
  },

  // --- Mutations (Writes) ---

  // Songs
  addSong: async (song: Omit<Song, 'id'>) => {
    const newSongRef = doc(collection(db, "songs"));
    const newSong: Song = { ...song, id: newSongRef.id, usageCount: 0, tags: song.tags || [] };
    await setDoc(newSongRef, newSong);
  },

  updateSong: async (song: Song) => {
    await setDoc(doc(db, "songs", song.id), song);
  },

  deleteSong: async (id: string) => {
    await deleteDoc(doc(db, "songs", id));
  },

  // Services
  addService: async (service: Omit<ServicePlan, 'id'>) => {
    const newDocRef = doc(collection(db, "services"));
    await setDoc(newDocRef, { ...service, id: newDocRef.id });
  },

  updateService: async (service: ServicePlan) => {
    await setDoc(doc(db, "services", service.id), service);
  },

  deleteService: async (serviceId: string) => {
    await deleteDoc(doc(db, "services", serviceId));
  },

  updateServiceStatus: async (service: ServicePlan, memberId: string, status: AssignmentStatus) => {
    const serviceRef = doc(db, "services", service.id);
    const updatedTeam = service.team.map(t => 
      t.memberId === memberId ? { ...t, status } : t
    );
    await updateDoc(serviceRef, { team: updatedTeam });
  },

  // Members
  updateMember: async (member: Member) => {
    await setDoc(doc(db, "members", member.id), member);
  },

  updateMemberAvailability: async (member: Member, date: string, reason?: string) => {
    const memberRef = doc(db, "members", member.id);
    const exists = member.unavailableDates.some(d => d.date === date);
    
    let newDates;
    
    if (exists && reason === undefined) {
        // Toggle OFF if reason not provided (or we could force removal)
        newDates = member.unavailableDates.filter(d => d.date !== date);
    } else if (exists && reason !== undefined) {
        // Update existing with new reason
        newDates = member.unavailableDates.map(d => d.date === date ? { ...d, reason } : d);
    } else {
        // Add new
        newDates = [...member.unavailableDates, { date, reason: reason || '' }];
    }
    
    await updateDoc(memberRef, { unavailableDates: newDates });
  },

  inviteMember: async (member: Omit<Member, 'id'>) => {
    const newDocRef = doc(collection(db, "members"));
    // Ensure status is 'Invited' or use 'Inactive' as placeholder
    await setDoc(newDocRef, { ...member, id: newDocRef.id, status: 'Inactive' }); 
  },

  deleteMember: async (id: string) => {
    await deleteDoc(doc(db, "members", id));
  },

  // Announcements
  addAnnouncement: async (ann: Omit<Announcement, 'id'>) => {
    const newDocRef = doc(collection(db, "announcements"));
    await setDoc(newDocRef, { ...ann, id: newDocRef.id });
  },
  
  updateAnnouncement: async (ann: Announcement) => {
    await setDoc(doc(db, "announcements", ann.id), ann);
  },

  deleteAnnouncement: async (id: string) => {
    await deleteDoc(doc(db, "announcements", id));
  },

  // --- Seeding ---
  
  seedDatabase: async () => {
    const batch = writeBatch(db);

    MOCK_MEMBERS.forEach(member => {
      const ref = doc(db, "members", member.id);
      batch.set(ref, member);
    });

    MOCK_SONGS.forEach(song => {
      const ref = doc(db, "songs", song.id);
      batch.set(ref, song);
    });

    MOCK_SERVICES.forEach(service => {
      const ref = doc(db, "services", service.id);
      batch.set(ref, service);
    });

    MOCK_ANNOUNCEMENTS.forEach(ann => {
      const ref = doc(db, "announcements", ann.id);
      batch.set(ref, ann);
    });

    await batch.commit();
    console.log("Database seeded successfully!");
  }
};