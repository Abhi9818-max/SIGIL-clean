
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
      // Mark penalty as applied to prevent it from being applied again
      setTodoItems(prevItems => 
        prevItems.map(i => i.id === item.id ? {...i, penaltyApplied: true} : i)
      );
    }
  }, [userRecords, toast]);
  
  // This effect runs once on load to handle daily state management
  useEffect(() => {
    let initialItems: TodoItem[] = [];
    try {
      const storedTodoItems = localStorage.getItem(LOCAL_STORAGE_TODO_KEY);
      if (storedTodoItems) {
        initialItems = JSON.parse(storedTodoItems);
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
    
    // If it's a new day, process overdue penalties from previous day(s)
    if (lastVisitedDateStr && lastVisitedDateStr !== todayStr) {
      const lastVisitedDate = parseISO(lastVisitedDateStr);
      const newlyOverdueItems = initialItems.filter(item => 
        !item.completed && 
        !item.penaltyApplied && 
        item.dueDate && 
        parseISO(item.dueDate) <= lastVisitedDate
      );
      
      if (newlyOverdueItems.length > 0) {
        let penaltyToastShown = false;
        const updatedItems = initialItems.map(item => {
           if (newlyOverdueItems.some(overdue => overdue.id === item.id)) {
              if (item.penalty && item.penalty > 0) {
                 userRecords.deductBonusPoints(item.penalty);
                 penaltyToastShown = true;
              }
              return {...item, penaltyApplied: true};
           }
           return item;
        });
        initialItems = updatedItems;
        
        if (penaltyToastShown) {
            toast({
              title: "Pacts Broken",
              description: `Incomplete pacts from yesterday have been penalized.`,
              variant: "destructive",
              duration: 7000,
            });
        }
      }
    }
    
    // Filter out old pacts (older than yesterday) but keep today's and yesterday's
    const relevantItems = initialItems.filter(item => {
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
  }, []); // This should only run once on initial load. Dependencies are intentionally omitted.


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
    const item = todoItems.find(i => i.id === id);
    if (!item) return;

    // Check for penalty when completing an overdue task
    const isOverdue = item.dueDate && !item.completed && isPast(startOfDay(new Date(item.dueDate)));
    if (isOverdue && !item.penaltyApplied) {
        applyPenalty(item);
    }

    setTodoItems(prevItems =>
      prevItems.map(i =>
        i.id === id ? { ...i, completed: !i.completed } : i
      )
    );
  }, [todoItems, applyPenalty]);

  const deleteTodoItem = useCallback((id: string) => {
    const item = todoItems.find(i => i.id === id);
    if (!item) return;
    
    // Deleting is only allowed for today's pacts to prevent accidental deletion of yesterday's reviewable items.
    if (!isToday(new Date(item.createdAt))) return;

     // Check for penalty when deleting an overdue, uncompleted task
    const isOverdue = item.dueDate && !item.completed && isPast(startOfDay(new Date(item.dueDate)));
    if (isOverdue && !item.penaltyApplied) {
        applyPenalty(item);
    }

    setTodoItems(prevItems => prevItems.filter(i => i.id !== id));
  }, [todoItems, applyPenalty]);

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
