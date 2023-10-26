import { Fragment } from "react";
import { Breadcrumbs, Container, Text } from '@mantine/core';
import { useBasicDetailsStore } from '../../store/formFieldsStore'
import { useFormMetaStore } from '../../store/formMetaStore'
import { Link } from "react-router-dom";
import { statuses } from "../../../../utils";

export function PageHeader() {
  const name = useBasicDetailsStore((state) => (state.teamname))
  const status = useFormMetaStore((state) => (state.status))

  return (
    <Fragment>
      <div className="page-header">

        <Container size="xl" my="md" p={0}>
            <Breadcrumbs fz="sm" mb="sm">
              <Link to="/">
                <Text color="blue">Dashboard</Text>
              </Link>
              <Link to={location.pathname}>
                <Text color="gray.6">Team</Text>
              </Link>
            </Breadcrumbs>
            <h2 className="page-title">{name ? name : ( status == statuses.unsaved ? 'New team' : 'Edit team') }</h2>
        </Container>
      </div>
    </Fragment>
  );
}