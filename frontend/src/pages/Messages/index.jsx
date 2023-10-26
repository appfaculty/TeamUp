import { Fragment, useEffect, useState } from "react";
import { Container, Center, Text, Loader, Card, Box, Group, Avatar, Menu, Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Header } from "../../components/Header/index.jsx";
import { Footer } from "../../components/Footer/index.jsx";
import { PageHeader } from "./components/PageHeader/index.jsx";
import { useNavigate, useParams } from "react-router-dom";
import { useAjax } from "../../hooks/useAjax.js";
import { IconChevronDown, IconEdit, IconTrash, IconUsers } from "@tabler/icons-react";
import { modals } from '@mantine/modals';
import { EditMessageModal } from "./components/EditMessageModal/index.jsx";
import { Recipients } from "./components/Recipients/index.jsx";
import { getConfig } from "../../utils/index.js";

export function Messages() {
  let { id } = useParams();

  const [fetchResponse, fetchError, fetchLoading, fetchAjax] = useAjax(); // destructure state and fetch function
  const [message, setMessage] = useState(null)
  const [opened, modalHandlers] = useDisclosure(false);
  const [recipientsOpened, recipientsModalHandlers] = useDisclosure(false);
  const [deleteResponse, deleteError, deleteLoading, deleteAjax] = useAjax(); // destructure state and fetch function

  useEffect(() => {
    document.title = 'Messages'
    if (id) {
      fetchAjax({
        query: {
          methodname: 'local_teamup-get_message',
          id: id,
        }
      })
    }
  }, [id]);
  useEffect(() => {
    if (fetchResponse && !fetchError) {
      setMessage(fetchResponse.data)
    }
  }, [fetchResponse]);

  const onDelete = (id) => {
    modals.openConfirmModal({
      title: 'Delete message',
      centered: true,
      children: (
        <Text size="sm">Are you sure you want to delete this message?</Text>
      ),
      labels: { confirm: 'Delete message', cancel: "No don't delete it" },
      confirmProps: { color: 'red', className: 'bg-mantine-red' },
      onConfirm: () => submitDelete(id),
    });
  }
  const submitDelete = (id) => {
    deleteAjax({
      method: "POST", 
      body: {
        methodname: 'local_teamup-delete_message',
        args: {id: id},
      }
    });
  }

  const navigateTo = useNavigate()
  useEffect(() => {
    if (deleteResponse && !deleteError) {
      navigateTo('/')
    }
  }, [deleteResponse]);

  return (
    <Fragment>
      <Header />
      <div className="page-wrapper">
        { !fetchResponse ? (
          <Center h={200} mx="auto"><Loader variant="dots" /></Center>
        ) : (
            fetchError || !message
            ? <Container size="xl">
                <Center h={300}>
                  <Text fw={600} fz="lg">Failed to load message. It might have been deleted.</Text>
                </Center>
              </Container>
            : <>
                <Container size="xl">
                  <PageHeader />
                </Container>
                <Container size="xl" my="md">
                  <Card withBorder radius="sm" mb="lg" sx={{overflow: 'visible'}}>
                    <Card.Section>
                      <Box className='message' p="sm" sx={{borderBottom: '0.0625rem solid #dee2e6'}}>
                        <Group position="apart" align="start">

                          <Group>
                            <Avatar size="2.5rem" src={'/local/platform/avatar.php?username=' + message.un} alt={message.fn + " " + message.ln} radius="xl" />
                            <div>
                              <Text fz="md">{message.fn + " " + message.ln}</Text>
                              <Text fz="sm" color="dimmed">
                                {message.postedAt}
                              </Text>
                            </div>
                          </Group>

                          { message.isOwner || getConfig().roles.includes('manager')
                            ? <Menu shadow="md" width={200} position="bottom">
                                <Menu.Target>
                                  <Button loading={deleteLoading} compact variant="light" radius="xl" rightIcon={deleteLoading ? null : <IconChevronDown size={16}/>} >{deleteLoading ? "Deleting" : "Options"}</Button>
                                </Menu.Target>
                                <Menu.Dropdown>
                                  <Menu.Item onMouseDown={() => recipientsModalHandlers.open()} icon={<IconUsers size={14} />}>Recipients</Menu.Item>
                                  <Menu.Item onMouseDown={() => modalHandlers.open()} icon={<IconEdit size={14} />}>Edit</Menu.Item>
                                  <Menu.Item color="red" icon={<IconTrash size={14}/>} onMouseDown={() => onDelete(message.id)}>Delete</Menu.Item>
                                </Menu.Dropdown>
                              </Menu>
                            : null
                          }

                        </Group>
                        
                        <Text mt="sm" fz="md" fw={500}>{message.subject}</Text>
                        <Text mt="sm" fz="md">
                          <div dangerouslySetInnerHTML={{__html: message.body}}/>
                        </Text>
                      </Box>
                    </Card.Section>
                  </Card>
                </Container>
                <EditMessageModal data={message} opened={opened} close={modalHandlers.close} />
                <Recipients recipients={message.recipients} opened={recipientsOpened} close={recipientsModalHandlers.close}/>
              </>
        )}
      </div>
      <Footer />
    </Fragment>
  )
}