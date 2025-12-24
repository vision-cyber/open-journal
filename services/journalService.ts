
import { 
  collection, 
  addDoc, 
  getDoc, 
  getDocs,
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  setDoc,
  increment,
  runTransaction
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { Journal, Note, UserProfileData, Visibility, AppNotification, Space } from "../types";

export const createUserProfile = async (uid: string, email: string, username?: string) => {
  const finalName = username || email.split('@')[0];
  const name = finalName.charAt(0).toUpperCase() + finalName.slice(1);
  const handle = `@${finalName.toLowerCase().replace(/\s+/g, '')}`;
  
  const profile: UserProfileData = {
    uid,
    email,
    handle,
    name,
    totalStars: 0,
    canCreateSpace: false,
    joinedAt: serverTimestamp()
  };
  await setDoc(doc(db, "users", uid), profile);
};

export const createJournal = async (data: Partial<Journal>) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Unauthenticated");

  const userDoc = await getDoc(doc(db, "users", user.uid));
  const userData = userDoc.data() as UserProfileData;

  const normalizedTags = (data.tags || [])
    .map(t => t.toLowerCase().trim().replace(/[# ,]/g, '').substring(0, 24))
    .filter(t => t.length > 0)
    .slice(0, 5);

  const journalData = {
    userId: user.uid,
    authorName: userData?.name || user.email?.split('@')[0] || 'Anonymous',
    authorHandle: userData?.handle || `@${user.email?.split('@')[0]}` || '@anon',
    title: data.title || "Untitled",
    content: data.content || "",
    excerpt: data.content?.substring(0, 150) + "..." || "",
    mood: data.mood || "Calm",
    visibility: data.visibility || "private",
    spaceId: data.spaceId || null,
    tags: normalizedTags,
    imageUrl: data.imageUrl || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, "journals"), journalData);
  return docRef.id;
};

export const addNote = async (journalId: string, content: string, journalOwnerId: string) => {
  const user = auth.currentUser;
  if (!user) return;

  const userDoc = await getDoc(doc(db, "users", user.uid));
  const userData = userDoc.data() as UserProfileData;
  
  const noteData = {
    userId: user.uid,
    authorName: userData?.name || 'Anonymous',
    authorHandle: userData?.handle || '@anon',
    content,
    starred: false,
    createdAt: serverTimestamp()
  };

  const noteRef = await addDoc(collection(db, "journals", journalId, "notes"), noteData);

  if (user.uid !== journalOwnerId) {
    await addDoc(collection(db, "notifications"), {
      userId: journalOwnerId,
      type: 'note',
      fromUserId: user.uid,
      fromUserName: noteData.authorName,
      journalId: journalId,
      noteId: noteRef.id,
      createdAt: serverTimestamp(),
      read: false
    });
  }
};

export const starNote = async (journalId: string, noteId: string, noteAuthorId: string) => {
  const user = auth.currentUser;
  if (!user) return;

  const noteRef = doc(db, "journals", journalId, "notes", noteId);
  const userRef = doc(db, "users", noteAuthorId);

  await runTransaction(db, async (transaction) => {
    const noteSnap = await transaction.get(noteRef);
    const userSnap = await transaction.get(userRef);

    if (!noteSnap.exists() || !userSnap.exists()) return;
    
    const isStarred = noteSnap.data().starred;
    if (isStarred) return;

    const currentStars = userSnap.data()?.totalStars || 0;
    const newStars = currentStars + 1;

    transaction.update(noteRef, { starred: true, starredAt: serverTimestamp() });
    transaction.update(userRef, { totalStars: increment(1) });

    if (newStars >= 50 && !userSnap.data()?.canCreateSpace) {
      transaction.update(userRef, { canCreateSpace: true });
      
      const milestoneNotifRef = doc(collection(db, "notifications"));
      transaction.set(milestoneNotifRef, {
        userId: noteAuthorId,
        type: 'milestone',
        fromUserId: 'system',
        fromUserName: 'System',
        journalId: journalId,
        createdAt: serverTimestamp(),
        read: false
      });
    }

    const starNotifRef = doc(collection(db, "notifications"));
    transaction.set(starNotifRef, {
      userId: noteAuthorId,
      type: 'star',
      fromUserId: user.uid,
      fromUserName: user.email?.split('@')[0] || 'Member',
      journalId: journalId,
      noteId: noteId,
      createdAt: serverTimestamp(),
      read: false
    });
  });
};

export const isUserInSpace = async (userId: string, spaceId: string): Promise<boolean> => {
  const q = query(
    collection(db, "userSpaces"),
    where("userId", "==", userId),
    where("spaceId", "==", spaceId)
  );
  const snap = await getDocs(q);
  return !snap.empty;
};

export const joinSpaceByCode = async (code: string) => {
  const user = auth.currentUser;
  if (!user) return;

  const q = query(collection(db, "spaces"), where("inviteCode", "==", code.toUpperCase()));
  const snap = await getDocs(q);
  
  if (snap.empty) throw new Error("Invalid Code");

  const spaceDoc = snap.docs[0];
  const spaceId = spaceDoc.id;

  await setDoc(doc(db, "spaces", spaceId, "members", user.uid), {
    joinedAt: serverTimestamp()
  });

  await setDoc(doc(db, "userSpaces", `${user.uid}_${spaceId}`), {
    userId: user.uid,
    spaceId: spaceId,
    joinedAt: serverTimestamp()
  });
};

export const createSpace = async (name: string, description: string, providedCode?: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Unauthenticated");

  const code = providedCode || Math.random().toString(36).substring(2, 8).toUpperCase();
  
  const spaceRef = doc(collection(db, "spaces"));
  const spaceId = spaceRef.id;

  const spaceData = {
    name,
    description,
    inviteCode: code,
    createdBy: user.uid,
    createdAt: serverTimestamp()
  };

  await setDoc(spaceRef, spaceData);

  await setDoc(doc(db, "userSpaces", `${user.uid}_${spaceId}`), {
    userId: user.uid,
    spaceId: spaceId,
    joinedAt: serverTimestamp()
  });

  await setDoc(doc(db, "spaces", spaceId, "members", user.uid), { 
    joinedAt: serverTimestamp() 
  });

  return spaceId;
};

export const deleteSpace = async (spaceId: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Unauthenticated");

  // Verify ownership
  const spaceDoc = await getDoc(doc(db, "spaces", spaceId));
  if (!spaceDoc.exists()) throw new Error("Space not found");
  
  const spaceData = spaceDoc.data() as Space;
  if (spaceData.createdBy !== user.uid) {
    throw new Error("Unauthorized: Only space creator can delete");
  }

  // 1. Update journals to remove spaceId
  const journalsQuery = query(collection(db, "journals"), where("spaceId", "==", spaceId));
  const journalsSnap = await getDocs(journalsQuery);
  for (const journalDoc of journalsSnap.docs) {
    await updateDoc(journalDoc.ref, { spaceId: null, visibility: "private" });
  }

  // 2. Delete members
  const membersQuery = query(collection(db, "spaces", spaceId, "members"));
  const membersSnap = await getDocs(membersQuery);
  for (const memberDoc of membersSnap.docs) {
    await deleteDoc(memberDoc.ref);
  }
  
  // 3. Delete userSpaces
  const userSpacesQuery = query(collection(db, "userSpaces"), where("spaceId", "==", spaceId));
  const userSpacesSnap = await getDocs(userSpacesQuery);
  for (const userSpaceDoc of userSpacesSnap.docs) {
    await deleteDoc(userSpaceDoc.ref);
  }
  
  // 4. Delete space
  await deleteDoc(doc(db, "spaces", spaceId));
};
