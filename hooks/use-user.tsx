'use client';

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  use,
} from 'react';
import { User } from '@/lib/db/schema';

type UserContextType = {
    user: User.User.Select | null;
};

const UserContext = createContext<UserContextType | null>(null);

export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (context === null) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

export function UserProvider({
  children,
  userPromise,
}: {
  children: ReactNode;
  userPromise: Promise<User.User.Select | null>;
}) {
  let initialUser = use(userPromise)
  const [user, setUser] = useState<User.User.Select | null>(initialUser)

  useEffect(() => {
    setUser(initialUser)
  }, [initialUser])

  return (
    <UserContext.Provider value={{ user }}>
      {children}
    </UserContext.Provider>
  );
}
