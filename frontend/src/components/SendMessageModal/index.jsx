
import { Avatar, Badge, Box, Button, Checkbox, CloseButton, Flex, Group, Modal, Paper, ScrollArea, Text, TextInput, Textarea, Transition } from '@mantine/core';
import { useEffect, useState } from 'react';
import { IconCheck, IconSend, IconUser } from '@tabler/icons-react';
import { useAjax } from '/src/hooks/useAjax';
import { useTimeout } from '@mantine/hooks';
import { TeamBrowser } from '/src/components/TeamBrowser/index.jsx';

export function SendMessageModal({opened, close, students, teamid}) {
  const defaultMessage = {
    teams: [],
    notify: ['students'],
    subject: '',
    message: '',
  }
  const [message, setMessage] = useState(defaultMessage)
  const [teamBadges, setTeamBadges] = useState([])
  const [recipients, setRecipients] = useState(students)
  const [errors, setErrors] = useState([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [submitResponse, submitError, submitLoading, submitAjax] = useAjax();
  const {start, clear} = useTimeout(() => close(), 3000);
  const formRules = {
    subject: [
      (value) => (value.length ? null : 'Title is required. '),
    ],
    message: [
      (value) => (value.length ? null : 'Message is required. '),
    ],
    teams: [
      (value) => (!teamid && !value.length ? 'Teams are required. ' : null),
    ],
  }
  useEffect(() => {
    if (opened) {
      setMessage(defaultMessage)
      setShowSuccess(false)
    }
  }, [opened])

  useEffect(() => {
    setRecipients(students)
  }, [students])

  const validateForm = () => {
    let errors = { 
      hasErrors: false 
    }
    for (let field in formRules) {
      for (let [index, rule] of formRules[field].entries()) {
        // Exec the rule against the data.
        let error = rule(message[field])
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
    return errors;
  }

  const onSubmit = () => {
    setErrors([])
    const errors = validateForm()
    if (errors.hasErrors) {
      setErrors(errors)
      return
    }
    let formData = JSON.parse(JSON.stringify({...message}))
    if (teamid) {
      // Single team messaging.
      formData.students = recipients.map((student) => (student.un))
      formData.teams = [teamid]
    } else {
      // Team selection.
      formData.students = []
      formData.teams = formData.teams.map(team => team.id)
    }
    console.log(formData)
    submitAjax({
      method: "POST", 
      body: {
        methodname: 'local_teamup-submit_message',
        args: formData,
      }
    })
  }
  useEffect(() => {
    if (!submitError && submitResponse) {
      setShowSuccess(true)
      start()
    }
    if (submitError) {
      let err = "There was an error submitting. " + submitResponse.exception !== undefined ? submitResponse.exception.message : ''
      setErrors({hasErrors: false, submit: err})
    }
  }, [submitResponse])

  const success = (
    <Transition mounted={showSuccess} transition="fade" duration={500} timingFunction="ease">
      {(styles) => 
        <Flex mb="xl" direction="column" align="center" style={{ ...styles }}>
          <IconCheck size={45} color="green"/>
          <Text fz="md">Success! Your message has been posted and notifications are being sent.</Text>
        </Flex> 
      }
    </Transition>
  )

  const onRemove = (username) => {
    setRecipients( 
      (current) => current.filter(function( student ) {
        return student.un !== username;
      })
    )
  }

  const student = (data) => {
    return (
        <Badge key={data.un} variant='filled' p={0} color="gray.2" size="lg" radius="xl" leftSection={
          <Avatar alt={data.fn + " " + data.ln} size={24} mr={5} src={'/local/platform/avatar.php?username=' + data.un} radius="xl"><IconUser size={14} /></Avatar>
        }>
          <Flex gap={4}>
            <Text sx={{textTransform: "none", fontWeight: "400", color: "#000"}}>
              {data.fn + " " + data.ln}
            </Text>
            <CloseButton
              onMouseDown={() => onRemove(data.un)}
              variant="transparent"
              size={22}
              iconSize={14}
              tabIndex={-1}
            />
          </Flex>
        </Badge>
    )
  }

  const handleTeamClick = (value) => {
    const attrs = JSON.parse(value)
    const isSelected = message.teams.some((t) => attrs.id == t.id)
    if (!isSelected) {
      setMessage((current) => ({...current, teams: [...current.teams, attrs]}));
    }
  }
  const removeTeam = (id) => {
    setMessage((current) => ({...current, teams: current.teams.filter((t) => t.id != id)}));
  }
  useEffect(() => {
    setTeamBadges(
      message.teams.map((team, i) => {
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
  }, [message.teams])


  const messageForm = (
    <Box>
      { teamid
        ? <Box mb="md">
            <Text fz="sm" mb={5} weight={500} color="#212529">Students</Text>
            <ScrollArea h={recipients.length > 12 ? 100 : 'auto'} type="auto">
              <Group spacing="xs">
                { recipients.map(item => student(item)) }
              </Group>
            </ScrollArea>
          </Box>
        : <Box mb="md">
            <Text fz="sm" mb={5} weight={500} color="#212529">Select teams</Text>
            <Flex>{teamBadges}</Flex>
            {errors.teams ? <Text mb={5} fz={12} c="red" sx={{wordBreak: "break-all"}}>{errors.teams}</Text> : ''}
            <Paper radius="sm" px="md" sx={{border: "0.0625rem solid #dee2e6"}}>
              <TeamBrowser category={opened ? -1 : false} callback={handleTeamClick} showCheckbox={false} />
            </Paper>
          </Box>
      }

      <TextInput
        label="Subject"
        error={errors.subject}
        value={message.subject}
        onChange={(e) => setMessage((current) => ({...current, subject: e.target.value}))}
        mb="md"
      />
      
      <Textarea
        label="Message"
        autosize
        minRows={4}
        maxRows={10}
        error={errors.message}
        value={message.message}
        onChange={(e) => setMessage((current) => ({...current, message: e.target.value}))}
        mb="md"
      />

      <Box mb="md">
        <Text fz="sm" mb={5} fw={500}>Recipients</Text>
        <Checkbox.Group
          value={message.notify}
          onChange={(e) => setMessage((current) => ({...current, notify: e}))}
        >
          <Flex mt="xs" gap="xs" direction="column">
            <Checkbox value="students" label="Students" />
            <Checkbox value="parents" label="Parents" />
            <Checkbox value="teamstaff" label="Coaches/Assistants" />
          </Flex>
        </Checkbox.Group>
      </Box>
            
      {errors.hasErrors ? 
        <Text mt="xs" c="red" sx={{wordBreak: "break-all"}}>Correct form errors and try again.</Text> 
        : ''
      }
      {errors.submit ? <Text mt="xs" c="red" sx={{wordBreak: "break-all"}}>{errors.submit}</Text> : ''}
      <Flex pt="sm" justify="end">
        <Button leftIcon={<IconSend size="1rem" />} onClick={onSubmit} loading={submitLoading} disabled={errors.length} type="submit" radius="xl" >Submit</Button>
      </Flex>
    </Box>
  )

  return (
    <Modal 
      opened={opened} 
      onClose={close} 
      title="Send message" 
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
        <Box pt="md">
          { showSuccess
            ? success
            : messageForm
          }
        </Box>
    </Modal>
  );
};