
"use client";

import type { TodoItem } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useUserRecords } from './UserRecordsProvider';
import { useToast } from '@/hooks/use-toast';
import { isPast, startOfDay, format, parseISO, isToday, isYesterday, subDays } from 'date-fns';
import { useAuth } from './AuthProvider';
import { v4 as uuidv4 } from 'uuid';

interface TodoContextType {
  todoItems: TodoItem[];
  addTodoItem: (text: string, dueDate?: string, penalty?: number) => void;
  toggleTodoItem: (id: string) => void;
  deleteTodoItem: (id: string) => void;
  getTodoItemById: (id: string) => TodoItem | undefined;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

export const TodoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);
  const userRecords = useUserRecords();
  const { userData, isUserDataLoaded } = useAuth();
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
        if (!item.completed && !item.penaltyApplied && item.dueDate) {
          const dueDate = startOfDay(parseISO(item.dueDate));
          if (isPast(dueDate)) {
            penaltiesApplied = true;
            return applyPenalty(item);
          }
        }
        return item;
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
      // If penalties were applied, we need to save the updated items back to the DB.
      if (penaltiesApplied) {
          userRecords.updateUserDataInDb({ todoItems: processedItems });
      }

    } else if (isUserDataLoaded) {
      setTodoItems([]);
    }
  }, [userData, isUserDataLoaded, applyPenalty, toast, userRecords.updateUserDataInDb]);


  const addTodoItem = useCallback((text: string, dueDate?: string, penalty?: number) => {
    if (text.trim() === '') return;
    
    const newItem: TodoItem = {
      id: uuidv4(),
      text,
      completed: false,
      createdAt: new Date().toISOString(),
      ...(dueDate && { dueDate }),
      ...(dueDate && penalty && penalty > 0 && { penalty }),
      penaltyApplied: false,
    };

    setTodoItems(prevItems => {
        const newItems = [newItem, ...prevItems].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        userRecords.updateUserDataInDb({ todoItems: newItems });
        return newItems;
    });
  }, [userRecords.updateUserDataInDb]);

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
        userRecords.updateUserDataInDb({ todoItems: newItems });
        return newItems;
    });
  }, [applyPenalty, userRecords.updateUserDataInDb]);

  const deleteTodoItem = useCallback((id: string) => {
    const item = todoItems.find(i => i.id === id);
    if (!item || !isToday(new Date(item.createdAt))) return;

    setTodoItems(prevItems => {
        const newItems = prevItems.filter(i => i.id !== id);
        userRecords.updateUserDataInDb({ todoItems: newItems });
        return newItems;
    });
  }, [todoItems, userRecords.updateUserDataInDb]);

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
