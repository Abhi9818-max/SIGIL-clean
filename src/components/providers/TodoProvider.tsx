
"use client";

import type { TodoItem } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { LOCAL_STORAGE_TODO_KEY } from '@/lib/config';
import { v4 as uuidv4 } from 'uuid';

interface TodoContextType {
  todoItems: TodoItem[];
  addTodoItem: (text: string, dueDate?: string) => void; // Added dueDate parameter
  toggleTodoItem: (id: string) => void;
  deleteTodoItem: (id: string) => void;
  getTodoItemById: (id: string) => TodoItem | undefined;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

export const TodoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

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

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(LOCAL_STORAGE_TODO_KEY, JSON.stringify(todoItems));
      } catch (error) {
        console.error("Failed to save to-do items to localStorage:", error);
      }
    }
  }, [todoItems, isLoaded]);

  const addTodoItem = useCallback((text: string, dueDate?: string) => {
    if (text.trim() === '') return;
    const newItem: TodoItem = {
      id: uuidv4(),
      text,
      completed: false,
      createdAt: new Date().toISOString(),
      dueDate, // Add dueDate to the new item
    };
    setTodoItems(prevItems => [newItem, ...prevItems]); // Add new items to the top
  }, []);

  const toggleTodoItem = useCallback((id: string) => {
    setTodoItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  }, []);

  const deleteTodoItem = useCallback((id: string) => {
    setTodoItems(prevItems => prevItems.filter(item => item.id !== id));
  }, []);

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
