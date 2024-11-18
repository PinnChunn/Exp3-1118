import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  query, 
  where, 
  updateDoc,
  serverTimestamp,
  DocumentData
} from 'firebase/firestore';

export interface Event {
  id?: string;
  title: string;
  date: string;
  time: string;
  format: string;
  location?: string;
  description: string;
  imageUrl: string;
  price?: number;
  xp?: number;
  attendeeLimit: number;
  tags: string[];
  skills: string[];
  requirements: string[];
  instructor: {
    id: string;
    name: string;
    role: string;
    avatar: string;
    bio: string;
  };
  createdAt?: any;
  updatedAt?: any;
  registeredUsers?: string[];
  status: 'draft' | 'published' | 'cancelled' | 'completed';
}

export const createEvent = async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const eventRef = await addDoc(collection(db, 'events'), {
      ...eventData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      registeredUsers: []
    });

    return { 
      id: eventRef.id, 
      error: null 
    };
  } catch (error) {
    console.error('Error creating event:', error);
    return { 
      id: null, 
      error: 'Failed to create event' 
    };
  }
};

export const getEvents = async (filters?: {
  status?: Event['status'];
  instructorId?: string;
  tags?: string[];
}) => {
  try {
    let eventsQuery = collection(db, 'events');

    if (filters) {
      eventsQuery = query(eventsQuery, where('status', '==', filters.status || 'published'));
      
      if (filters.instructorId) {
        eventsQuery = query(eventsQuery, where('instructor.id', '==', filters.instructorId));
      }
      
      if (filters.tags && filters.tags.length > 0) {
        eventsQuery = query(eventsQuery, where('tags', 'array-contains-any', filters.tags));
      }
    }

    const querySnapshot = await getDocs(eventsQuery);
    const events = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Event[];

    return { events, error: null };
  } catch (error) {
    console.error('Error fetching events:', error);
    return { events: [], error: 'Failed to fetch events' };
  }
};

export const getEvent = async (id: string) => {
  try {
    const docRef = doc(db, 'events', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { 
        event: { 
          id: docSnap.id, 
          ...docSnap.data() 
        } as Event, 
        error: null 
      };
    } else {
      return { event: null, error: 'Event not found' };
    }
  } catch (error) {
    console.error('Error fetching event:', error);
    return { event: null, error: 'Failed to fetch event' };
  }
};

export const updateEvent = async (id: string, eventData: Partial<Event>) => {
  try {
    const eventRef = doc(db, 'events', id);
    await updateDoc(eventRef, {
      ...eventData,
      updatedAt: serverTimestamp()
    });
    return { error: null };
  } catch (error) {
    console.error('Error updating event:', error);
    return { error: 'Failed to update event' };
  }
};

export const registerForEvent = async (eventId: string, userId: string) => {
  try {
    const eventRef = doc(db, 'events', eventId);
    const eventDoc = await getDoc(eventRef);
    
    if (!eventDoc.exists()) {
      return { error: 'Event not found' };
    }

    const event = eventDoc.data() as Event;
    const registeredUsers = event.registeredUsers || [];

    if (registeredUsers.includes(userId)) {
      return { error: 'Already registered for this event' };
    }

    if (registeredUsers.length >= event.attendeeLimit) {
      return { error: 'Event is full' };
    }

    await updateDoc(eventRef, {
      registeredUsers: [...registeredUsers, userId],
      updatedAt: serverTimestamp()
    });

    return { error: null };
  } catch (error) {
    console.error('Error registering for event:', error);
    return { error: 'Failed to register for event' };
  }
};

export const cancelEventRegistration = async (eventId: string, userId: string) => {
  try {
    const eventRef = doc(db, 'events', eventId);
    const eventDoc = await getDoc(eventRef);
    
    if (!eventDoc.exists()) {
      return { error: 'Event not found' };
    }

    const event = eventDoc.data() as Event;
    const registeredUsers = event.registeredUsers || [];

    if (!registeredUsers.includes(userId)) {
      return { error: 'Not registered for this event' };
    }

    await updateDoc(eventRef, {
      registeredUsers: registeredUsers.filter(id => id !== userId),
      updatedAt: serverTimestamp()
    });

    return { error: null };
  } catch (error) {
    console.error('Error cancelling registration:', error);
    return { error: 'Failed to cancel registration' };
  }
};

export const getUserEvents = async (userId: string) => {
  try {
    const eventsQuery = query(
      collection(db, 'events'),
      where('registeredUsers', 'array-contains', userId)
    );
    
    const querySnapshot = await getDocs(eventsQuery);
    const events = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Event[];
    
    return { events, error: null };
  } catch (error) {
    console.error('Error fetching user events:', error);
    return { events: [], error: 'Failed to fetch user events' };
  }
};