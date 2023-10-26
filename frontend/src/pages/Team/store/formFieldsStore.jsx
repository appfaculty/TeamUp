
import { create } from 'zustand'

const basicDetailsInitialState = {
  teamname: '',
  category: '',
  categoryName: '',
  details: '',
  initDescription: '',
}
const useBasicDetailsStore = create((set) => ({
  ...basicDetailsInitialState,
  setState: (newState) => set(newState == -1 ? basicDetailsInitialState : newState),
  reset: () => set(basicDetailsInitialState),
}))

const staffDetailsInitialState = {
  coaches: [],
  assistants: [],
}
const useStaffDetailsStore = create((set) => ({
  ...staffDetailsInitialState,
  setState: (newState) => set(newState == -1 ? staffDetailsInitialState : newState),
  reset: () => set(staffDetailsInitialState),
}))

const studentListInitialState = {
  data: [],
  usernames: [],
  move: [],
  //reload: false,
}
const useStudentListStore = create((set) => ({
  ...studentListInitialState,
  setState: (newState) => set(newState == -1 ? studentListInitialState : newState),
  reset: () => set(studentListInitialState),
}))

const useFormValidationStore = create((set) => ({
  formErrors: {},
  rules: {
    teamname: [
      (value) => (value.length ? null : 'Team name is required. '),
    ],
  },
  setFormErrors: (errors) => set({ formErrors: errors }),
  reset: () => set({formErrors: {}}),
}))

export { 
  useBasicDetailsStore, 
  useStaffDetailsStore, 
  useStudentListStore, 
  useFormValidationStore
};