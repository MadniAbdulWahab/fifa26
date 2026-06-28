import { createContext, useContext } from 'react';

export const NowContext = createContext(Date.now());

export function useNow(): number {
  return useContext(NowContext);
}
