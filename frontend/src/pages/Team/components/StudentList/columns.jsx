import { Alert, Avatar, Badge, Flex, Text } from "@mantine/core";
import { IconUser } from "@tabler/icons-react";

const studentColumn = () => {
  return {
    accessorFn: (row) => { 
      return (
        <Flex wrap="wrap" gap={4} align="center">
          <Badge variant='filled' key={row.un} pl={0} size="lg" color="gray.2" radius="xl" leftSection={
              <Avatar alt={row.fn + " " + row.ln} size={24} mr={5} src={'/local/platform/avatar.php?username=' + row.un} radius="xl"><IconUser size={14} /></Avatar>
            }
          >
            <Text sx={{
              textTransform: "none",
              fontWeight: "400",
              color: "#000",
            }}>
              {row.ln + ", " + row.fn}
            </Text>
          </Badge>
          { row.moveToTeamId && 
            <Alert py={0} px={5} color="yellow" radius="xs">
              Save changes to move into {row.moveToTeamName}
            </Alert>
          }
        </Flex>
      ) 
    },
    id: 'student',
    header: 'Student',
  }
}

const attributesColumn = {
  accessorFn: (row) => {
    return (
      <Flex wrap="wrap" gap={4}>
        { row.attributes.map((attribute, i) => (
          <Badge key={i} variant='filled' size="lg" color="gray.1" radius="xl">
            <Text sx={{textTransform: "none",fontWeight: "400",color: "#000"}}>
              {attribute}
            </Text>
          </Badge>
        ))}
      </Flex>
    )
  },
  id: 'attributes',
  header: '',
}

export { studentColumn, attributesColumn };