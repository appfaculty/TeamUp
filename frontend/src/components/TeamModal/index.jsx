
import { Avatar, Box, Group, Modal, Text } from '@mantine/core';

export function TeamModal({opened, team, close}) {
   
  return (
    <Modal 
      opened={opened} 
      onClose={close} 
      title={team.teamname} 
      size="xl" 
      styles={{
        header: {
          borderBottom: '0.0625rem solid #dee2e6',
        },
        title: {
          fontWeight: 600,
        }
      }}
      >
        <Box pt="sm" pb="md">
          
          <Text mb={5} fz="sm" fw={600}>Coaches</Text>
          <Box>
            { team.coaches && team.coaches.map( (coach, i) => (
                <Group spacing="xs">
                  <Avatar key={i} size="sm" radius="xl" src={'/local/platform/avatar.php?username=' + coach.un} />
                  <Text fz="sm">{coach.fn} {coach.ln}</Text>
                </Group>
              ))
            }
          </Box>
          { !!team?.details?.length &&
            <>
                <Text mb={5} mt="md" fz="sm" fw={600}>Details</Text>
                <Text fz="sm">{team.details}</Text>
            </>
          }

        </Box>
    </Modal>        
  );
};