import { createRef, useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list';
import { ActionIcon, Badge, Box, Button, Card, Center, Flex, Grid, Group, Image, LoadingOverlay, Paper, Space, Stack, Text, UnstyledButton, createStyles } from '@mantine/core'
import { IconCalendarPlus, IconChevronLeft, IconChevronRight, IconEdit, IconPointFilled, IconSeparator } from '@tabler/icons-react'
import iconCoach from '../../../../assets/icon-coach.png';
import iconPlayer from '../../../../assets/icon-player.png';
import iconParent from '../../../../assets/icon-parent.png';
import iconSchedule from '../../../../assets/icon-schedule.png';
import { useAjax } from '../../../../hooks/useAjax'
import { getConfig, fetchData } from '../../../../utils'
import { EventModal } from 'src/components/EventModal'
import { CancelEventModal } from 'src/components/CancelEventModal';
import { useDisclosure } from '@mantine/hooks';
import { useDashStore } from "../../store/dashStore"
import { CreateScheduleModal } from '../CreateScheduleModal'

export function Calendar() {

  const setDashState = useDashStore((state) => state.setState)
  const dashStore = useDashStore()

  const calendarRef = createRef()
  const [title, setTitle] = useState('')
  const [events, setEvents] = useState([])
  const [eventsLoadedRange, setEventsLoadedRange] = useState({start: 0, end: 0})
  const [selectedRoleView, setSelectedRoleView] = useState(null) //teamstaff, teamstudent, parent, browse
  const [selectedCalendarView, setSelectedCalendarView] = useState('dayGridMonth') //dayGridMonth,timeGridWeek,timeGridDay,listWeek
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [fetchResponse, fetchError, fetchLoading, fetchAjax] = useAjax(); // destructure state and fetch function
  const [isCancelEventModalOpen, cancelEventModalHandlers] = useDisclosure(false);
  const [deleteOrCancel, setDeleteOrCancel] = useState(0);
  const [isCreateScheduleModalOpen, createScheduleModalHandlers] = useDisclosure(false);

  
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null) //username
  const [expandPreSelections, setExpandPreSelections] = useState(false)
  const generalstaff = getConfig().roles.includes('staff') || getConfig().roles.includes('manager')
  const teamstaff = getConfig().roles.includes('coach') || getConfig().roles.includes('assistant')
  const student = getConfig().roles.includes('student')
  const parent = getConfig().roles.includes('parent')
  const multipleRoles = (generalstaff + teamstaff + student + parent > 1)
  const showSelections = multipleRoles || ( selectedRoleView == 'parent' && children.length)

  // Fetch events on page load if user only has one role.
  useEffect(() => {
    let defaultRole = '';
    if (dashStore.role) {
      defaultRole = dashStore.role;
    } else {
      if (!multipleRoles) {
        defaultRole = (generalstaff && 'browse' || teamstaff && 'teamstaff' || student && 'teamstudent' || parent && 'parent')
      } else {
        defaultRole = teamstaff ? 'teamstaff' : student ? 'teamstudent' : parent ? 'parent' : generalstaff ? 'browse' : null
      }
    }
    setSelectedRoleView(defaultRole)
    if (defaultRole != 'parent') {
      fetchEvents(defaultRole, null, true)
    }
  }, [])

  // Check for user's children on component load.
  useEffect(() => {
    async function fetchChildren() {
      if (parent) {
        const response = await fetchData({
          query: {
            methodname: 'local_teamup-get_users_children'
          }
        })
        setChildren(response.data.map((child) => {
          return {
            value: child.un,
            title: child.fn + " " + child.ln,
            avatar: '/local/platform/avatar.php?username=' + child.un,
          };
        }))
        if (dashStore.child && response.data.filter(child => child.un == dashStore.child).length) {
          setSelectedChild(dashStore.child)
        } else {
          if (response.data.length == 1) {
            setSelectedChild(response.data[0].un)
          }
        }
      }
    }
    fetchChildren();
  }, [])

  // When defaulted to parent/child then fetch events for first time.
  useEffect(() => {
    if (selectedRoleView == 'parent' && selectedChild && !fetchResponse) {
      fetchEvents(selectedRoleView, selectedChild, true)
    }
  }, [selectedRoleView, selectedChild])

  // Fetch events when buttons are clicked: Role, Next, Prev, Today, Month, Week, Day, List, Teams
  const navCal = (type, value = '') => {
    const calendar = calendarRef.current.getApi()
    let resetRange = false
    let role = selectedRoleView
    let child = selectedChild

    if (type == "role" ) {
      resetRange = true
      role = value
    }

    if (type == "child" ) {
      resetRange = true
      child = value
    }

    if (type == "prev") {
      calendar.prev()
    }

    if (type == "next") {
      calendar.next()
    }
    
    if (type == "today") {
      calendar.today()
    }
    
    if (type == "month") {
      calendar.changeView('dayGridMonth');      
    }
    
    if (type == "week") {
      calendar.changeView('timeGridWeek');
    }
    
    if (type == "day") {
      calendar.changeView('timeGridDay');
    }

    if (type == "list") {
      calendar.changeView('listWeek');
    }
    
    setSelectedCalendarView(calendar.view.type)
    if (resetRange) {
      setEvents([])
    }
    fetchEvents(role, child, resetRange)
  }

  const handleRoleClick = (value) => {
    setSelectedRoleView(value)
    navCal("role", value)
    setDashState({role: value})
    if (value != 'parent') {
      setExpandPreSelections(false)
    }
  }

  const handleChildClick = (value) => {
    setSelectedChild(value)
    navCal("child", value)
    setDashState({child: value})
    setExpandPreSelections(false)
  }

  const handleEventClick = (e) => {
    setSelectedEvent({
      id: e.event.id,
      title: e.event.title,
      startReadable: e.event.extendedProps.startReadable,
      endReadable: e.event.extendedProps.endReadable,
      teams: e.event.extendedProps.teams,
      location: e.event.extendedProps.location,
      details: e.event.extendedProps.details,
      cancelled: e.event.extendedProps.cancelled
    })
  }
  const closeEventModal = () => {
    setSelectedEvent(null)
  }
  const handleCancel = () => {
    setDeleteOrCancel(1)
    cancelEventModalHandlers.open()
  }
  const handleDelete = () => {
    setDeleteOrCancel(2)
    cancelEventModalHandlers.open()
  }
  const submittedCancelEvent = () => {
    cancelEventModalHandlers.close()
    closeEventModal()
    fetchEvents(selectedRoleView, selectedChild, true)
  }
  const submittedSchedule = () => {
    createScheduleModalHandlers.close()
    fetchEvents(selectedRoleView, selectedChild, true)
  }
  
  const fetchEvents = (role, child, reset) => {
    if (!role) {
      return
    }
    const calendar = calendarRef.current.getApi()
    setTitle(calendar.view.title)
    const start = calendar.view.currentStart.valueOf()
    const end = calendar.view.currentEnd.valueOf()
    if (reset || start < eventsLoadedRange.start || end > eventsLoadedRange.end) {
      const newStart = reset || !eventsLoadedRange.start ? start : Math.min(start, eventsLoadedRange.start)
      const newEnd = reset ? end : Math.max(end, eventsLoadedRange.end)
      // We have not loaded events for these dates yet.
      setEventsLoadedRange({
        start: newStart, 
        end: newEnd,
      })
      fetchAjax({
        query: {
          methodname: 'local_teamup-get_events',
          start: start,
          end: end,
          role: role,
          child: child,
        }
      })
    }
  }

  useEffect(() => {
    if (fetchResponse && !fetchError) {
      // Merge new events.
      if (fetchResponse.data.length) {
        const ids = new Set(events.map(e => e.id));
        const merged = [...events, ...fetchResponse.data.filter(e => !ids.has(e.id))];
        setEvents(merged)
        window.dispatchEvent(new Event('resize'));
      }
    }
  }, [fetchResponse]);

  const renderEventContent = (info) => {
    return (
      <Flex gap={3} align="center">
        <Text fz="xs" fw={600} td={info.event.extendedProps.cancelled ? 'line-through' : ''}>{info.timeText}</Text>
        <Text fz="xs" td={info.event.extendedProps.cancelled ? 'line-through' : ''}>{info.event.title}</Text>
      </Flex>
    )
  }

  const RoleButton = ({value, icon, title1, title2}) => {
    const active = (selectedRoleView == value)
    const { classes } = useStyles({ active });
    return (
      <UnstyledButton onClick={() => handleRoleClick(value)}>
        <Flex className={classes.role} justify="center" align="center" direction="column" wrap="wrap">
          <Image hidden width={36} src={icon} mb={5} />
          <Text size="md" weight={500}><Center>{title1}</Center></Text>   
          <div className="page-pretitle">{title2}</div>   
        </Flex>
      </UnstyledButton>
    )
  }

  const ChildButton = ({value, avatar, title}) => {
    const active = (selectedChild == value)
    const { classes } = useStyles({ active });
    return (
      <UnstyledButton onClick={() => handleChildClick(value)}>
        <Flex className={classes.child} justify="center" align="center" direction="column" wrap="wrap">
          <Image radius="xl" width={36} src={avatar} mb={5} />
          <Text size="md" weight={500}><Center>{title}</Center></Text>   
        </Flex>
      </UnstyledButton>
    )
  }

  const preSelectionsCollapsed = () => {
    return (
      <Card.Section p={0} sx={{backgroundColor: '#f8f9fa'}}>
        <UnstyledButton mih="2.5rem" px="md" onClick={() => setExpandPreSelections(true)}  sx={{ width: '100%'}}>
          <Flex gap="sm" align="center">
            <Text fz="sm" fw={600}>Viewing as:</Text>
  
            <Text fz="sm" weight={500} tt="capitalize">
              { selectedRoleView == 'teamstaff' 
                ? <Group spacing={4}>Coach <IconPointFilled size={6} /> Assistant</Group>
                : selectedRoleView
              }
            </Text>

            { selectedRoleView == 'parent' && children.length > 1 && 
              <>
                <IconChevronRight size={18} />
                <Image radius="xl" width={30} src={children.find(child => child.value == selectedChild).avatar} />
                <Text fz="sm" weight={500}>{children.find(child => child.value == selectedChild).title}</Text> 
              </>
            }
            <IconEdit color="#3a85df" size={15} />
          </Flex>
        </UnstyledButton>
      </Card.Section>  
    )
  }

  const preSelectionsExpanded = () => (
    <>
      { multipleRoles &&
        <Card.Section p="md" sx={{backgroundColor: '#f8f9fa'}}>
          <Text fw={500} ta="center" mb="lg">Who are you viewing as?</Text>
          <Flex gap="sm" justify="center" wrap="wrap" >
            {teamstaff && <RoleButton value="teamstaff" icon={iconCoach} title1={<Group spacing={4}>Coach <IconPointFilled size={6} /> Assistant</Group>} title2="Teams you lead" /> }
            {student && <RoleButton value="teamstudent" icon={iconPlayer} title1="Student" title2="Teams you're a member of" /> }
            {parent && <RoleButton value="parent" icon={iconParent} title1="Parent" title2="Your children’s teams" /> }
            {generalstaff && <RoleButton value="browse" icon={iconSchedule} title1="Browse" title2="All activities" /> }
          </Flex>
        </Card.Section>
      }

      { selectedRoleView == 'parent' && children.length > 1 &&
        <Card.Section p="md" sx={{backgroundColor: '#f8f9fa'}}>
          <Text fw={500} ta="center" mb="lg">Select one of your children</Text>
          <Flex gap="sm" justify="center" wrap="wrap" >
            {children.map((child, i) => (
              <ChildButton key={i} value={child.value} avatar={child.avatar} title={child.title} />
            ))}
          </Flex>
        </Card.Section>
      }
      { selectedRoleView == 'parent' && !children.length &&
        <Card.Section p="md" sx={{backgroundColor: '#f8f9fa'}}>
          <Text fw={500} ta="center" mb="lg">Loading child information...</Text>
        </Card.Section>
      }
    </>
  )

  const useStyles = createStyles((theme, { active }) => ({
    role: {
      padding: theme.spacing.md,
      backgroundColor: active ? '#E1F2FF' : '#fff',
      borderRadius: theme.radius.md,
      color: theme.black,
      boxShadow: theme.shadows.sm,
      transition: 'box-shadow 150ms ease, transform 100ms ease',
      textAlign: 'center',
      width: '200px',
      '&:hover': {
        boxShadow: theme.shadows.md,
        transform: 'scale(1.05)',
      },
    },
    child: {
      padding: theme.spacing.md,
      backgroundColor: active ? '#E1F2FF' : '#fff',
      borderRadius: theme.radius.md,
      color: theme.black,
      boxShadow: theme.shadows.sm,
      transition: 'box-shadow 150ms ease, transform 100ms ease',
      textAlign: 'center',
      width: '200px',
      '&:hover': {
        boxShadow: theme.shadows.md,
        transform: 'scale(1.05)',
      },
    },
  }));

  return (
    <>
      <Card 
        withBorder 
        radius="sm" 
        mb="lg" 
        pb={0}
        sx={{ borderBottomRightRadius: 0, borderBottomLeftRadius:0, overflow: 'visible' }}
      >
        <Card.Section p="md" withBorder>
          <Group position="apart">
            <Text size="md" weight={500}>Schedule</Text>
            { getConfig().roles.includes('manager') &&
             <Button onClick={createScheduleModalHandlers.open} radius="lg" compact variant="light" leftIcon={<IconCalendarPlus size={12} />}>Add events</Button>
            }
          </Group>
        </Card.Section>
        
        { showSelections
          ? expandPreSelections || !selectedRoleView || (selectedRoleView == 'parent' && !selectedChild)
            ? preSelectionsExpanded()
            : preSelectionsCollapsed()
          : null
        }

        <Card.Section
          withBorder={showSelections}
          hidden={!selectedRoleView || (parent && !children.length)}
        >
          <Box pos="relative" mih={250}>
            <LoadingOverlay visible={fetchLoading} overlayBlur={2} />
            <Group p="xs" position="apart" sx={{borderBottom: '0.0625rem solid #dee2e6'}}>
              <Group>
                <Button.Group>
                  <Button onClick={() => navCal('prev')} variant="light" compact ><IconChevronLeft size={19} /></Button>
                  <Button onClick={() => navCal('next')} variant="light" compact ><IconChevronRight size={19} /></Button>
                </Button.Group>
                <Button onClick={() => navCal('today')} variant="light" compact >today</Button>
              </Group>

              <Text weight={600} size="1.15rem">{title}</Text>

              <Button.Group>
                <Button onClick={() => navCal('month')} variant={selectedCalendarView == 'dayGridMonth' ? 'filled' : 'light'} compact className={selectedCalendarView == 'dayGridMonth' ? 'bg-tablr-blue' : 'bg-tablr-blue-light'}>month</Button>
                <Button onClick={() => navCal('week')} variant={selectedCalendarView == 'timeGridWeek' ? 'filled' : 'light'} compact className={selectedCalendarView == 'timeGridWeek' ? 'bg-tablr-blue' : 'bg-tablr-blue-light'}>week</Button>
                <Button onClick={() => navCal('day')} variant={selectedCalendarView == 'timeGridDay' ? 'filled' : 'light'} compact className={selectedCalendarView == 'timeGridDay' ? 'bg-tablr-blue' : 'bg-tablr-blue-light'}>day</Button>
                <Button onClick={() => navCal('list')} variant={selectedCalendarView == 'listWeek' ? 'filled' : 'light'} compact className={selectedCalendarView == 'listWeek' ? 'bg-tablr-blue' : 'bg-tablr-blue-light'}>list</Button>
              </Button.Group>
            </Group>
            <FullCalendar
              ref={calendarRef}
              timeZone='UTC'
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
              headerToolbar={null}
              initialView='dayGridMonth'
              nowIndicator={true}
              dayMaxEventRows={true}
              dayMaxEvents={true}
              eventContent={renderEventContent}
              eventClick={handleEventClick}
              eventMaxStack={selectedCalendarView == 'timeGridWeek' ? 2 : 5}
              events={events}
            />
          </Box>
        </Card.Section>
      </Card>
      <EventModal opened={!!selectedEvent} eventData={selectedEvent} showOptions={true} viewRole={selectedRoleView} close={closeEventModal} onCancel={handleCancel} onDelete={handleDelete} isCancelModalOpen={isCancelEventModalOpen} />
      <CancelEventModal deleteOrCancel={deleteOrCancel} opened={isCancelEventModalOpen} eventid={selectedEvent ? selectedEvent.id : 0} close={cancelEventModalHandlers.close} submitted={submittedCancelEvent}/>
      {getConfig().roles.includes('manager') && <CreateScheduleModal opened={isCreateScheduleModalOpen} close={createScheduleModalHandlers.close} submitted={submittedSchedule} /> }
    </>
  )




}

