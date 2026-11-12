import {createContext} from 'react';
export const ProposalReadOnly=createContext(false);
export const ProposalFieldErrors=createContext<Record<string,string>>({});
