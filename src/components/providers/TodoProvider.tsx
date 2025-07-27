
"use client";

import type { TodoItem } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { LOCAL_STORAGE_TODO_KEY, LOCAL_STORAGE_LAST_VISITED_DATE_KEY } from '@/lib/config';
import { v4 as uuidv4 } from 'uuid';
import { useUserRecords } from './UserRecordsProvider';
import { useToast } from '@/hooks/use-toast';
import { isPast, startOfDay, format, parseISO, isToday, isYesterday, subDays } from 'date-fns';

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
  const [isLoaded, setIsLoaded] = useState(false);
  const userRecords = useUserRecords();
  const { toast } = useToast();

  const applyPenalty = useCallback((item: TodoItem) => {
    if (item.penalty && item.penalty > 0 && userRecords.deductBonusPoints && !item.penaltyApplied) {
      userRecords.deductBonusPoints(item.penalty);
      toast({
        title: "Pact Broken",
        description: `Your pact "${item.text}" was not honored in time. A penalty of ${item.penalty} XP has been deducted.`,
        variant: "destructive",
        duration: 7000,
      });
      // Return a new item with the penalty applied
      return { ...item, penaltyApplied: true };
    }
    return item;
  }, [userRecords, toast]);

  // This effect runs once on load to handle daily state management
  useEffect(() => {
    let allStoredItems: TodoItem[] = [];
    try {
      const storedTodoItems = localStorage.getItem(LOCAL_STORAGE_TODO_KEY);
      if (storedTodoItems) {
        allStoredItems = JSON.parse(storedTodoItems);
      }
    } catch (error) {
      console.error("Failed to load to-do items from localStorage:", error);
    }

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    let lastVisitedDateStr: string | null = null;
    try {
        lastVisitedDateStr = localStorage.getItem(LOCAL_STORAGE_LAST_VISITED_DATE_KEY);
    } catch(error) {
        console.error("Failed to load last visited date from localStorage:", error);
    }
    
    let processedItems = [...allStoredItems];

    // If it's a new day, process overdue penalties from previous day(s)
    if (lastVisitedDateStr && lastVisitedDateStr !== todayStr) {
      const lastVisitedDate = startOfDay(parseISO(lastVisitedDateStr));
      
      let penaltyToastShown = false;
      processedItems = processedItems.map(item => {
         if (!item.completed && !item.penaltyApplied && item.dueDate) {
             const dueDate = startOfDay(parseISO(item.dueDate));
             if (dueDate <= lastVisitedDate) {
                penaltyToastShown = true;
                return applyPenalty(item);
             }
         }
         return item;
      });
      
      if (penaltyToastShown) {
          toast({
            title: "Pacts Judged",
            description: `Incomplete pacts from previous days have been penalized.`,
            variant: "destructive",
            duration: 7000,
          });
      }
    }
    
    // Filter out old pacts (older than yesterday) but keep today's and yesterday's
    const yesterday = subDays(new Date(), 1);
    const relevantItems = processedItems.filter(item => {
      try {
        const itemDate = new Date(item.createdAt);
        return isToday(itemDate) || isYesterday(itemDate);
      } catch (e) {
        return false;
      }
    });

    setTodoItems(relevantItems);

    // Update the last visited date
    try {
      localStorage.setItem(LOCAL_STORAGE_LAST_VISITED_DATE_KEY, todayStr);
    } catch(error) {
        console.error("Failed to save last visited date to localStorage:", error);
    }
    
    setIsLoaded(true);
  }, []); // Intentionally empty dependency array to run only once on mount


  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(LOCAL_STORAGE_TODO_KEY, JSON.stringify(todoItems));
      } catch (error) {
        console.error("Failed to save to-do items to localStorage:", error);
      }
    }
  }, [todoItems, isLoaded]);

  const addTodoItem = useCallback((text: string, dueDate?: string, penalty?: number) => {
    if (text.trim() === '') return;
    const newItem: TodoItem = {
      id: uuidv4(),
      text,
      completed: false,
      createdAt: new Date().toISOString(),
      dueDate,
      penalty: (dueDate && penalty && penalty > 0) ? penalty : undefined,
      penaltyApplied: false,
    };
    setTodoItems(prevItems => [newItem, ...prevItems].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }, []);

  const toggleTodoItem = useCallback((id: string) => {
    setTodoItems(prevItems =>
      prevItems.map(item => {
        if (item.id === id) {
          const isOverdue = item.dueDate && !item.completed && isPast(startOfDay(new Date(item.dueDate)));
          
          // Apply penalty if completing an overdue task
          if (isOverdue && !item.penaltyApplied) {
            const updatedItemWithPenalty = applyPenalty(item);
            return { ...updatedItemWithPenalty, completed: !item.completed };
          }
          
          return { ...item, completed: !item.completed };
        }
        return item;
      })
    );
  }, [applyPenalty]);


  const deleteTodoItem = useCallback((id: string) => {
    const item = todoItems.find(i => i.id === id);
    if (!item) return;
    
    // Deleting is only allowed for today's pacts to prevent accidental deletion of yesterday's reviewable items.
    if (!isToday(new Date(item.createdAt))) return;

    setTodoItems(prevItems => prevItems.filter(i => i.id !== id));
  }, [todoItems]);

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
