
import { Box, Button, Flex, Modal, Tabs } from '@mantine/core';
import { useState } from 'react';
import { StudentSelector } from '/src/components/StudentSelector';
import { TeamBrowser } from '/src/components/TeamBrowser/index.jsx';
import { IconShirtSport, IconUser, IconUsersPlus } from '@tabler/icons-react';
import { fetchData } from '/src/utils';

export function AddStudentsModal({opened, close, insert}) {
  const [students, setStudents] = useState([]);
  const [team, setTeam] = useState(0);

  const insertAndClose = async () => {
    let studentObjects = [];
    if (team.length) {
      const response = await fetchData({
        query: {
          methodname: 'local_teamup-get_team_students',
          id: JSON.parse(team).id,
        }
      })
      studentObjects = response.data
    } else {
      studentObjects = students.map(student => JSON.parse(student))
    }
    insert(studentObjects)
    setStudents([])
    close()
  }

  const handleTeamSelect = (value) => {
    setStudents([]) // Clear students
    setTeam(value)
  }

  return (
    <Modal 
      opened={opened} 
      onClose={close} 
      title="Add students" 
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
          <Tabs defaultValue="students"  orientation="vertical">
            <Tabs.List>
              <Tabs.Tab value="students" icon={<IconUser size="0.8rem" />}>Individuals</Tabs.Tab>
              <Tabs.Tab value="teams" icon={<IconShirtSport size="0.8rem" />}>Teams</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="students" px="md" pb="md" mih={150}>
              <StudentSelector students={students} setStudents={setStudents} />
            </Tabs.Panel>
            <Tabs.Panel value="teams" px="md" pb="md" mih={150}>
              <TeamBrowser category={-1} callback={handleTeamSelect} showCheckbox={true} />
            </Tabs.Panel>
          </Tabs>
          <Flex pt="sm" justify="end">
            <Button onClick={insertAndClose} disabled={!students.length && !team} type="submit" leftIcon={<IconUsersPlus size="1rem" />} radius="xl" >Insert students</Button>
          </Flex>
        </Box>
    </Modal>
  );
};