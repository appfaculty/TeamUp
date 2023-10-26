import { Button, Card, Group, Text } from '@mantine/core';
import { TeamBrowser } from '/src/components/TeamBrowser/index.jsx';
import { Link, useNavigate } from 'react-router-dom';
import { IconEdit } from '@tabler/icons-react';

export function TeamManager() {
  const navigateTo = useNavigate()
  const handleTeamClick = (selectedTeam) => {
    const data = JSON.parse(selectedTeam)
    if (data.id) {
      navigateTo('/team/' + data.id)
    }
  }

  return (
    <Card withBorder radius="sm">
      <Card.Section p="md">
        <Group position="apart">
          <Text size="md" weight={500}>Manage Teams</Text>
          <Link to={"/team"}><Button radius="lg" compact variant="light" leftIcon={<IconEdit size={12} />}>New team</Button></Link>
        </Group>
      </Card.Section>
      <Card.Section withBorder inheritPadding py={0}>
        <TeamBrowser category={-1} callback={handleTeamClick} showCheckbox={false} />
      </Card.Section>
    </Card>
  );
}