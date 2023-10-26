
import { Avatar, Badge, Box, Flex, Group, Modal, Text } from '@mantine/core';
import { IconUser } from '@tabler/icons-react';

export function Recipients({recipients, opened, close}) {

  const student = (data) => {
    return (
        <Badge key={data.un} variant='filled' pl={0} color="gray.2" size="lg" radius="xl" leftSection={
          <Avatar alt={data.fn + " " + data.ln} size={24} mr={5} src={'/local/platform/avatar.php?username=' + data.un} radius="xl"><IconUser size={14} /></Avatar>
        }>
          <Flex gap={4}>
            <Text sx={{textTransform: "none", fontWeight: "400", color: "#000"}}>
              {data.fn + " " + data.ln}
            </Text>
          </Flex>
        </Badge>
    )
  }

  return (
    <Modal 
      opened={opened} 
      onClose={close} 
      title="Recipients" 
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
        <Box pt="md">
          <Group spacing="xs">
            { recipients.map(item => student(item)) }
          </Group>
        </Box>
    </Modal>
  );
};