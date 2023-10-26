import { Container, Text } from "@mantine/core";
import { Fragment } from "react";

export function Footer() {
  return (
    <Fragment>
      <footer>
        <Container size="xl" py="md">
          <Text size='xs' c="dimmed">v.{window.appdata.config.version}</Text>
        </Container>
      </footer>
    </Fragment>
  );
}