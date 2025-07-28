
"use client";

import type { TodoItem } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useUserRecords } from './UserRecordsProvider';
import { useToast } from '@/hooks/use-toast';
import { isPast, startOfDay, format, parseISO, isToday, isYesterday, subDays } from 'date-fns';
import { useAuth } from './AuthProvider';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';

interface TodoContextType {
  todoItems: TodoItem[];
  addTodoItem: (text: string, dueDate?: string, penalty?: number) => void;
  toggleTodoItem: (id: string) => void;
  deleteTodoItem: (id: string) => void;
  getTodoItemById: (id: string) => TodoItem | undefined;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

// Helper function to create a Firestore-safe object by removing undefined keys
const sanitizeForFirestore = (obj: any) => {
  const newObj: any = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      newObj[key] = obj[key];
    }
  }
  return newObj;
};


export const TodoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);
  const userRecords = useUserRecords();
  const { user, userData, isUserDataLoaded } = useAuth();
  const { toast } = useToast();

  const applyPenalty = useCallback((item: TodoItem): TodoItem => {
    // Only apply penalty if it's defined, positive, and not already applied
    if (item.penalty && item.penalty > 0 && userRecords.deductBonusPoints && !item.penaltyApplied) {
      userRecords.deductBonusPoints(item.penalty);
      toast({
        title: "Pact Broken",
        description: `Your pact "${item.text}" was not honored in time. A penalty of ${item.penalty} XP has been deducted.`,
        variant: "destructive",
        duration: 7000,
      });
      return { ...item, penaltyApplied: true };
    }
    // If there's no penalty to apply, just return the item as-is.
    return item;
  }, [userRecords, toast]);

  // Load from Firebase on auth state change
  useEffect(() => {
    if (isUserDataLoaded && userData) {
      const allStoredItems = userData.todoItems || [];
      
      let processedItems = [...allStoredItems];
      let penaltiesApplied = false;

      processedItems = allStoredItems.map(item => {
        // Sanitize item first to remove any legacy undefined fields
        const sanitizedItem = sanitizeForFirestore(item) as TodoItem;
        if (!sanitizedItem.completed && !sanitizedItem.penaltyApplied && sanitizedItem.dueDate) {
          const dueDate = startOfDay(parseISO(sanitizedItem.dueDate));
          if (isPast(dueDate)) {
            penaltiesApplied = true;
            return applyPenalty(sanitizedItem);
          }
        }
        return sanitizedItem;
      });

      if (penaltiesApplied) {
         toast({
            title: "Pacts Judged",
            description: `Incomplete pacts from previous days have been penalized.`,
            variant: "destructive",
            duration: 7000,
          });
      }
      
      const yesterday = subDays(new Date(), 1);
      const relevantItems = processedItems.filter(item => {
        try {
          const itemDate = new Date(item.createdAt);
          return isToday(itemDate) || isYesterday(itemDate);
        } catch (e) { return false; }
      });
      
      setTodoItems(relevantItems);
    } else if (isUserDataLoaded) {
      setTodoItems([]);
    }
  }, [userData, isUserDataLoaded, applyPenalty, toast]);

  // Save to Firebase when todoItems change
  const updateDbWithTodos = useCallback(async (newTodos: TodoItem[]) => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          // Sanitize every item before saving to be safe
          const sanitizedTodos = newTodos.map(item => sanitizeForFirestore(item));
          await setDoc(userDocRef, { todoItems: sanitizedTodos }, { merge: true });
        } catch (e) {
           console.error(`Failed to update todoItems in Firestore:`, e);
        }
      }
  }, [user]);

  const addTodoItem = useCallback((text: string, dueDate?: string, penalty?: number) => {
    if (text.trim() === '') return;
    
    let newItem: TodoItem = {
      id: uuidv4(),
      text,
      completed: false,
      createdAt: new Date().toISOString(),
      dueDate,
      penaltyApplied: false,
    };
    
    // Only add penalty field if it has a value
    if (dueDate && penalty && penalty > 0) {
      newItem.penalty = penalty;
    }

    setTodoItems(prevItems => {
        const newItems = [newItem, ...prevItems].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        updateDbWithTodos(newItems);
        return newItems;
    });
  }, [updateDbWithTodos]);

  const toggleTodoItem = useCallback((id: string) => {
    setTodoItems(prevItems => {
        const newItems = prevItems.map(item => {
            if (item.id === id) {
              const isOverdue = item.dueDate && !item.completed && isPast(startOfDay(new Date(item.dueDate)));
              
              if (isOverdue && !item.penaltyApplied) {
                const updatedItemWithPenalty = applyPenalty(item);
                return { ...updatedItemWithPenalty, completed: !item.completed };
              }
              
              return { ...item, completed: !item.completed };
            }
            return item;
        });
        updateDbWithTodos(newItems);
        return newItems;
    });
  }, [applyPenalty, updateDbWithTodos]);

  const deleteTodoItem = useCallback((id: string) => {
    const item = todoItems.find(i => i.id === id);
    if (!item || !isToday(new Date(item.createdAt))) return;

    setTodoItems(prevItems => {
        const newItems = prevItems.filter(i => i.id !== id);
        updateDbWithTodos(newItems);
        return newItems;
    });
  }, [todoItems, updateDbWithTodos]);

  const getTodoItemById = useCallback((id: string): TodoItem | undefined => {
    return todoItems.find(item => item.id === id);
  }, [todoItems]);

  return (
    <TodoContext.Provider value={{ 
      todoItems, 
      addTodoItem, 
      toggleTodoItem, 
      deleteTodoItem,
      getTodoItemById 
    }}>
      {children}
    </TodoContext.Provider>
  );
};

export const useTodos = (): TodoContextType => {
  const context = useContext(TodoContext);
  if (context === undefined) {
    throw new Error('useTodos must be used within a TodoProvider');
  }
  return context;
};
