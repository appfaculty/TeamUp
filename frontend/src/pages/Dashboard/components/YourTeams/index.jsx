import { Avatar, Box, Card, Group, LoadingOverlay, Table, Text, UnstyledButton } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useAjax } from '../../../../hooks/useAjax';
import { Link } from 'react-router-dom';
import { useDisclosure } from '@mantine/hooks';
import { TeamModal } from '../../../../components/TeamModal';

export function YourTeams() {

  const [fetchResponse, fetchError, fetchLoading, fetchAjax] = useAjax(); // destructure state and fetch function
  const [teams, setTeams] = useState([])
  const [teamMOpened, teamMToggle] = useDisclosure(false);
  const [team, setTeam] = useState({});

  useEffect(() => {
    fetchAjax({
      query: {
        methodname: 'local_teamup-get_user_teams',
      }
    })
  }, []);

  useEffect(() => {
    if (fetchResponse && !fetchError) {
      setTeams(fetchResponse.data)
    }
  }, [fetchResponse]);

  const onTeamClick = (team) => {
    setTeam(team)
    teamMToggle.open()
  }

  return (
    <Card withBorder radius="sm" pb="md">
      <Card.Section withBorder p="md">
        <Text size="md" weight={500}>Your Teams</Text>
      </Card.Section>
      <Card.Section pb={5}>
        <Box
          pos="relative"
          mih={40}
        >
          <LoadingOverlay loaderProps={{size: 'sm'}} visible={fetchLoading} />
          { !teams.length && fetchResponse &&
            <Text c="dimmed" px="md" py="sm" fz="sm">You are not in any teams</Text>
          }
          { teams.map((roleteams, i) => (
              <Box key={i}
                sx={{borderBottom: (i + 1 === teams.length) ? "0 none" :  "0.0625rem solid #dee2e6"}}
              >
                { roleteams.role == 'parent'
                  ? <div>
                      <Group spacing="xs" px="md" py={5} bg="gray.1">
                        <Avatar size="sm" radius="xl" src={'/local/platform/avatar.php?username=' +roleteams.child.un} />
                        <Text fz="sm">{roleteams.child.fn} {roleteams.child.ln}</Text>
                      </Group>
                    </div>
                  : null
                }
                <Table horizontalSpacing="lg">
                  <tbody>
                    { roleteams.teams.map((team, j) => (
                      <tr key={j}>
                        <td>
                        { roleteams.role == 'teamstaff'
                          ? <Link to={"/team/" + team.id}><Text fz="sm" color='tablrblue'>{team.teamname}</Text></Link>
                          : <UnstyledButton onClick={() => onTeamClick(team)}><Text fz="sm" color='tablrblue'>{team.teamname}</Text> </UnstyledButton>
                        }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Box>
            ))
          }
          { !!teams.length &&
            <TeamModal opened={teamMOpened} team={team} close={teamMToggle.close} />
          }
          </Box>
      </Card.Section>
    </Card>
  );
}