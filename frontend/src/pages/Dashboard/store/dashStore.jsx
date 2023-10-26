
import { create } from 'zustand'

const dashInitialState = {
  role: null,
  child: null,
}
const useDashStore = create((set) => ({
  ...dashInitialState,
  setState: (newState) => set(newState == -1 ? dashInitialState : newState),
  reset: () => set(dashInitialState),
}))

export { 
  useDashStore, 
};