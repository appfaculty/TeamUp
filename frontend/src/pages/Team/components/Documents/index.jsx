import { Fragment } from "react";
import { Card, Grid } from '@mantine/core';
import { FileUploader } from './components/FileUploader/index';

export function Documents() {

  return (
    <>
        <Card.Section withBorder inheritPadding py="sm">
          <h3>Documents</h3>
        </Card.Section>
        <Card.Section inheritPadding py="sm">
          <Grid gutter="xl">
            <Grid.Col span={12}>
              <FileUploader inputName="documents" title="Documents" desc="Drag files or click to select. Maximum 10 files. Each file should not exceed 10mb." maxFiles={10} maxSize={10} />
            </Grid.Col>
          </Grid>
        </Card.Section>
    </>
  );
};