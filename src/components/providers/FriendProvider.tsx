
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { collection, query, where, getDocs, doc, setDoc, onSnapshot, writeBatch, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthProvider';
import type { SearchedUser, FriendRequest, Friend, UserData } from '@/types';
import { useToast } from "@/hooks/use-toast";

interface FriendContextType {
    searchUser: (username: string) => Promise<SearchedUser | null>;
    sendFriendRequest: (recipientId: string, recipientUsername: string) => Promise<void>;
    acceptFriendRequest: (request: FriendRequest) => Promise<void>;
    declineFriendRequest: (requestId: string) => Promise<void>;
    cancelFriendRequest: (requestId: string) => Promise<void>;
    getFriendData: (friendId: string) => Promise<UserData | null>;
    incomingRequests: FriendRequest[];
    pendingRequests: FriendRequest[];
    friends: Friend[];
}

const FriendContext = createContext<FriendContextType | undefined>(undefined);

export const FriendProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, userData } = useAuth();
    const { toast } = useToast();
    const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
    const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
    const [friends, setFriends] = useState<Friend[]>([]);

    useEffect(() => {
        if (!user) return;

        // Listen for incoming friend requests
        const incomingQuery = query(collection(db, 'friend_requests'), where('recipientId', '==', user.uid), where('status', '==', 'pending'));
        const unsubscribeIncoming = onSnapshot(incomingQuery, (snapshot) => {
            const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest));
            setIncomingRequests(requests);
        });

        // Listen for sent/pending friend requests
        const pendingQuery = query(collection(db, 'friend_requests'), where('senderId', '==', user.uid), where('status', '==', 'pending'));
        const unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
            const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest));
            setPendingRequests(requests);
        });
        
        // Listen for friends
        const friendsQuery = collection(db, `users/${user.uid}/friends`);
        const unsubscribeFriends = onSnapshot(friendsQuery, (snapshot) => {
            const friendsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Friend));
            setFriends(friendsList);
        });

        return () => {
            unsubscribeIncoming();
            unsubscribePending();
            unsubscribeFriends();
        };
    }, [user]);

    const searchUser = useCallback(async (username: string): Promise<SearchedUser | null> => {
        const usersRef = collection(db, 'users');
        const searchTerm = username.toLowerCase();
        const q = query(usersRef, where('username_lowercase', '==', searchTerm));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }

        const userDoc = querySnapshot.docs[0];
        const foundUserData = userDoc.data();
        return {
            uid: userDoc.id,
            username: foundUserData.username,
            photoURL: foundUserData.photoURL,
        };
    }, []);

    const sendFriendRequest = useCallback(async (recipientId: string, recipientUsername: string) => {
        if (!user || !user.displayName) throw new Error("You must be logged in to send requests.");
        if (user.uid === recipientId) throw new Error("You cannot send a request to yourself.");

        const requestId = `${user.uid}_${recipientId}`;
        const requestRef = doc(db, 'friend_requests', requestId);
        const requestSnap = await getDoc(requestRef);

        if (requestSnap.exists()) {
            throw new Error("Friend request already sent or exists.");
        }

        const newRequest: Omit<FriendRequest, 'id'> = {
            senderId: user.uid,
            senderUsername: user.displayName,
            recipientId: recipientId,
            recipientUsername: recipientUsername,
            status: 'pending',
            createdAt: new Date().toISOString(),
        };

        await setDoc(requestRef, newRequest);
    }, [user]);

    const acceptFriendRequest = useCallback(async (request: FriendRequest) => {
        if (!user || !user.displayName) return;
        const batch = writeBatch(db);
        
        // Get the sender's data to include their photoURL
        const senderDataDoc = await getDoc(doc(db, 'users', request.senderId));
        const senderData = senderDataDoc.data() as UserData;

        // Add to each other's friends subcollection
        const currentUserFriendRef = doc(db, `users/${user.uid}/friends`, request.senderId);
        batch.set(currentUserFriendRef, { 
            uid: request.senderId, 
            username: request.senderUsername, 
            photoURL: senderData?.photoURL || null,
            since: new Date().toISOString() 
        });

        const senderFriendRef = doc(db, `users/${request.senderId}/friends`, user.uid);
        batch.set(senderFriendRef, { 
            uid: user.uid, 
            username: user.displayName, 
            photoURL: userData?.photoURL || null,
            since: new Date().toISOString() 
        });
        
        // Delete the request
        const requestRef = doc(db, 'friend_requests', request.id);
        batch.delete(requestRef);

        await batch.commit();
        toast({ title: 'Friend Added', description: `You are now friends with ${request.senderUsername}.` });
    }, [user, userData, toast]);

    const declineFriendRequest = useCallback(async (requestId: string) => {
        const requestRef = doc(db, 'friend_requests', requestId);
        await deleteDoc(requestRef);
        toast({ title: 'Request Declined', variant: 'destructive' });
    }, [toast]);
    
    const cancelFriendRequest = useCallback(async (requestId: string) => {
        const requestRef = doc(db, 'friend_requests', requestId);
        await deleteDoc(requestRef);
        toast({ title: 'Request Cancelled' });
    }, [toast]);
    
    const getFriendData = useCallback(async (friendId: string): Promise<UserData | null> => {
        if (!user) return null;
        
        // Check if they are actually a friend first
        const friendRef = doc(db, `users/${user.uid}/friends`, friendId);
        const friendSnap = await getDoc(friendRef);
        if (!friendSnap.exists()) {
            console.error("Not a friend.");
            return null;
        }

        const userDocRef = doc(db, 'users', friendId);
        const docSnap = await getDoc(userDocRef);
        
        if (docSnap.exists()) {
            return docSnap.data() as UserData;
        }
        return null;
    }, [user]);

    return (
        <FriendContext.Provider value={{ 
            searchUser, 
            sendFriendRequest,
            acceptFriendRequest,
            declineFriendRequest,
            cancelFriendRequest,
            getFriendData,
            incomingRequests, 
            pendingRequests, 
            friends 
        }}>
            {children}
        </FriendContext.Provider>
    );
};

export const useFriends = (): FriendContextType => {
    const context = useContext(FriendContext);
    if (context === undefined) {
        throw new Error('useFriends must be used within a FriendProvider');
    }
    return context;
};
