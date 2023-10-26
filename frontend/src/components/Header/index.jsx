import { Link } from "react-router-dom";
import { Container, Avatar, Menu, UnstyledButton, Group, Text, Image, Box, MediaQuery } from '@mantine/core';
import { IconLogout } from '@tabler/icons-react';
import { fetchData, getConfig } from "../../utils/index.js";
import { useInterval } from "@mantine/hooks";
import { useEffect } from "react";

export function Header() {

  const checkAuthStatus = async () => {
    const response = await fetchData({
      query: {
        methodname: 'local_teamup-check_login',
      }
    })
    if (response.error && (response.exception?.errorcode === 'requireloginerror' || response.errorcode === 'requireloginerror')) {
      window.location.replace(getConfig().loginUrl)
    }
  }
  const interval = useInterval(() => checkAuthStatus(), 30000); // 30 seconds.
  useEffect(() => {
    interval.start();
    return interval.stop;
  }, []);

  return (
  <>
    <Box bg={getConfig().headerbg}>
      <Container size="xl">
        <Group h={54} position="apart">
          <Group spacing="md">
            <Link to="/">
              <Image width={44} src={window.appdata.config.logo}/>
            </Link>
            <Link to="/" style={{ textDecoration: 'none' }}><Text fz="md" c={getConfig().headerfg}>{getConfig().toolname}</Text></Link>
          </Group>
          <Menu position="bottom-end" width={200} shadow="md">
            <Menu.Target>
              <UnstyledButton> 
                <Group>
                  <Avatar size="sm" radius="xl" src={'/local/platform/avatar.php?username=' + getConfig().user.un} />
                  <MediaQuery smallerThan="sm" styles={{ display: 'none' }}>
                    <Text size="sm" color={getConfig().headerfg}>{getConfig().user.fn + " " + getConfig().user.ln}</Text>
                  </MediaQuery>
                </Group>
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item icon={<IconLogout size={14} />} onMouseDown={() => window.location.replace(getConfig().logoutUrl)}>Logout</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Container>
    </Box>
  </>
  );
}