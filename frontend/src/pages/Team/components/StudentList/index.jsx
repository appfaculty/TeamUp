import { Card, Flex, Group, Text, Button, Loader, Center, Tooltip } from '@mantine/core';
import { IconPlus, IconMinus, IconMail, IconArrowBounce } from '@tabler/icons-react';
import { useAjax } from 'src/hooks/useAjax';
import { useBasicDetailsStore, useStudentListStore } from '../../store/formFieldsStore'
import { useEffect, useMemo, useState } from 'react';
import { MantineReactTable } from 'mantine-react-table';
import { useParams } from 'react-router-dom';
import { useFormMetaStore, useFormStateStore } from '../../store/formMetaStore';
import { statuses } from '../../../../utils';
import { studentColumn } from './columns';
import { AddStudentsModal } from '../Modals/AddStudentsModal';
import { MoveStudentsModal } from '../Modals/MoveStudentsModal';
import { useDisclosure } from '@mantine/hooks';
import { SendMessageModal } from '/src/components/SendMessageModal';

export function StudentList({reload}) {
  let { id } = useParams();

  const category = useBasicDetailsStore((state) => state.category)
  const status = useFormMetaStore((state) => state.status)
  const studentListStore = useStudentListStore()
  const studentsLoaded = useFormStateStore((state) => (state.setStudentsLoaded))
  const baselineHash = useFormStateStore((state) => (state.baselineHash))
  const haschanges = useFormStateStore((state) => (state.haschanges))

  const [isOpenAddStudentsModal, addStudentsModalHandlers] = useDisclosure(false)
  const [isOpenMoveStudentsModal, moveStudentsModalHandlers] = useDisclosure(false)
  const [isOpenMessageModal, messageModalHandlers] = useDisclosure(false);

  
  const [fetchResponse, fetchError, fetchLoading, fetchAjax] = useAjax(); // destructure state and fetch function
  useEffect(() => {
    if (id) {
      // Only load once.
      if (!reload && fetchResponse && !fetchError) {
        return
      }
      // Fetch student list for this team.
      fetchAjax({
        query: {
          methodname: 'local_teamup-get_team_students',
          id: id,
        }
      })
    }
  }, [reload])

  useEffect(() => { 
    if (fetchResponse && !fetchError) {
      studentListStore.setState({data: fetchResponse.data, move: []})
      const usernames = fetchResponse.data.map((student) => (student.un))
      studentListStore.setState({usernames: usernames})
      baselineHash()
      studentsLoaded()
    }
  }, [fetchResponse]);

  const insertStudents = (students) => {
    // Deduplicate.
    const newStudents = students.filter(student => !studentListStore.usernames.includes(student.un))

    // Merge usernames.
    const newusernames = newStudents.map(student => student.un)
    studentListStore.setState({usernames: studentListStore.usernames.concat(newusernames)})

    // Merge data.
    const newStudentData = newStudents.map((student) => {
      return {
        ...student,
        attributes: [],
      }
    })
    studentListStore.setState({data: studentListStore.data.concat(newStudentData)})
  }

  const removeStudents = () => {
    const selectedUsernames = Object.keys(rowSelection)

    const filteredUsernames = studentListStore.usernames.filter(username => !selectedUsernames.includes(username))
    studentListStore.setState({usernames: filteredUsernames})

    const filteredData = studentListStore.data.filter(udata => !selectedUsernames.includes(udata.un))
    studentListStore.setState({data: filteredData})

    const filteredMove = studentListStore.move.filter(udata => !selectedUsernames.includes(udata.username)) 
    studentListStore.setState({move: filteredMove})

    setRowSelection({})
  }

  const moveStudents = (teamJSON) => {
    const selectedUsernames = Object.keys(rowSelection)
    
    // Update data.
    const team = JSON.parse(teamJSON)
    const data = studentListStore.data.map(udata => {
      if (selectedUsernames.includes(udata.un)) {
        return {
          ...udata,
          moveToTeamId: team.id,
          moveToTeamName: team.name,
        }
      }
      return udata
    }) 
    studentListStore.setState({data: data})
    setRowSelection({})
    
    // Store moving list.
    const moveData = data.filter(udata => !!udata.moveToTeamId)
    studentListStore.setState({move: moveData.map((u) => ({username: u.un, teamid: u.moveToTeamId}))})

  }

  const columns = useMemo(() => ([studentColumn()]), [])
  const [rowSelection, setRowSelection] = useState({});

  return (
    <>
      <Card withBorder radius="sm" mb="lg">

        <Card.Section inheritPadding py="sm">
          <Group position="apart">
            <Text size="md" weight={500}>Students</Text>
              <Text color='dimmed'> {
                Object.keys(rowSelection).length
                ? Object.keys(rowSelection).length + ' selected'
                : studentListStore.data?.length + ' students'
              } </Text>
          </Group>
        </Card.Section>
        
        { fetchLoading 
          ? <Card.Section py="lg" sx={{borderTop: "0.0625rem solid #dee2e6"}}><Center><Loader size="sm" /></Center></Card.Section>
          : (
            studentListStore.data?.length == 0 
            ? <Card.Section inheritPadding py="sm" sx={{borderTop: "0.0625rem solid #dee2e6"}}>
                <Button onClick={addStudentsModalHandlers.open} variant="filled" radius="xl" leftIcon={<IconPlus size={14} />} >Add students</Button>
              </Card.Section>
            : <>
                <Card.Section sx={{borderTop: "0.0625rem solid #dee2e6"}}>
                  <MantineReactTable
                    columns={columns}
                    data={studentListStore.data}

                    enableRowSelection
                    //clicking anywhere on the row will select it
                    mantineTableBodyRowProps={({ row }) => ({
                      onClick: row.getToggleSelectedHandler(),
                      sx: { cursor: 'pointer' },
                    })}

                    getRowId={(row) => row.un} //give each row a more useful id
                    onRowSelectionChange={setRowSelection} //connect internal row selection state to your own
                    state={{ rowSelection }} //pass our managed row selection state to the table to use

                    initialState={{ density: 'xs' }}

                    displayColumnDefOptions={{ 'mrt-row-select': { size: 30 } }} //change width of select column to 30px
                    
                    enableColumnActions={false}
                    enableColumnFilters={false}
                    enablePagination={false}
                    enableSorting={false}
                    enableBottomToolbar={false}
                    enableTopToolbar={false}

                    mantinePaperProps={{
                      shadow: false,
                      withBorder: false,
                    }}

                    mantineTableProps={{
                      highlightOnHover: false,
                      withColumnBorders: false,
                      horizontalSpacing: 'md',
                      verticalSpacing: 'xs',
                      className: 'student-list-table',
                    }}

                    mantineTableHeadCellProps={{
                      sx: (theme) => ({
                        backgroundColor: theme.colors.gray[0],
                        textTransform: 'none',
                        letterSpacing: 0,
                        fontWeight: '500!important',
                        fontSize: '0.875rem',
                        color: '#000!important',
                      }),
                      className: 'student-list-table-headcell',
                    }}

                    mantineSelectAllCheckboxProps={{
                      size: "xs",
                    }}

                    mantineSelectCheckboxProps={{
                      size: "xs",
                    }}
                  />
                </Card.Section>

                <Card.Section inheritPadding pt="md">
                  <Group position="apart">
                    <Flex gap="sm">
                      <Button onClick={addStudentsModalHandlers.open} variant="light" compact radius="xl" leftIcon={<IconPlus size={14} />} >Add students</Button>
                      { Object.keys(rowSelection).length > 0 && 
                        <>
                        <Button onClick={removeStudents} variant="light" compact radius="xl" leftIcon={<IconMinus size={14} />}>Remove</Button>
                        <Button onClick={moveStudentsModalHandlers.open}  variant="light" compact radius="xl" leftIcon={<IconArrowBounce size={14} />}>Change team</Button>
                        </>
                      }
                    </Flex>
                    { status == statuses.saved || status == statuses.live &&
                      <Tooltip.Floating disabled={!haschanges} label="You must save changes before you may send messages.">
                        <Button variant="filled" color={haschanges ? "gray.4" : null} onClick={() => (haschanges ? null : messageModalHandlers.open())} compact radius="xl" leftIcon={<IconMail size={14} />}>Send a message</Button>
                      </Tooltip.Floating>
                    }
                  </Group>
                </Card.Section>
              </>
          )
        }
      </Card>
      <AddStudentsModal opened={isOpenAddStudentsModal} close={addStudentsModalHandlers.close} insert={insertStudents} />
      <MoveStudentsModal category={category} opened={isOpenMoveStudentsModal} close={moveStudentsModalHandlers.close} callback={moveStudents} />
      <SendMessageModal 
        students={
          Object.keys(rowSelection).length 
          ? studentListStore.data.filter(s => Object.keys(rowSelection).includes(s.un))
          : studentListStore.data
        } 
        teamid={id}
        opened={isOpenMessageModal} close={messageModalHandlers.close} />

    </>
  );
};