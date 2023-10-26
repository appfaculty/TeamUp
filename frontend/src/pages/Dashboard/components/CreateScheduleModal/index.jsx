
import { ActionIcon, Badge, Box, Button, CloseButton, Flex, Grid, Modal, Paper, Text, TextInput, Textarea } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { Calendar } from '@mantine/dates';
import { TimeInput } from '@mantine/dates';
import { TeamBrowser } from '/src/components/TeamBrowser/index.jsx';
import { IconClock } from '@tabler/icons-react';
import { useAjax } from '../../../../hooks/useAjax';



export function CreateScheduleModal({opened, close, submitted}) {
  
  const defaultSchedule = {
    title: '',
    days: [],
    teams: [],
    start: '',
    end: '',
    location: '',
    details: '',
  }

  const [schedule, setSchedule] = useState({...defaultSchedule})
  const [teamBadges, setTeamBadges] = useState([])
  const [errors, setErrors] = useState([])
  const startRef = useRef();
  const endRef = useRef();
  const [submitResponse, submitError, submitLoading, submitAjax, setSubmitData] = useAjax(); // destructure state and fetch function

  const handleSelect = (date) => {
    const isSelected = schedule.days.some((s) => dayjs(date).isSame(s, 'date'));
    if (isSelected) {
      setSchedule((current) => ({...current, days: current.days.filter((d) => !dayjs(d).isSame(date, 'date'))}));
    } else {
      setSchedule((current) => ({...current, days: [...current.days, date]}));
    }
  };

  const handleTeamClick = (value) => {
    const attrs = JSON.parse(value)
    const isSelected = schedule.teams.some((t) => attrs.id == t.id);
    if (isSelected) {
      // Already selected.
    } else {
      setSchedule((current) => ({...current, teams: [...current.teams, attrs]}));
    }
  }

  const removeTeam = (id) => {
    setSchedule((current) => ({...current, teams: current.teams.filter((t) => t.id != id)}));
  }

  useEffect(() => {
    setTeamBadges(
      schedule.teams.map((team, i) => {
        return (
          <Badge pr={0} mr="xs" mb="xs" key={i} variant='filled' color="gray.2" size="lg" radius="xl">
            <Flex gap={4}>
              <Text sx={{textTransform: "none", fontWeight: "400", color: "#000"}}>{team.name}</Text>
              <CloseButton
                onMouseDown={() => removeTeam(team.id)}
                variant="transparent"
                size={22}
                iconSize={14}
                tabIndex={-1}
              />
            </Flex>
          </Badge>
        )
      })
    )
  }, [schedule.teams])


  const formRules = {
    title: [
      (value) => (value.length ? null : 'Title is required. '),
    ],
    teams: [
      (value) => (value.length ? null : 'Teams are required. '),
    ],
    start: [
      (value) => (value.length ? null : 'Start time is required. '),
    ],
    end: [
      (value) => (value.length ? null : 'End time is required. '),
    ],
    days: [
      (value) => (value.length ? null : 'Dates are required. '),
    ],
    location: [
      (value) => (value.length ? null : 'Location is required. '),
    ],
  }

  const handleSubmit = () => {
    let errors = { 
      hasErrors: false 
    }
    for (let field in formRules) {
      for (let [index, rule] of formRules[field].entries()) {
        // Exec the rule against the data.
        let error = rule(schedule[field])
        if (error) {
          errors.hasErrors = true
          let fieldErrors = []
          if (Object.hasOwn(errors, field)) {
            // There are existing errors for this field.
            fieldErrors = errors[field]
          }
          fieldErrors.push(error)
          errors = {...errors, ...{[field] : fieldErrors} }
        }
      }
    }
    setErrors(errors)
    if (errors.hasErrors) {
      return
    }

    //Submit, wait for result before closing.
    let formData = JSON.parse(JSON.stringify({...schedule}))
    formData.days = formData.days.map((date) => {
      return dayjs(date).format('YYYY-MM-DD')
    })
    //console.log(formData)
    submitAjax({
      method: "POST", 
      body: {
        methodname: 'local_teamup-post_schedule',
        args: formData,
      }
    })
  }

  useEffect(() => {
    if (!submitError && submitResponse) {
      setSchedule({...defaultSchedule})
      submitted()
    }
    if (submitError) {
      setErrors({hasErrors: false, submit: "There was an error submitting. " + submitResponse.exception.message})
    }
  }, [submitResponse])

  return (
    <Modal 
      opened={opened} 
      onClose={close} 
      title="Create schedule" 
      size="xl" 
      styles={{
        header: {
          borderBottom: '0.0625rem solid #dee2e6',
        },
        title: {
          fontWeight: 600,
        }
      }}
      >
        <Box pt="lg" px="lg">

          <Grid gutter="lg">

            <Grid.Col span={12}>
              <TextInput
                label="Title"
                error={errors.title}
                value={schedule.title}
                placeholder="14's Footy Training"
                onChange={(e) => setSchedule((current) => ({...current, title: e.target.value}))}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <Text fz="sm" mb="5px" weight={500} color="#212529">Select teams</Text>
              <Flex>{teamBadges}</Flex>
              {errors.teams ? <Text mb={5} fz={12} c="red" sx={{wordBreak: "break-all"}}>{errors.teams}</Text> : ''}
              <Paper radius="sm" px="md" sx={{border: "0.0625rem solid #dee2e6"}}>
                <TeamBrowser category={opened ? -1 : false} callback={handleTeamClick} showCheckbox={false} />
              </Paper>
            </Grid.Col>

            <Grid.Col xs={12} sm={6}>
              <TimeInput
                label="Start time"
                value={schedule.start}
                error={errors.start}
                onChange={(e) => setSchedule((current) => ({...current, start: e.target.value}))}
                ref={startRef}
                rightSection={
                  <ActionIcon onClick={() => startRef.current.showPicker()}>
                    <IconClock size="1rem" stroke={1.5} />
                  </ActionIcon>
                }
              />
            </Grid.Col>

            <Grid.Col xs={12} sm={6}>
              <TimeInput
                label="End time"
                value={schedule.end}
                error={errors.end}
                onChange={(e) => setSchedule((current) => ({...current, end: e.target.value}))}
                ref={endRef}
                rightSection={
                  <ActionIcon onClick={() => endRef.current.showPicker()}>
                    <IconClock size="1rem" stroke={1.5} />
                  </ActionIcon>
                }
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <Text fz="sm" mb="5px" weight={500} color="#212529">Occurs on these dates</Text>
              {errors.days ? <Text mb={5} fz={12} c="red" sx={{wordBreak: "break-all"}}>{errors.days}</Text> : ''}
              <Calendar
                getDayProps={(date) => ({
                  selected: schedule.days.some((s) => dayjs(date).isSame(s, 'date')),
                  onClick: () => handleSelect(date),
                })}
              />
            </Grid.Col>


            <Grid.Col span={12}>
              <TextInput
                label="Location"
                value={schedule.location}
                error={errors.location}
                onChange={(e) => setSchedule((current) => ({...current, location: e.target.value}))}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <Textarea
                label="Description"
                value={schedule.details}
                onChange={(e) => setSchedule((current) => ({...current, details: e.target.value}))}
              />
            </Grid.Col>

          </Grid>

          {errors.hasErrors ? 
            <Text mt="xs" c="red" sx={{wordBreak: "break-all"}}>Correct form errors and try again.</Text> 
            : ''
          }
          {errors.submit ? <Text mt="xs" c="red" sx={{wordBreak: "break-all"}}>{errors.submit}</Text> : ''}


          <Flex pt="sm" justify="end">
            <Button onClick={handleSubmit} loading={submitLoading} disabled={errors.length} type="submit" radius="xl" >Submit</Button>
          </Flex>

        </Box>
    </Modal>
  );
};