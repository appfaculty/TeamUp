
import hash from "object-hash";
import { useBasicDetailsStore, useStaffDetailsStore, useStudentListStore } from "../pages/Team/store/formFieldsStore"

const exportTeamHash = () => {
  const basic = useBasicDetailsStore.getState()
  const staff = useStaffDetailsStore.getState()
  const students = useStudentListStore.getState()
  const formData = JSON.parse(JSON.stringify({...basic, ...staff, ...students}));
  return hash(formData)
};
export {exportTeamHash}