
"use client";

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { UserSearch, UserPlus, Users, Mail, Check, X } from 'lucide-react';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { FriendProvider, useFriends } from '@/components/providers/FriendProvider';
import type { SearchedUser, FriendRequest } from '@/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

// Simple hash function to get a number from a string
const simpleHash = (s: string) => {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
        const char = s.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
};

const FriendsContent = () => {
    const { user } = useAuth();
    const { getUserLevelInfo } = useUserRecords();
    const {
        searchUser,
        sendFriendRequest,
        incomingRequests,
        pendingRequests,
        friends,
        acceptFriendRequest,
        declineFriendRequest,
        cancelFriendRequest
    } = useFriends();

    const [usernameQuery, setUsernameQuery] = useState('');
    const [searchedUser, setSearchedUser] = useState<SearchedUser | null>(null);
    const [isLoadingSearch, setIsLoadingSearch] = useState(false);
    const [searchMessage, setSearchMessage] = useState<string | null>(null);
    const { toast } = useToast();

    const handleSearch = async () => {
        if (!usernameQuery.trim() || usernameQuery.trim() === user?.displayName) {
            setSearchMessage("Please enter a valid username other than your own.");
            setSearchedUser(null);
            return;
        }
        setIsLoadingSearch(true);
        setSearchMessage(null);
        setSearchedUser(null);
        try {
            const foundUser = await searchUser(usernameQuery);
            if (foundUser) {
                setSearchedUser(foundUser);
            } else {
                setSearchMessage("User not found.");
            }
        } catch (error) {
            console.error("Error searching user:", error);
            setSearchMessage("An error occurred while searching.");
        } finally {
            setIsLoadingSearch(false);
        }
    };

    const handleSendRequest = async (recipientId: string, recipientUsername: string) => {
        try {
            await sendFriendRequest(recipientId, recipientUsername);
            toast({ title: "Request Sent", description: `Friend request sent to ${recipientUsername}.` });
            setSearchedUser(null); // Clear search result after sending request
        } catch (error) {
            toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
        }
    };

    const levelInfo = getUserLevelInfo();
    const pageTierClass = levelInfo ? `page-tier-group-${levelInfo.tierGroup}` : 'page-tier-group-1';

    const requestAlreadySent = searchedUser && pendingRequests.some(req => req.recipientId === searchedUser.uid);
    const isAlreadyFriend = searchedUser && friends.some(friend => friend.uid === searchedUser.uid);
    const hasIncomingRequest = searchedUser && incomingRequests.some(req => req.senderId === searchedUser.uid);
    
    const getAvatarForId = (id: string) => {
        const avatarNumber = (simpleHash(id) % 12) + 1;
        return `/images/avatars/avatar-${avatarNumber}.jpeg`;
    }

    return (
        <div className={cn("min-h-screen flex flex-col", pageTierClass)}>
            <Header onAddRecordClick={() => {}} onManageTasksClick={() => {}} />
            <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <UserSearch className="h-6 w-6 text-primary" />
                                    <CardTitle>Find Friends</CardTitle>
                                </div>
                                <CardDescription>Search for other users by their exact username to connect.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Enter username..."
                                        value={usernameQuery}
                                        onChange={(e) => setUsernameQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                    <Button onClick={handleSearch} disabled={isLoadingSearch}>
                                        {isLoadingSearch ? "Searching..." : "Search"}
                                    </Button>
                                </div>
                                {searchMessage && <p className="text-sm text-muted-foreground mt-3">{searchMessage}</p>}
                                {searchedUser && (
                                    <div className="mt-4 p-4 border rounded-lg flex items-center justify-between bg-muted/50">
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={getAvatarForId(searchedUser.uid)} />
                                                <AvatarFallback>{searchedUser.username.charAt(0).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{searchedUser.username}</span>
                                        </div>
                                        {isAlreadyFriend ? (
                                            <p className="text-sm text-green-500">Already Friends</p>
                                        ) : hasIncomingRequest ? (
                                             <p className="text-sm text-blue-500">Check incoming requests</p>
                                        ) : requestAlreadySent ? (
                                            <p className="text-sm text-muted-foreground">Request Sent</p>
                                        ) : (
                                            <Button size="sm" onClick={() => handleSendRequest(searchedUser.uid, searchedUser.username)}>
                                                <UserPlus className="h-4 w-4 mr-2" /> Add Friend
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader>
                                 <div className="flex items-center gap-2">
                                    <Users className="h-6 w-6 text-primary" />
                                    <CardTitle>Your Friends</CardTitle>
                                </div>
                                <CardDescription>View your connected friends and their progress.</CardDescription>
                            </CardHeader>
                             <CardContent>
                                {friends.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-4">You have no friends yet.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {friends.map(friend => (
                                            <Link href={`/friends/${friend.uid}`} key={friend.uid}>
                                                <div className="p-3 border rounded-lg flex items-center justify-between bg-card hover:bg-muted/50 transition-colors cursor-pointer">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar>
                                                            <AvatarImage src={friend.photoURL || getAvatarForId(friend.uid)} />
                                                            <AvatarFallback>{friend.username.charAt(0).toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-medium">{friend.username}</span>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-8">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-6 w-6 text-primary" />
                                    <CardTitle>Incoming Requests</CardTitle>
                                </div>
                                <CardDescription>Accept or decline requests from other users.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {incomingRequests.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-4">No incoming requests.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {incomingRequests.map(req => (
                                            <div key={req.id} className="p-3 border rounded-lg flex items-center justify-between bg-card">
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={getAvatarForId(req.senderId)} />
                                                        <AvatarFallback>{req.senderUsername.charAt(0).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium text-sm">{req.senderUsername}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button size="icon" className="h-8 w-8 bg-green-500 hover:bg-green-600" onClick={() => acceptFriendRequest(req)}><Check className="h-4 w-4" /></Button>
                                                    <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => declineFriendRequest(req.id)}><X className="h-4 w-4" /></Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        
                         <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Pending Requests</CardTitle>
                                <CardDescription>Requests you have sent.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {pendingRequests.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-4">No pending requests.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {pendingRequests.map(req => (
                                            <div key={req.id} className="p-3 border rounded-lg flex items-center justify-between bg-card">
                                                 <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={getAvatarForId(req.recipientId)} />
                                                        <AvatarFallback>{req.recipientUsername.charAt(0).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium text-sm">{req.recipientUsername}</span>
                                                </div>
                                                <Button size="sm" variant="outline" onClick={() => cancelFriendRequest(req.id)}>Cancel</Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default function FriendsPage() {
    return (
        <FriendProvider>
            <FriendsContent />
        </FriendProvider>
    )
}
