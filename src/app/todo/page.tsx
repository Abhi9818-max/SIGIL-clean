
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTodos } from '@/components/providers/TodoProvider';
import { ListChecks, Trash2, CalendarIcon, CalendarDays } from 'lucide-react';
import Header from '@/components/layout/Header';
import { cn } from '@/lib/utils';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isPast, startOfDay } from 'date-fns';

export default function TodoPage() {
  const [newItemText, setNewItemText] = useState('');
  const [newDueDate, setNewDueDate] = useState<Date | undefined>();
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const { todoItems, addTodoItem, toggleTodoItem, deleteTodoItem } = useTodos();
  const { getUserLevelInfo } = useUserRecords();

  useEffect(() => {
    setNewDueDate(new Date());
    setCurrentYear(new Date().getFullYear());
  }, []);

  const handleAddItem = () => {
    if (newItemText.trim()) {
      const dueDateString = newDueDate ? format(newDueDate, 'yyyy-MM-dd') : undefined;
      addTodoItem(newItemText, dueDateString);
      setNewItemText('');
      setNewDueDate(undefined); // Reset to undefined, showing "Pick date" for next task
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    // If the selected date is clicked again, deselect it (set to undefined)
    if (newDueDate && date && startOfDay(newDueDate).getTime() === startOfDay(date).getTime()) {
      setNewDueDate(undefined);
    } else {
      setNewDueDate(date);
    }
  };

  const levelInfo = getUserLevelInfo();
  const pageTierClass = levelInfo ? `page-tier-group-${levelInfo.tierGroup}` : 'page-tier-group-1';

  return (
    <div className={cn("min-h-screen flex flex-col", pageTierClass)}>
       <Header 
        onAddRecordClick={() => {}} 
        onManageTasksClick={() => {}}
      />
      <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up">
        <Card className="shadow-lg w-full max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ListChecks className="h-6 w-6 text-primary" />
              <CardTitle>My To-Do List</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-2 mb-6">
              <Input
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="What needs to be done?"
                className="flex-grow"
                onKeyPress={(e) => e.key === 'Enter' && newItemText.trim() && handleAddItem()}
              />
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full sm:w-[150px] justify-start text-left font-normal",
                        !newDueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newDueDate ? format(newDueDate, "PPP") : <span>Pick date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newDueDate}
                      onSelect={handleDateSelect} // Use custom handler
                      initialFocus
                      disabled={(date) => date < startOfDay(new Date())} // Disable past dates
                    />
                  </PopoverContent>
                </Popover>
                <Button 
                  onClick={handleAddItem} 
                  className="w-full sm:w-auto"
                  disabled={newItemText.trim() === ''} // Disable if no text
                >
                  Add Task
                </Button>
              </div>
            </div>

            {todoItems.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No tasks yet. Add some!</p>
            ) : (
              <ScrollArea className="h-[400px] pr-3">
                <ul className="space-y-3">
                  {todoItems.map((item) => {
                    const isOverdue = item.dueDate && !item.completed && isPast(startOfDay(new Date(item.dueDate)));
                    return (
                      <li
                        key={item.id}
                        className="flex items-start gap-3 p-3 border rounded-md bg-card hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          id={`todo-${item.id}`}
                          checked={item.completed}
                          onCheckedChange={() => toggleTodoItem(item.id)}
                          aria-label={item.completed ? "Mark as incomplete" : "Mark as complete"}
                          className="mt-1" // Align checkbox with text
                        />
                        <div className="flex-grow">
                          <label
                            htmlFor={`todo-${item.id}`}
                            className={cn(
                              "cursor-pointer text-sm font-medium",
                              item.completed && "line-through text-muted-foreground"
                            )}
                          >
                            {item.text}
                          </label>
                          {item.dueDate && (
                            <div className={cn(
                                "text-xs flex items-center mt-1",
                                isOverdue ? "text-destructive" : "text-muted-foreground"
                              )}
                            >
                              <CalendarDays className="h-3.5 w-3.5 mr-1" />
                              Due: {format(new Date(item.dueDate), "MMM d, yyyy")}
                              {isOverdue && <span className="ml-1 font-semibold">(Overdue)</span>}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive flex-shrink-0"
                          onClick={() => deleteTodoItem(item.id)}
                          aria-label={`Delete task: ${item.text}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </main>
      <footer className="text-center py-4 text-sm text-muted-foreground border-t border-border">
        S.I.G.I.L. To-Do &copy; {currentYear}
      </footer>
    </div>
  );
}
