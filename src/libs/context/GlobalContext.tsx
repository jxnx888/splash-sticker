'use client';

import { createContext, ReactNode, Dispatch, SetStateAction, useContext } from 'react';

export type GlobalContextProps = {
  currentDecal: string;
  setCurrentDecal: Dispatch<SetStateAction<string>>;
}

const GlobalContext = createContext<GlobalContextProps>({
  currentDecal: 'textures/decal/1.png',
  setCurrentDecal: ()=>{}
});

type GlobalContextProviderProps = {
  children: ReactNode;
  value: GlobalContextProps;
}
export const  GlobalProvider =({children, value}:GlobalContextProviderProps)  =>{
  return <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
};

export const useGlobalContext = () => {
  return useContext(GlobalContext);
}
