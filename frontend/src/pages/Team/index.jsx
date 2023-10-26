import { Fragment, useEffect, useState } from "react";
import { Box, Container, Grid, Group, Button, Center, Text, Loader, Card } from '@mantine/core';
import { useNavigate, useParams } from "react-router-dom";
import { IconCloudUp } from '@tabler/icons-react';
import { Header } from "../../components/Header/index.jsx";
import { Footer } from "../../components/Footer/index.jsx";
import { PageHeader } from "./components/PageHeader/index.jsx";
import { BasicDetails } from "./components/BasicDetails/index.jsx";
import { Status } from "./components/Status/index.jsx";
import { StaffDetails } from "./components/StaffDetails/index.jsx";
import { StudentList } from "./components/StudentList/index.jsx";
import { useAjax } from '../../hooks/useAjax';
import { useBasicDetailsStore, useStaffDetailsStore, useFormValidationStore, useStudentListStore } from './store/formFieldsStore'
import { useFormMetaStore, useFormStateStore } from "./store/formMetaStore"

export function Team() {
  let { id } = useParams();

  const setBasicDetailsState = useBasicDetailsStore((state) => state.setState)
  const setStaffDetailsState = useStaffDetailsStore((state) => state.setState)
  const setStudentListState = useStudentListStore((state) => state.setState)
  const setMetaState = useFormMetaStore((state) => state.setState)
  const setFormState = useFormStateStore((state) => state.setState)

  const formLoaded = useFormStateStore((state) => (state.setFormLoaded))
  const baselineHash = useFormStateStore((state) => (state.baselineHash))
  const clearHash = useFormStateStore((state) => (state.clearHash))
  const resetHash = useFormStateStore((state) => (state.resetHash))
  
  const validationRules = useFormValidationStore((state) => state.rules)
  const setFormErrors = useFormValidationStore((state) => state.setFormErrors)

  const [submitResponse, submitError, submitLoading, submitAjax, setSubmitData] = useAjax(); // destructure state and fetch function
  const [fetchResponse, fetchError, fetchLoading, fetchAjax, setFetchData] = useAjax(); // destructure state and fetch function
  const [reloadStudents, setReloadStudents] = useState(false);
  
  useEffect(() => {
    document.title = 'Manage Team'
    // Load existing team.
    if (id) {
      fetchAjax({
        query: {
          methodname: 'local_teamup-get_team',
          id: id,
        }
      })
    } else {
      setBasicDetailsState(-1)
      setStaffDetailsState(-1)
      setStudentListState(-1)
      setMetaState(-1)
      setFormState(-1)
      clearHash()
    }
  }, [id]);


  useEffect(() => {
    if (fetchResponse && !fetchError) {
      
      setBasicDetailsState({
        idnumber: fetchResponse.data.idnumber,
        teamname: fetchResponse.data.teamname,
        category: fetchResponse.data.category,
        categoryName: fetchResponse.data.categoryname,
        initDescription: fetchResponse.data.details,
        details: fetchResponse.data.details,
      })

      // Prep these for the multi selelctor
      const coaches = fetchResponse.data.coaches 
        ? JSON.parse(fetchResponse.data.coaches).map((item) => (JSON.stringify({ un: item.un, fn: item.fn, ln: item.ln })))
        : []
      const assistants = fetchResponse.data.assistants
        ? JSON.parse(fetchResponse.data.assistants).map((item) => (JSON.stringify({ un: item.un, fn: item.fn, ln: item.ln })))
        : []
      setStaffDetailsState({
        coaches: coaches,
        assistants: assistants,
      })

      setMetaState({
        id: fetchResponse.data.id,
        creator: fetchResponse.data.creator,
        status: fetchResponse.data.status,
        timecreated: fetchResponse.data.timecreated,
        timemodified: fetchResponse.data.timemodified,
      })

      formLoaded()
    }
  }, [fetchResponse]);

  const navigate = useNavigate()
  useEffect(() => {
    if (!submitError && submitResponse) {
      // If something other than an int was returned, something went wrong.
      if (!Object.hasOwn(submitResponse.data, 'id')) {
        resetHash() // Revert to old hash as changes were not saved
        setSubmitData({
          response: {exception: {message: "Something went wrong! Please reload and try again."}},
          error: true,
          loading: false,
        })
        return
      }

      // Successful save.
      if (!id) {
        navigate('/team/' + submitResponse.data.id, {replace: true})
      } else {
        setMetaState({
          status: submitResponse.data.status,
        })
        // Refetch student list.
        //setFormState({reload: true})
        console.log("Triggering student reload.")
        setReloadStudents(true);
      }
    }
    if (submitError) {
      resetHash() // Revert to old hash as changes were not saved
    }
  }, [submitResponse])


  const handleSubmit = (e) => {
    e.preventDefault();
    setReloadStudents(false)
    const basic = useBasicDetailsStore.getState()
    const staff = useStaffDetailsStore.getState()
    const students = useStudentListStore.getState()
    const meta = useFormMetaStore.getState()
    let formData = JSON.parse(JSON.stringify({...meta, ...basic, ...staff}))
    formData.studentlist = students.usernames
    formData.studentlistmove = students.move

    let hasErrors = false
    let errors = {}
    for (let field in validationRules) {
      for (let [index, rule] of validationRules[field].entries()) {
        // Exec the rule against the data.
        let error = rule(formData[field])
        if (error) {
          hasErrors = true
          let fieldErrors = []
          if (Object.hasOwn(errors, field)) {
            // There are existing errors for this field.
            fieldErrors = errors[field]
          }
          fieldErrors.push(error)
          errors = {...errors, ...{[field] : fieldErrors} }
        }
      }
    }
    setFormErrors(errors)
    if (hasErrors) {
      setSubmitData({
        response: {exception: {message: "Form has validation errors. Fix them and try again."}},
        error: true,
        loading: false,
      })
      return
    }

    // Decode the multiselect values into objects.
    formData.coaches = formData.coaches.map((val) => JSON.parse(val));
    formData.assistants = formData.assistants.map((val) => JSON.parse(val));

    // Set a new baseline for change detection, anticipating all will be saved.
    baselineHash()

    //return
    submitAjax({
      method: "POST", 
      body: {
        methodname: 'local_teamup-post_team',
        args: formData,
      }
    })
  }

  return (
    <Fragment>
      <Header />
      <div className="page-wrapper" style={{minHeight: 'calc(100vh - 154px)'}}>
        { id && !fetchResponse ? (
          <Center h={200} mx="auto"><Loader variant="dots" /></Center>
        ) : (
            id && fetchError
            ? <Container size="xl">
                <Center h={300}>
                  <Text fw={600} fz="lg">Failed to load team...</Text>
                </Center>
              </Container>
            : <>
                <Container size="xl">
                  <PageHeader />
                </Container>
                <Container size="xl" my="md">
                  <form noValidate onSubmit={handleSubmit}>
                    <Grid grow>
                      <Grid.Col xs={12} lg={9}>
                        <Box>
                          <Card withBorder radius="sm" pb="xs" mb="lg" sx={{ overflow: 'visible' }}>
                            <BasicDetails />
                            <StaffDetails />
                          </Card>
                          <StudentList reload={reloadStudents} />
                        </Box>
                      </Grid.Col>
                      <Grid.Col xs={12} lg={3}>
                        <Status submitLoading={submitLoading} submitError={submitError} submitResponse={submitResponse} />
                      </Grid.Col>
                    </Grid>
                  </form>
            </Container>
          </>
        )}
      </div>
      <Footer />
    </Fragment>
  )
}