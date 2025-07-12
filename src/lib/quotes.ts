
export interface Quote {
  text: string;
  author: string;
  category: string;
}

export const QUOTES: Quote[] = [
  // Motivation & Inspiration
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
    category: "Motivation",
  },
  {
    text: "The best way to predict the future is to create it.",
    author: "Peter Drucker",
    category: "Motivation",
  },
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
    category: "Inspiration",
  },
  {
    text: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt",
    category: "Inspiration",
  },
   {
    text: "It does not do to dwell on dreams and forget to live.",
    author: "J.K. Rowling, Harry Potter and the Sorcerer's Stone",
    category: "Inspiration",
  },
  {
    text: "Our lives are defined by opportunities, even the ones we miss.",
    author: "F. Scott Fitzgerald",
    category: "Inspiration"
  },
  {
    text: "The man who has a why to live can bear almost any how.",
    author: "Friedrich Nietzsche",
    category: "Motivation"
  },
  {
    text: "What you get by achieving your goals is not as important as what you become by achieving your goals.",
    author: "Zig Ziglar",
    category: "Motivation",
  },
  {
    text: "The journey of a thousand miles begins with a single step.",
    author: "Lao Tzu",
    category: "Inspiration",
  },
  {
    text: "The only limit to our realization of tomorrow will be our doubts of today.",
    author: "Franklin D. Roosevelt",
    category: "Motivation",
  },
  {
    text: "Do not wait to strike till the iron is hot; but make it hot by striking.",
    author: "William Butler Yeats",
    category: "Motivation",
  },
  {
    text: "The secret of getting ahead is getting started.",
    author: "Mark Twain",
    category: "Motivation",
  },
  {
    text: "Your time is limited, don't waste it living someone else's life.",
    author: "Steve Jobs",
    category: "Motivation",
  },
  {
    text: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt",
    category: "Inspiration",
  },
  {
    text: "Hardships often prepare ordinary people for an extraordinary destiny.",
    author: "C.S. Lewis",
    category: "Inspiration",
  },

  // Fighting & Stoicism
  {
    text: "The impediment to action advances action. What stands in the way becomes the way.",
    author: "Marcus Aurelius",
    category: "Fighting",
  },
  {
    text: "We suffer more often in imagination than in reality.",
    author: "Seneca",
    category: "Fighting",
  },
  {
    text: "It's not what happens to you, but how you react to it that matters.",
    author: "Epictetus",
    category: "Fighting",
  },
  {
    text: "He who is brave is free.",
    author: "Seneca",
    category: "Fighting"
  },
  {
    text: "Float like a butterfly, sting like a bee.",
    author: "Muhammad Ali",
    category: "Fighting"
  },
  {
    text: "The best revenge is not to be like your enemy.",
    author: "Marcus Aurelius",
    category: "Fighting",
  },
  {
    text: "He who lives in harmony with himself lives in harmony with the universe.",
    author: "Marcus Aurelius",
    category: "Fighting",
  },
  {
    text: "I am the master of my fate, I am the captain of my soul.",
    author: "William Ernest Henley",
    category: "Fighting",
  },
  {
    text: "You have power over your mind - not outside events. Realize this, and you will find strength.",
    author: "Marcus Aurelius",
    category: "Fighting",
  },


  // Banned Books & Freedom of Thought
  {
    text: "If you have a book you want to read but it hasn't been written yet, then you must write it.",
    author: "Toni Morrison",
    category: "Banned Books",
  },
  {
    text: "There is more than one way to burn a book. And the world is full of people running about with lit matches.",
    author: "Ray Bradbury, Fahrenheit 451",
    category: "Banned Books",
  },
  {
    text: "The books that the world calls immoral are books that show the world its own shame.",
    author: "Oscar Wilde, The Picture of Dorian Gray",
    category: "Banned Books",
  },
  {
    text: "It's the possibility of having a dream come true that makes life interesting.",
    author: "Paulo Coelho, The Alchemist",
    category: "Banned Books"
  },
  {
    text: "All animals are equal, but some animals are more equal than others.",
    author: "George Orwell, Animal Farm",
    category: "Banned Books"
  },
  {
    text: "War is peace. Freedom is slavery. Ignorance is strength.",
    author: "George Orwell, 1984",
    category: "Banned Books",
  },
  {
    text: "So it goes.",
    author: "Kurt Vonnegut, Slaughterhouse-Five",
    category: "Banned Books",
  },
  {
    text: "Don't ever tell anybody anything. If you do, you start missing everybody.",
    author: "J.D. Salinger, The Catcher in the Rye",
    category: "Banned Books",
  },
  {
    text: "Nolite te bastardes carborundorum. Don't let the bastards grind you down.",
    author: "Margaret Atwood, The Handmaid's Tale",
    category: "Banned Books",
  },
  {
    text: "Words are, in my not-so-humble opinion, our most inexhaustible source of magic.",
    author: "J.K. Rowling, Harry Potter and the Deathly Hallows",
    category: "Banned Books",
  },
  {
    text: "I am not afraid of storms, for I am learning how to sail my ship.",
    author: "Louisa May Alcott, Little Women",
    category: "Banned Books",
  },
  {
    text: "There is some good in this world, and it's worth fighting for.",
    author: "J.R.R. Tolkien, The Two Towers",
    category: "Banned Books",
  },
  {
    text: "And so we beat on, boats against the current, borne back ceaselessly into the past.",
    author: "F. Scott Fitzgerald, The Great Gatsby",
    category: "Banned Books",
  },
  {
    text: "‘You’re mad, bonkers, completely off your head. But I’ll tell you a secret: all the best people are.’",
    author: "Lewis Carroll, Alice in Wonderland",
    category: "Banned Books",
  },
  {
    text: "The first rule of Fight Club is: you do not talk about Fight Club.",
    author: "Chuck Palahniuk, Fight Club",
    category: "Banned Books",
  },
  {
    text: "It was a pleasure to burn.",
    author: "Ray Bradbury, Fahrenheit 451",
    category: "Banned Books",
  },
  {
    text: "I wanted you to see what real courage is... It's when you know you're licked before you begin but you begin anyway.",
    author: "Harper Lee, To Kill a Mockingbird",
    category: "Banned Books",
  },
  {
    text: "And now that you don't have to be perfect, you can be good.",
    author: "John Steinbeck, East of Eden",
    category: "Banned Books",
  },
  {
    text: "There is no greater agony than bearing an untold story inside you.",
    author: "Maya Angelou, I Know Why the Caged Bird Sings",
    category: "Banned Books",
  },
  {
    text: "I took a deep breath and listened to the old brag of my heart. I am, I am, I am.",
    author: "Sylvia Plath, The Bell Jar",
    category: "Banned Books",
  },
];
