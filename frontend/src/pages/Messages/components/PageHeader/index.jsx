import { Fragment } from "react";
import { Breadcrumbs, Container, Text } from '@mantine/core';
import { Link } from "react-router-dom";

export function PageHeader() {

  return (
    <Fragment>
      <div className="page-header">
        <Container size="xl" p={0} my="md">
          <Breadcrumbs fz="sm" mb="sm">
            <Link to="/">
              <Text color="blue">Dashboard</Text>
            </Link>
            <Link to={location.pathname}>
              <Text color="gray.6">Message</Text>
            </Link>
          </Breadcrumbs>
        </Container>
      </div>
    </Fragment>
  );
}