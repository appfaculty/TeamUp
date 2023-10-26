import { Fragment } from "react";
import { ActionIcon, Breadcrumbs, Button, Container, Group, Menu, Text } from '@mantine/core';
import { Link } from "react-router-dom";
import { IconChevronDown, IconCircleOff, IconSettings } from "@tabler/icons-react";
import { IconDots } from "@tabler/icons-react";

export function PageHeader({title, eventMToggle, cEventMToggle}) {

  return (
    <Fragment>
      <div className="page-header">
        <Container size="xl" my="md" p={0}>
          <Breadcrumbs fz="sm" mb="sm">
            <Link to="/">
              <Text color="blue">Dashboard</Text>
            </Link>
            <Link to={location.pathname}>
              <Text color="gray.6">Attendance</Text>
            </Link>
          </Breadcrumbs>
          <Group spacing="sm">
            <h2 className="page-title">{title}</h2>
            <Menu shadow="md" width={200} position="bottom-start">
              <Menu.Target>
                <ActionIcon size="xs" radius="xl" variant="filled" color="blue" ><IconChevronDown size={16} /></ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item icon={<IconSettings size={14} />} onMouseDown={eventMToggle.open} >View event details</Menu.Item>
                <Menu.Item color="red" icon={<IconCircleOff size={14} />} onMouseDown={cEventMToggle.open} >Cancel event</Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Container>
      </div>
    </Fragment>
  );
}