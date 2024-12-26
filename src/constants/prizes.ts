import { Prize } from '../types';

export const DEFAULT_PRIZES: Prize[] = [
  {
    id: 'prize-1',
    name: 'Cash Reward',
    description: 'Get $1 for each star',
    cost: 1,
    imageUrl: 'https://images.unsplash.com/photo-1561414927-6d86591d0c4f?w=200'
  },
  {
    id: 'prize-2',
    name: 'Electronics Time',
    description: 'One hour of electronics usage',
    cost: 2,
    imageUrl: 'https://images.unsplash.com/photo-1580327344181-c1163234e5a0?w=200'
  },
  {
    id: 'prize-3',
    name: 'Junk Food Meal',
    description: 'Your choice of junk food meal',
    cost: 4,
    imageUrl: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=200'
  },
  {
    id: 'prize-4',
    name: 'Dave & Busters Trip',
    description: 'A fun trip to Dave & Busters',
    cost: 20,
    imageUrl: 'https://images.unsplash.com/photo-1511882150382-421056c89033?w=200'
  }
];