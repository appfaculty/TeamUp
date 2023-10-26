
import { create } from 'zustand'
import { exportTeamHash } from "../../../exporters/teamHash.jsx";

const formMetaInitialState = {
  id: 0,
  idnumber: '',
  creator: '',
  status: 0, // 0: Unsaved, 1: Saved draft, 2: Live
  timecreated: 0,
  timemodified: 0,
}
const useFormMetaStore = create((set) => ({
  ...formMetaInitialState,
  setState: (newState) => set(newState == -1 ? formMetaInitialState : newState),
  reset: () => set(formMetaInitialState)
}))

const formStateInitialState = {
  oldhash: '',
  hash: '',
  formloaded: false,
  studentsloaded: false,
  haschanges: false,
  reloadstulist: false,

}
const useFormStateStore = create((set) => ({
  ...formStateInitialState,
  setState: (newState) => set(newState == -1 ? formStateInitialState : newState),
  reset: () => set(formStateInitialState),
  reloadStudents: () => set({reloadstulist: true}),
  baselineHash: () => {
    const hash = exportTeamHash()
    set({
      oldhash: hash, 
      hash: hash
    })
  },
  clearHash: () => {
    set({
      oldhash: '', 
      hash: '',
      haschanges: false,
    })
  },
  updateHash: () => {
    const hash = exportTeamHash()
    set((state) => ({ 
      hash: hash, 
      haschanges: (hash !== state.oldhash) 
    }))
  },
  resetHash: () => set((state) => ({
    hash: state.oldhash,
    haschanges: false,
  })),
  setFormLoaded: () => set({formloaded: true}),
  setStudentsLoaded: () => set({studentsloaded: true}),
}))



export { useFormMetaStore, useFormStateStore };