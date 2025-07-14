
"use client";

import type { TodoItem } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { LOCAL_STORAGE_TODO_KEY } from '@/lib/config';
import { v4 as uuidv4 } from 'uuid';
import { useUserRecords } from './UserRecordsProvider';
import { useToast } from '@/hooks/use-toast';
import { isPast, startOfDay } from 'date-fns';

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

  useEffect(() => {
    try {
      const storedTodoItems = localStorage.getItem(LOCAL_STORAGE_TODO_KEY);
      if (storedTodoItems) {
        setTodoItems(JSON.parse(storedTodoItems));
      }
    } catch (error) {
      console.error("Failed to load to-do items from localStorage:", error);
    }
    setIsLoaded(true);
  }, []);
  
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


  // Check for overdue tasks on load
  useEffect(() => {
    if (isLoaded) {
      const today = startOfDay(new Date());
      todoItems.forEach(item => {
        if (item.dueDate && !item.completed && isPast(startOfDay(new Date(item.dueDate))) && !item.penaltyApplied) {
          applyPenalty(item);
        }
      });
      // Save any changes from penalty applications
      try {
        localStorage.setItem(LOCAL_STORAGE_TODO_KEY, JSON.stringify(todoItems));
      } catch (error) {
        console.error("Failed to save to-do items to localStorage:", error);
      }
    }
  }, [isLoaded, applyPenalty]); // Removed todoItems dependency to avoid loop


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
