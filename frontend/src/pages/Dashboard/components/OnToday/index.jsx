import { Avatar, Box, Card, Flex, Group, LoadingOverlay, Table, Text, UnstyledButton } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useAjax } from '../../../../hooks/useAjax';
import { useDisclosure } from '@mantine/hooks';
import { EventModal } from '../../../../components/EventModal';
import { CancelEventModal } from '../../../../components/CancelEventModal';


export function OnToday() {

  const [fetchResponse, fetchError, fetchLoading, fetchAjax] = useAjax(); // destructure state and fetch function
  const [events, setEvents] = useState([])
  const [eventMOpened, eventMToggle] = useDisclosure(false);
  const [cancelMOpened, cancelMToggle] = useDisclosure(false);
  const [event, setEvent] = useState({});
  const [deleteOrCancel, setDeleteOrCancel] = useState(0);

  useEffect(() => {
    fetchAjax({
      query: {
        methodname: 'local_teamup-get_user_events_today',
      }
    })
  }, []);

  useEffect(() => {
    if (fetchResponse && !fetchError) {
      setEvents(fetchResponse.data)
    }
  }, [fetchResponse]);

  const onEventClick = (event) => {
    setEvent(event)
    eventMToggle.open()
  }

  const handleCancel = () => {
    setDeleteOrCancel(1)
    cancelMToggle.open()
  }
  const handleDelete = () => {
    setDeleteOrCancel(2)
    cancelMToggle.open()
  }
  const submittedCancelEvent = () => {
    cancelMToggle.close()
    eventMToggle.close()
  }

  return (
    <Card withBorder radius="sm" pb="md">
      <Card.Section withBorder p="md">
        <Text size="md" weight={500}>Your day</Text>
      </Card.Section>
      <Card.Section pb={5}>
        <Box
          pos="relative"
          mih={40}
        >
          <LoadingOverlay loaderProps={{size: 'sm'}} visible={fetchLoading} />
          { !events.length && fetchResponse &&
            <Text c="dimmed" px="md" py="sm" fz="sm">No events on today</Text>
          }
          { events.map((role, i) => (
              <Box key={i}
                sx={{borderBottom: (i + 1 === events.length) ? "0 none" :  "0.0625rem solid #dee2e6"}}
              >
                { role.role == 'parent'
                  ? <div>
                      <Group spacing="xs" px="md" py={5} bg="gray.1">
                        <Avatar size="sm" radius="xl" src={'/local/platform/avatar.php?username=' +role.child.un} />
                        <Text fz="sm">{role.child.fn} {role.child.ln}</Text>
                      </Group>
                    </div>
                  : null
                }
                <Table horizontalSpacing="lg">
                  <tbody>
                    { role.events.map((event, j) => (
                      <tr key={j}>
                        <td>
                          <Flex gap="xs" align="center">
                            <Text fz="sm" fw={600} td={event.cancelled ? 'line-through' : ''}>{event.timestartReadable} - {event.timeendReadable}</Text>
                            <UnstyledButton><Text onClick={() => onEventClick(event)} c='tablrblue' fz="sm" td={event.cancelled ? 'line-through' : ''}>{event.title}</Text></UnstyledButton>
                          </Flex>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Box>
            ))
          }
          { !!events.length &&
            <>
              <EventModal opened={eventMOpened} eventData={event} showOptions={true} close={eventMToggle.close} onCancel={handleCancel} onDelete={handleDelete} isCancelModalOpen={cancelMOpened} />
              <CancelEventModal deleteOrCancel={deleteOrCancel} opened={cancelMOpened} eventid={event ? event.id : 0} close={cancelMToggle.close} submitted={submittedCancelEvent}/>
            </>
          }
          </Box>
      </Card.Section>
    </Card>
  );
}