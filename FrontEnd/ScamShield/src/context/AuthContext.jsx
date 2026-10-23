import { createContext, useContext } from 'react';

export const AuthContext = createContext({ user: null, setUser: () => {}, logout: () => {}, setPendingEmail: () => {}, pendingEmail: '' });
export const useAuth = () => useContext(AuthContext);
