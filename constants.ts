
import { Journal } from './types';

export const INITIAL_POSTS: Journal[] = [
  {
    id: '1',
    userId: 'sarah-uid',
    authorName: 'Sarah',
    authorHandle: '@SarahWrites',
    title: 'Morning Reflections',
    excerpt: "Today the sun felt different. I realized that letting go isn't about giving up, but accepting that some things cannot be.",
    content: "Today the sun felt different. I realized that letting go isn't about giving up, but accepting that some things cannot be. The weight on my chest is finally starting to lift. I spent twenty minutes just watching the dust motes dance in a shaft of light. It's funny how the smallest things become the most significant when you finally stop running.",
    mood: 'Hopeful',
    tags: ['growth', 'reflection'],
    createdAt: '2 hours ago',
    updatedAt: '2 hours ago',
    visibility: 'public',
    imageUrl: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: '2',
    userId: 'midnight-uid',
    authorName: 'Midnight',
    authorHandle: '@MidnightThoughts',
    title: 'Rainy Sunday',
    excerpt: "Made coffee. Sat by the window. The rain makes everything quiet. I haven't felt this kind of peace in weeks.",
    content: "Made coffee. Sat by the window. The rain makes everything quiet. I haven't felt this kind of peace in weeks. Sometimes doing nothing is the most productive thing. The steam from my mug fogged up the glass, and for a moment, the world outside was just a blur of grey and green. It was perfect.",
    mood: 'Calm',
    tags: ['peace', 'nature'],
    createdAt: '5 hours ago',
    updatedAt: '5 hours ago',
    visibility: 'public',
    imageUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: '3',
    userId: 'alex-uid',
    authorName: 'Alex',
    authorHandle: '@CityDreamer',
    title: '2AM Epiphany',
    excerpt: "The lights of the city blur into lines as the taxi speeds up. I wonder if everyone else feels this rush of possibility at 2AM.",
    content: "The lights of the city blur into lines as the taxi speeds up. I wonder if everyone else feels this rush of possibility at 2AM. I'm finally moving to New York next week. Everything I own is in four boxes and a suitcase. It's terrifying, and yet, I've never felt more alive.",
    mood: 'Excited',
    tags: ['adventure', 'city'],
    createdAt: 'Yesterday',
    updatedAt: 'Yesterday',
    visibility: 'public',
    imageUrl: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: '4',
    userId: 'observer-uid',
    authorName: 'Observer',
    authorHandle: '@QuietObserver',
    title: 'Waiting for Spark',
    excerpt: "Does anyone else feel like they are constantly waiting for something to happen? I'm trying to be present.",
    content: "Does anyone else feel like they are constantly waiting for something to happen? I'm trying to be present, but my mind is always racing three steps ahead. I look at people in the park and wonder if they've found the 'secret' to just being. Today, I'm going to try and just listen to the wind.",
    mood: 'Anxious',
    tags: ['mindfulness', 'introspection'],
    createdAt: '2 days ago',
    updatedAt: '2 days ago',
    visibility: 'public'
  }
];