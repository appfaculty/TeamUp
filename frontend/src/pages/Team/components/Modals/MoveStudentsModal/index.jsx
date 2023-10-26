
import { Box, Button, Flex, Modal, Tabs } from '@mantine/core';
import { useState } from 'react';
import { TeamSearch } from '/src/components/TeamSearch';
import { TeamBrowser } from '/src/components/TeamBrowser';
import { IconCheck, IconFolderSymlink, IconFolderUp, IconPlus, IconSearch } from '@tabler/icons-react';

export function MoveStudentsModal({opened, close, category, callback}) {

  const [moveToTeam, setMoveToTeam] = useState(null)

  const moveAndClose = () => {
    callback(moveToTeam)
    setMoveToTeam(null)
    close()
  }

  return (
    <Modal 
      opened={opened} 
      onClose={close} 
      title="Select a team" 
      size="xl"
      styles={{
        content: {
          overflowY: 'visible !important',
        },
        header: {
          borderBottom: '0.0625rem solid #dee2e6',
        },
        title: {
          fontWeight: 600,
        }
      }}
      >
        <Box pt="md">
          <Tabs defaultValue="search"  orientation="vertical">
            <Tabs.List>
              <Tabs.Tab value="search" icon={<IconSearch size="0.8rem" />}>Search</Tabs.Tab>
              <Tabs.Tab value="browse" icon={<IconFolderSymlink size="0.8rem" />}>Browse</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="search" px="md" pb="md" mih={150}>
              <TeamSearch callback={setMoveToTeam} />
            </Tabs.Panel>
            <Tabs.Panel value="browse" px="md" pb="md" mih={150}>
              <TeamBrowser category={opened ? category : null} callback={setMoveToTeam} />
            </Tabs.Panel>
          </Tabs>
          <Flex pt="sm" justify="end">
            <Button onClick={moveAndClose} disabled={!moveToTeam} type="submit" leftIcon={<IconCheck size="1rem" />} radius="xl" >Move to this team</Button>
          </Flex>
        </Box>
    </Modal>
  );
};