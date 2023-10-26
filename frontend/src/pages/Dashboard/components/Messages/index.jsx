import { Box, Button, Card, Center, LoadingOverlay, ScrollArea } from '@mantine/core';
import { Text, Avatar, Group } from '@mantine/core';
import { useAjax } from '../../../../hooks/useAjax';
import { useEffect, useState } from 'react';
import { IconEdit, IconExternalLink } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { SendMessageModal } from '/src/components/SendMessageModal';
import { useDisclosure } from '@mantine/hooks';
import { getConfig } from '../../../../utils';

export function Messages() {

  const [fetchResponse, fetchError, fetchLoading, fetchAjax] = useAjax(); // destructure state and fetch function
  const [messages, setMessages] = useState([])
  const [hasNextPage, setHasNextPage] = useState(true)
  const [page, setPage] = useState(0)
  const [isOpenMessageModal, messageModalHandlers] = useDisclosure(false);

  useEffect(() => {
    if (!page) {
      setPage(1)
    }
  }, []);

  useEffect(() => {
    if (page && hasNextPage) {
      fetchAjax({
        query: {
          methodname: 'local_teamup-get_messages',
          page: page,
        }
      })
    }
  }, [page]);

  useEffect(() => {
    if (fetchResponse && !fetchError) {
      const merged = [...messages, ...fetchResponse.data.messages]
      setMessages(merged)
      setHasNextPage(fetchResponse.data.hasNextPage)
    }
  }, [fetchResponse]);

  const comment = (message, i) => {
    return (
      <Box className='message' p="sm" pr="md" key={i} sx={{borderBottom: '0.0625rem solid #dee2e6'}}>
        <Group position="apart" align="start">
          <Group>
            <Avatar size="2rem" src={'/local/platform/avatar.php?username=' + message.un} alt={message.fn + " " + message.ln} radius="xl" />
            <div>
              <Text size="sm">{message.fn + " " + message.ln}</Text>
              <Text size="xs" color="dimmed">
                {message.postedAt}
              </Text>
            </div>
          </Group>
          <Link to={"/messages/" + message.id}><Text c="blue"><IconExternalLink size="1rem" /></Text></Link>
        </Group>
        <Text size="sm">
          <Text fw={500}>{message.subject}</Text>
          <div dangerouslySetInnerHTML={{__html: message.body}}/>
        </Text>
      </Box>
    )
  }

  return (
    <>
      <Card withBorder radius="sm">
        <Card.Section p="md" withBorder>
          <Group position="apart">
            <Text size="md" weight={500}>Messages</Text>
            { getConfig().roles.includes('manager') &&
              <Button onClick={messageModalHandlers.open} radius="lg" compact variant="light" leftIcon={<IconEdit size={12} />}>Post</Button>
            }
          </Group>
        </Card.Section>
        <Card.Section>
          <Box
            pos="relative"
            mih={40}
          >
            <LoadingOverlay loaderProps={{size: 'sm'}} visible={fetchLoading && page == 1} />
            { messages.length
              ? <ScrollArea h={messages.length < 4 ? 'auto' : 400} type="auto">
                  { messages.map((message, i) => {
                    return comment(message, i)
                  })}  
                  { hasNextPage &&
                    <Center p="sm">
                      <Button variant="light" loading={fetchLoading} onClick={() => setPage(i => i + 1)} compact px="sm" radius="xl" >Load more</Button>
                    </Center>
                  }
                </ScrollArea>
              : null
            }
            { !messages.length && fetchResponse &&
              <Text c="dimmed" px="md" py="sm" fz="sm">You have no messages</Text>
            }
          </Box>
        </Card.Section>
      </Card>
      <SendMessageModal 
        students={[]} 
        teamid={0}
        opened={isOpenMessageModal} close={messageModalHandlers.close} />
    </>
  );



}