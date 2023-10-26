
import { Box, Button, Flex, Grid, Modal, Text, TextInput, Textarea } from '@mantine/core';
import { useAjax } from '../../../../hooks/useAjax';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';



export function EditMessageModal({data, opened, close}) {
  
  const [message, setMessage] = useState({})
  useEffect(() => {
    setMessage({
      subject: data.subject,
      message: data.bodyplain,
    })
  }, [data])

  const [errors, setErrors] = useState([])
  const [submitResponse, submitError, submitLoading, submitAjax] = useAjax(); // destructure state and fetch function
  const formRules = {
    subject: [
      (value) => (value.length ? null : 'Title is required. '),
    ],
    message: [
      (value) => (value.length ? null : 'Message is required. '),
    ],
  }
  const onSubmit = () => {
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
    setErrors(errors)
    if (errors.hasErrors) {
      return
    }
    //Submit, wait for result before closing.
    let formData = JSON.parse(JSON.stringify({...message}))
    formData.id = data.id,
    //console.log(formData)
    submitAjax({
      method: "POST", 
      body: {
        methodname: 'local_teamup-edit_message',
        args: formData,
      }
    })
  }
  const navigate = useNavigate()
  useEffect(() => {
    if (!submitError && submitResponse) {
      navigate(0)
      close()
    }
    if (submitError) {
      let err = "There was an error submitting. " + submitResponse.exception !== undefined ? submitResponse.exception.message : ''
      setErrors({hasErrors: false, submit: err})
    }
  }, [submitResponse])
  
  return (
    <Modal 
      title="Edit message"
      opened={opened} 
      onClose={close}
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
              label="Subject"
              error={errors.subject}
              value={message.subject}
              onChange={(e) => setMessage((current) => ({...current, subject: e.target.value}))}
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <Textarea
              label="Message"
              autosize
              minRows={4}
              maxRows={10}
              error={errors.message}
              value={message.message}
              onChange={(e) => setMessage((current) => ({...current, message: e.target.value}))}
            />
          </Grid.Col>
        </Grid>
          {errors.hasErrors ? 
            <Text mt="xs" c="red" sx={{wordBreak: "break-all"}}>Correct form errors and try again.</Text> 
            : ''
          }
          {errors.submit ? <Text mt="xs" c="red" sx={{wordBreak: "break-all"}}>{errors.submit}</Text> : ''}
          <Flex pt="sm" justify="end">
            <Button onClick={onSubmit} loading={submitLoading} disabled={errors.length} type="submit" radius="xl" >Submit</Button>
          </Flex>
      </Box>
    </Modal>
  );
};