import { Fragment, useEffect, useState } from "react";
import { Center, Container, Grid, Loader, Text, Card, Group, Box, LoadingOverlay, Stack, Flex, Button, UnstyledButton, Avatar, Chip, Switch, Mark, Accordion, Collapse, Menu, AspectRatio, Paper, Badge, Transition } from '@mantine/core';
import { Header } from "../../components/Header/index.jsx";
import { Footer } from "../../components/Footer/index.jsx";
import { Link, useParams } from "react-router-dom";
import { useAjax } from "../../hooks/useAjax.js";
import { useDisclosure, useTimeout } from '@mantine/hooks';
import { IconCheck, IconChecks, IconChevronDown, IconCircleOff, IconDots, IconMail, IconScan, IconSettings, IconSquareRoundedCheck, IconSquareRoundedX, IconTrash, IconUser, IconX } from "@tabler/icons-react";
import { QrScanner } from '@yudiel/react-qr-scanner';
import { EventModal } from 'src/components/EventModal'
import { CancelEventModal } from 'src/components/CancelEventModal';
import { PageHeader } from "./components/PageHeader/index.jsx";
import { IconChecklist } from "@tabler/icons-react";


export function Attendance() {
  
  let { eventid } = useParams();

  const [fetchResponse, fetchError, fetchLoading, fetchAjax] = useAjax();
  const [event, setEvent] = useState({});
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(0);

  const [students, setStudents] = new useState([])
  const [rollResponse, rollError, rollLoading, rollAjax] = useAjax();
  const [roll, setRoll] = useState({});
  const [loading, setLoading] = useState({});
  const [mode, setMode] = useState('present');
  const [geoLocation, setGeoLocation] = useState('');
  const [submitResponse, submitError, submitLoading, submitAjax] = useAjax();

  const [eventMOpened, eventMToggle] = useDisclosure(false);
  const [cEventMOpened, cEventMToggle] = useDisclosure(false);
  
  const [qrOpened, qrToggle] = useDisclosure(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrUser, setQrUser] = useState('');
  const [qrResult, setQrResult] = useState(0);
  const [showQrResult, setShowQrResult] = useState(false);
  const {start, clear} = useTimeout(() => setShowQrResult(false), 1000);

  /* GET TEAMS */
  useEffect(() => {
    document.title = 'Attendance';
    fetchAjax({
      query: {
        methodname: 'local_teamup-get_event_info',
        id: eventid,
      }
    })
    /*async function stopAllStreams() {
      const stream = await navigator.mediaDevices.getUserMedia({video:true});
      stream.getTracks().forEach(function(track) {
        track.stop();
      });
    }
    stopAllStreams()*/
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setGeoLocation(position.coords.latitude+","+position.coords.longitude)
      });
    }
  }, []);

  useEffect(() => { 
    if (fetchResponse && !fetchError) {
      const fullEvent = {...fetchResponse.data.event, teams: fetchResponse.data.teams}
      setEvent(fullEvent)
      if (fetchResponse.data.teams) {
        setTeams(fetchResponse.data.teams)
        setSelectedTeam(fetchResponse.data.teams[0].teamid)
      }
    }
  }, [fetchResponse]);



  /* GET ROLL */
  useEffect(() => {
    if (eventid && selectedTeam) {
      rollAjax({
        query: {
          methodname: 'local_teamup-get_attendance_students',
          eventid: eventid,
          teamid: selectedTeam,
        }
      })
    }
  }, [eventid, selectedTeam])
  useEffect(() => { 
    if (rollResponse && !rollError) {
      setStudents(rollResponse.data.students)
      setRoll(rollResponse.data.roll)
    }
  }, [rollResponse]);





  const onMark = (un) => {
    const current = roll[un] ? roll[un] : 0;
    const value = (mode == 'absent') ? ((current + 3 - 1) % 3) : ((current + 1) % 3)
    setLoading((current) => ({...current, [un]: true}))
    submitAjax({
      method: "POST", 
      body: {
        methodname: 'local_teamup-submit_attendance',
        args: {
          eventid: eventid,
          username: un,
          value: value,
          geolocation: geoLocation,
          method: 'single',
        },
      }
    });
  }
  useEffect(() => {
    if (submitResponse && !submitError) {
      if (submitResponse.data.operation == 'single') {
        setRoll((current) => ({...current, [submitResponse.data.username]: submitResponse.data.value}))
        setLoading((current) => ({...current, [submitResponse.data.username]: false}))
      }
    }
  }, [submitResponse]);




  const markAll = () => {
    const value = (mode == 'absent') ? 2 : 1;
    const loading = students.reduce((obj, item) => Object.assign(obj, { [item.un]: true }), {});
    setLoading({...loading})
    submitAjax({
      method: "POST", 
      body: {
        methodname: 'local_teamup-submit_attendance_multi',
        args: {
          eventid: eventid,
          usernames: students.map(s => s.un),
          value: value,
          geolocation: geoLocation,
          method: 'multi',
        },
      }
    });
  }
  useEffect(() => {
    if (submitResponse && !submitError) {
      if (submitResponse.data.operation == 'multi') {
        const marked = submitResponse.data.usernames.reduce((obj, un) => Object.assign(obj, { [un]: submitResponse.data.value }), {});
        setRoll((current) => ({...current, ...marked}))
        const loading = students.reduce((obj, s) => Object.assign(obj, { [s.un]: false }), {});
        setLoading((current) =>({...current, ...loading}))
      }
    }
  }, [submitResponse]);



  const markRemaining = () => {
    const value = (mode == 'absent') ? 2 : 1;
    const current = Object.keys(roll).filter(function(un) { 
      return roll[un] != 0; 
    });
    const remaining = students.map(s => s.un).filter(un => !current.includes(un));
    const loading = remaining.reduce((obj, un) => Object.assign(obj, { [un]: true }), {});
    setLoading({...loading})
    submitAjax({
      method: "POST", 
      body: {
        methodname: 'local_teamup-submit_attendance_multi',
        args: {
          eventid: eventid,
          usernames: remaining,
          value: value,
          geolocation: geoLocation,
          method: 'multi',
        },
      }
    });
  }


  const sendQRAttendance = (code) => {
    if (qrLoading) {
      return;
    }
    const data = code.split(',');
    if (data.length != 2) {
      return
    }
    // Is user in the list of students??
    //if (! students.map(s => s.un).includes(data[0]) ) { // User not in roll. }
    setQrLoading(true)
    clear()
    setQrUser({username: data[0], fullname: data[1], avatar: '/local/platform/avatar.php?username='+data[0]})
    setLoading((current) => ({...current, [data[0]]: true}))
    submitAjax({
      method: "POST", 
      body: {
        methodname: 'local_teamup-submit_attendance',
        args: {
          eventid: eventid,
          username: data[0],
          value: 1,
          geolocation: geoLocation,
          method: 'qr',
        },
      }
    });
  }
  useEffect(() => {
    if (submitResponse && !submitError) {
      if (submitResponse.data.operation == 'qr') {
        setRoll((current) => ({...current, [submitResponse.data.username]: submitResponse.data.value}))
        setLoading((current) => ({...current, [submitResponse.data.username]: false}))
        setQrLoading(false)
        setQrResult(1)
        setShowQrResult(true)
        start()
      }
    }
  }, [submitResponse]);

  // Generic handling of submit roll error.
  useEffect(() => {
    if (submitError) {
      console.log("There was an error submitting. " + submitResponse.exception !== undefined ? submitResponse.exception.message : '')
      setQrLoading(false)
      setQrResult(0)
      setShowQrResult(true)
      start()
    }
  }, [submitError]);


  const qrResultTransition = (result) => {
    return (
        <Transition mounted={showQrResult} transition="fade" duration={500} timingFunction="ease">
          {(styles) => 
            <Center bg={result == 1 ? "rgba(99, 205, 119, 0.2)" : "rgba(231, 134, 134, 0.2)"} pos="absolute" sx={{top: 0, width: "100%", height: "500px"}} style={{ ...styles }}>
              <Paper bg="transparent" shadow="sm" p={0} radius="xs" sx={{overflow: 'hidden'}}>
                { result == 1
                  ? <IconCheck size={60} color="green"/>
                  : <IconX size={60} color="red"/>
                }
              </Paper>
            </Center>
          }
        </Transition>
    )
  }

  const rollButton = (student, i) => {
    //const marked = (Object.keys(roll).includes(student.un))
    const status = roll[student.un] !== undefined ? roll[student.un] : 0;
    const submitting = loading[student.un] !== undefined ? loading[student.un] : 0;
    const lastChild = i == students.length -1
    //console.log("rerendering " + student.un + ", marked " + marked + ", status " + status)
    return (
      <UnstyledButton key={i} onClick={() => onMark(student.un)} pos="relative">
        <LoadingOverlay visible={submitting} 
          loaderProps={{ size: 'sm', variant: 'dots' }}
          overlayOpacity={0.2}
          overlayColor="#000"
        />
        <Group px="md" py="sm" spacing="xs" align="center"
          sx={{
            borderBottom: lastChild ? null : "0.0625rem solid #dee2e6",
            // Green and Red
            backgroundColor: status == 1 ? '#D3F9D8' : status == 2 ? '#f8d7da' : null,
            transition: 'background 150ms ease',
          }}
        >
          <Avatar alt={student.fn + " " + student.ln} size="md" src={'/local/platform/avatar.php?username=' + student.un} radius="xl"><IconUser size={14} /></Avatar>
          <Text>{student.ln + ", " + student.fn}</Text>
        </Group>
      </UnstyledButton>
    )
  }

  const modeBtn = (
    <Group position="center">
      <Switch
        checked={mode == 'present'}
        onChange={(event) => setMode(event.currentTarget.checked ? 'present' : 'absent')}
        color="teal"
        size="md"
        //label={mode == 'present' ? 'Mark present' : 'Mark absent'}
        onLabel={<IconCheck size="1rem" stroke={2.5} color="white" />}
        offLabel={<IconX size="1rem" stroke={2.5} color="white" />}
        styles={{
          'track': {
            borderColor: "#fa5252",
            backgroundColor: "#fa5252",
          }
        }}
      />
    </Group>
  )

  const qrScanner = (
    <>
      <Box>
        <Collapse in={qrOpened}>
        
          <Box p="sm" bg='#000' pos="relative" h={500}>
            <Box className="qr-scanner" h="100%" maw={500} mx="auto" pos="relative" sx={{borderRadius: '5px', overflow: 'hidden'}}>
              <QrScanner
                onDecode={(result) => sendQRAttendance(result)}
                onError={(error) => console.log(error?.message)}
                viewFinderBorder={0}
                containerStyle={{
                  width: '100%',
                  overflow: 'hidden',
                  position: 'relative',
                  padding: '0',
                  height: '500px',
                }}
                videoStyle={{
                  width: 'auto',
                }}
              />

              { qrLoading
                ? <Center bg="rgba(0,0,0,0.8)" pos="absolute" sx={{top: 0, width: "100%", height: "500px"}}>
                    <Paper shadow="sm" p={0} pr="sm" radius="xs" sx={{overflow: 'hidden'}}>
                      <Center>
                        <Group>
                          <Avatar alt="test test" size="lg" src={qrUser.avatar} radius={0} ></Avatar>
                          <Text fz="lg" fw={600}>{qrUser.fullname}</Text>
                          <Loader size="sm" sx={{display: 'block !important'}}/>
                        </Group>
                      </Center>
                    </Paper>
                  </Center>
                : qrResultTransition(qrResult)
              }

              
                 
         
              
              
            </Box>
          </Box>
        </Collapse>
      </Box>
    </>
  )

  const rollPanel = (
    <>
      <Card withBorder radius="sm" mb="lg" sx={{overflow: 'hidden'}}>

        <Card.Section inheritPadding withBorder py="sm">
          <Group position="apart" align="center">
            <Text size="lg" weight={500}>Roll marking</Text>
          </Group>
        </Card.Section>


        
          <Card.Section inheritPadding withBorder py="sm">
            <Group position="apart">
              
                <Chip.Group value={selectedTeam} onChange={setSelectedTeam}>
                  <Group position="center">
                    { teams.length > 1 ? teams.map((team, i) => (
                      team.cancelled == 0 && <Chip key={i} value={team.teamid} variant="light">{team.teamname}</Chip>
                    )) : teams.length == 1 ? <Badge color="dark" size="lg" tt="none" fw={400} value={teams[0].teamid} variant="light">{teams[0].teamname}</Badge> : null}
                  </Group>
                </Chip.Group>
                
                <Button onClick={qrToggle.toggle} compact radius="xl" leftIcon={qrOpened ? <IconX size={18} /> : <IconScan size={18} />}>QR scanner</Button>
           
            </Group>
          </Card.Section>
        

        <Card.Section>
          { qrOpened
            ? qrScanner
            : null
          }
        </Card.Section>

        <Card.Section>
          <Box pos="relative" mih="3.25rem">
            <LoadingOverlay visible={fetchLoading || rollLoading} />
            <Stack spacing={0}>
              {students.map((student, i) => rollButton(student, i))}
            </Stack>
          </Box>
        </Card.Section>

        <Card.Section inheritPadding withBorder py="md">
          <Group position="apart">
            <Flex gap="sm">
              {modeBtn}
              <Button color={(mode == 'absent') ? 'red' : 'teal'} onClick={markRemaining} variant="filled" compact radius="xl" leftIcon={<IconChecklist size={14} />}>Remaining {mode}</Button>
              <Button color={(mode == 'absent') ? 'red' : 'teal'} onClick={markAll} variant="filled" compact radius="xl" leftIcon={<IconChecks size={14} />}>All {mode}</Button>
            </Flex>
            <Link to={"/team/" + selectedTeam}><Button variant='light' compact radius="xl" leftIcon={<IconMail size={14} />} >Open team</Button></Link>
          </Group>
        </Card.Section>
      </Card>
    </>
  )

  

  return (
    <Fragment>
      <Header />
      <div className="page-wrapper">
        <Container size="xl">
          <PageHeader title={event.title} cEventMToggle={cEventMToggle} eventMToggle={eventMToggle}/>
        </Container>
        { !fetchResponse ? (
            <Center h={200} mx="auto"><Loader variant="dots" /></Center>
          ) : (
            <Container size="xl" mb="xl">
              {rollPanel}
              { Object.keys(event).length !== 0
                ? <>
                    <EventModal opened={eventMOpened} eventData={event} showOptions={false} close={eventMToggle.close} />
                    <CancelEventModal deleteOrCancel={1} opened={cEventMOpened} eventid={event.id} close={cEventMToggle.close} submitted={cEventMToggle.close}/>
                  </>
                : ''
              }
            </Container>
          )
        }
      </div>
      <Footer />
    </Fragment>
  );
};