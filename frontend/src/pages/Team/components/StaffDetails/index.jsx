import { Card, Grid } from '@mantine/core';
import { StaffSelector } from "./components/StaffSelector/index.jsx";

export function StaffDetails() {

  return (
    <Card.Section inheritPadding py="sm">
      <Grid gutter="xl">
        <Grid.Col span={12}>
          <StaffSelector max={null} valueprop="coaches" label="Coaches" />
        </Grid.Col>
        <Grid.Col span={12}>
          <StaffSelector max={null} valueprop="assistants" label="Assistants" />
        </Grid.Col>
      </Grid>
    </Card.Section>
  );
};