import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, updateProfile, sendPasswordResetEmail, updatePassword as firebaseUpdatePassword } from "firebase/auth";
import { doc, getDoc, setDoc, collection, getDocs, query, limit, where, deleteDoc } from "firebase/firestore";
import { authInstance, db } from "../lib/firebase";
import { Member, Role } from "../types/types";

export const auth = {
  // Listen to auth state changes
  onChange: (callback: (user: Member | null) => void) => {
    return onAuthStateChanged(authInstance, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const docRef = doc(db, "members", firebaseUser.uid);
          let docSnap = await getDoc(docRef);

          // Retry mechanism: If doc doesn't exist but user was created < 10 seconds ago,
          // it might be a race condition with the signUp function. Wait and try again.
          if (!docSnap.exists()) {
             const creationTime = new Date(firebaseUser.metadata.creationTime || '').getTime();
             const now = Date.now();
             if (now - creationTime < 10000) {
                 await new Promise(r => setTimeout(r, 1000));
                 docSnap = await getDoc(docRef);
             }
          }

          if (docSnap.exists()) {
            const memberData = docSnap.data() as Member;
            callback({ ...memberData, id: memberData.id });
          } else {
            // Fallback: Only create default if retry failed and it really doesn't exist
            const newMember: Member = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'New User',
              email: firebaseUser.email || '',
              roles: [],
              systemRole: 'Member', 
              avatar: `https://ui-avatars.com/api/?name=${firebaseUser.email}&background=random`,
              status: 'Active',
              unavailableDates: []
            };

            await setDoc(doc(db, "members", newMember.id), newMember);
            callback(newMember);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  },
  
  signInWithEmailAndPassword: async (email: string, password: string): Promise<void> => {
    await signInWithEmailAndPassword(authInstance, email, password);
  },

  // Updated Sign Up to handle Name, Roles and Admin Logic
  signUpWithEmailAndPassword: async (email: string, password: string, name: string, initialRoles: Role[]): Promise<void> => {
    // 1. Check for Pending Invites to inherit Roles
    const membersColl = collection(db, "members");
    const qInvite = query(membersColl, where("email", "==", email), where("status", "==", "Inactive"));
    const inviteSnapshot = await getDocs(qInvite);
    
    let inheritedRoles: Role[] = [...initialRoles];
    
    // Merge roles from invitation if exists
    if (!inviteSnapshot.empty) {
        inviteSnapshot.forEach(doc => {
            const data = doc.data() as Member;
            if (data.roles && Array.isArray(data.roles)) {
                 data.roles.forEach(r => {
                     if (!inheritedRoles.includes(r)) inheritedRoles.push(r);
                 });
            }
        });
    }

    // 2. Create Auth User
    const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
    const user = userCredential.user;

    // 3. Update Display Name in Auth
    await updateProfile(user, { displayName: name });

    // 4. Determine System Role (Admin vs Member)
    // Check if any active members exist. If not, this is the first user -> Admin.
    const qAdminCheck = query(membersColl, where("status", "==", "Active"), limit(1));
    const querySnapshot = await getDocs(qAdminCheck);
    const systemRole = querySnapshot.empty ? 'Admin' : 'Member';

    // 5. Create Firestore Profile
    const newMember: Member = {
      id: user.uid,
      name: name,
      email: email,
      roles: inheritedRoles,
      systemRole: systemRole,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      status: 'Active',
      unavailableDates: []
    };

    await setDoc(doc(db, "members", user.uid), newMember);

    // 6. Cleanup Pending Invites
    inviteSnapshot.forEach(async (d) => {
        await deleteDoc(d.ref);
    });
  },

  updatePassword: async (password: string): Promise<void> => {
    if (!authInstance.currentUser) throw new Error("No user signed in");
    await firebaseUpdatePassword(authInstance.currentUser, password);
  },

  sendPasswordResetEmail: async (email: string): Promise<void> => {
    await sendPasswordResetEmail(authInstance, email);
  },

  signOut: async () => {
    await firebaseSignOut(authInstance);
  }
};