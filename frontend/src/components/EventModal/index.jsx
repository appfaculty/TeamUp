
import { Badge, Button, Card, Group, Menu, Modal, Text } from '@mantine/core';
import { useAjax } from 'src/hooks/useAjax';
import { useEffect, useState } from 'react';
import { IconChevronDown, IconCircleOff, IconTrash, IconUserCheck } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { getConfig } from 'src/utils';


export function EventModal({opened, eventData, showOptions, close, viewRole, onCancel, onDelete, isCancelModalOpen}) {
  
  const [fetchResponse, fetchError, fetchLoading, fetchAjax] = useAjax(); // destructure state and fetch function
  const [showEditOptions, setShowEditOptions] = useState(false)

  useEffect(() => {
    // If browsing schedule, something general staff can do, or not sure of the users view role, check if this users can edit.
    if (eventData && (viewRole == "browse" || viewRole === undefined)) {
      setShowEditOptions(false)
      fetchAjax({
        query: {
          methodname: 'local_teamup-is_event_teamstaff',
          id: eventData.id,
        }
      })
    }
  }, [eventData, viewRole]);

  useEffect(() => {
    if (fetchResponse && !fetchError) {
      if (fetchResponse.data.allowed) {
        setShowEditOptions(true)
      }
    }
  }, [fetchResponse]);


  return (
    <Modal.Root 
      opened={opened && !isCancelModalOpen} 
      onClose={() => {
        close()
      }} 
      size="xl"
      sx={{overflow: 'visible'}}
      >
        <Modal.Overlay />
        <Modal.Content pos="relative" mih={200} sx={{overflow: 'visible'}}>
          {eventData &&
          <>
            <Modal.Header pb={0} sx={{borderTopLeftRadius: '0.25rem', borderTopRightRadius: '0.25rem'}}>
              <Modal.Title><Group spacing={3}><Text fz="xl" fw={600}>{eventData.title}</Text><Text fz="xl" fw={600}>{eventData.cancelled ? '(Cancelled)' : ''}</Text></Group></Modal.Title>
              <Modal.CloseButton mt={-15} />
            </Modal.Header>
            <Modal.Body>
              <Card  sx={{overflow: 'visible'}}>
                <Card.Section pb={5}>
                  <Group position="apart">
                    <Group my={3} position="left">
                      <Text fz="sm" td={eventData.cancelled ? 'line-through' : ''}>{eventData.startReadable}</Text>
                      -
                      <Text fz="sm" td={eventData.cancelled ? 'line-through' : ''}>{eventData.endReadable}</Text>
                    </Group>
                    { showOptions 
                      ? <Group spacing="xs">
                          { !eventData.cancelled && (showEditOptions || viewRole == "teamstaff" || getConfig().roles.includes('manager'))
                            ? <>
                                <Link to={"/attendance/" + eventData.id}><Button radius="lg" compact variant="filled" leftIcon={<IconUserCheck size={12} />}>Attendance</Button></Link> 
                                <Menu shadow="md" width={200} position="bottom">
                                  <Menu.Target>
                                    <Button compact variant="light" radius="xl" rightIcon={<IconChevronDown size={16}/>} >Manage</Button>
                                  </Menu.Target>
                                  <Menu.Dropdown>
                                    { !eventData.cancelled &&
                                      <Menu.Item icon={<IconCircleOff size={14} />} onMouseDown={onCancel} >Cancel</Menu.Item>
                                    }
                                    <Menu.Item color="red" icon={<IconTrash size={14}/>} onMouseDown={onDelete}>Delete</Menu.Item>
                                  </Menu.Dropdown>
                                </Menu>
                              </>
                            : null
                          }
                        </Group>
                      : ''
                    }
                  </Group>
                </Card.Section>
                <Card.Section withBorder pt="xs">
                  <Group position="apart" mb={5} spacing={5}>
                    <Text fz="sm">{eventData.location}</Text>
                    <Group spacing="xs">
                      {eventData?.teams?.map((team, i) => {
                        return (
                          showEditOptions || viewRole == "teamstaff" || getConfig().roles.includes('manager')
                          ? <>
                              <Link to={"/team/" + team.teamid}>
                                <Badge key={i} variant='filled' color="gray.2" size="lg">
                                  <Text tt="none" fw={400} c="#000" td={team.cancelled == '1' ? 'line-through' : ''}>{team.teamname}</Text>
                                </Badge>
                              </Link>
                            </>
                          : <Badge key={i} variant='filled' color="gray.2" size="lg">
                              <Text tt="none" fw={400} c="#000" td={team.cancelled == '1' ? 'line-through' : ''}>{team.teamname}</Text>
                            </Badge>
                        )
                      })}
                    </Group>
                  </Group>
                  <Text fz="md">{eventData.details}</Text> 
                </Card.Section>
              </Card>
            </Modal.Body>
          </>
          }
        </Modal.Content>
      </Modal.Root>





        
  );
};