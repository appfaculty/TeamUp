import { Fragment, useState, useRef, useEffect } from "react";
import { Group, Text, useMantineTheme, Badge, ActionIcon, Button, Progress, Flex, TextInput } from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE, PDF_MIME_TYPE, MS_WORD_MIME_TYPE, MS_EXCEL_MIME_TYPE, MS_POWERPOINT_MIME_TYPE } from '@mantine/dropzone';
import { IconUpload, IconX, IconCloudUpload  } from '@tabler/icons-react';
import { getConfig } from 'src/utils/index'
import { useDocumentsStore } from '../../../../store/formFieldsStore'

export function FileUploader ({inputName, title, desc, maxFiles, maxSize}) {
  const theme = useMantineTheme();
  const openRef = useRef();
  
  const existingfiles = useDocumentsStore((state) => state['existing'+inputName])
  const setState = useDocumentsStore(state => state.setState)
  const [fileData, setFileData] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState([]);


  // Add existing files to control.
  useEffect(() => {
    if (!existingfiles.length) {
      setPreviews([])
      return
    }
    // Ensure that existing data is only added to control once. Don't add duplicates.
    const uniqueExisting = existingfiles.filter(function (file) {
      // Search for matching file already in fileData.
      return !fileData.find(obj => {
        return obj.serverfilename === file.serverfilename
      })
    })
    const currPosition = fileData.length;
    const dressedExistingFiles = uniqueExisting.map((file, index) => {
      // Create a filedata obj for any newly added files.
      return {
        index: currPosition + index,
        displayname: file.displayname,
        file: null,
        started: true,
        completed: true,
        removed: false,
        serverfilename: file.serverfilename,
        existing: true,
        key: file.fileid,
      };
    })
    // Append the dropped files to the fileData array.
    const allFileData = [...fileData, ...dressedExistingFiles]
    setFileData(allFileData)
  }, [existingfiles])

  // Append dropped files.
  const handleDrop = (droppedFiles) => {
    setError('')
    const currPosition = fileData.length;

    const countActive = fileData.filter((file) => !file.removed).length;
    if (countActive >= maxFiles) {
      setError(maxFiles + ' file' + (maxFiles > 1 ? 's' : '') + ' is the maximum you can add here');
      return
    }

    // Remove any duplicates.
    const cleanDroppedFiles = droppedFiles.filter(function (file) {
      // Search for fileData with key that matches this droppedFiles name.
      return !fileData.find(obj => {
        return obj.displayname === file.name
      })
    })

    const droppedFileData = cleanDroppedFiles.map((file, index) => {
      // Create a filedata obj for any newly added files.
      return {
        index: currPosition + index,
        displayname: file.name,
        file: file,
        progress: 0,
        started: false,
        completed: false,
        removed: false,
        serverfilename: '',
        existing: false,
        key: '',
      };
    })

    // Append the dropped files to the fileData array.
    const allFileData = [...fileData, ...droppedFileData]
    setFileData(allFileData)
  }

  // Side effect of new files being added.
  useEffect(() => {
    // Do not proceed with empty.
    if (!fileData.length) {
      setFileData([])
      return
    }

    // Check if any uploads are new/not started.
    const waiting = fileData.find(file => file.started === false)
    if (waiting === undefined) {
      return
    }

    //console.log("Starting uploads")
    // Start upload for any newly added files.
    let fileDataCopy = [...fileData];
    for (let i = 0; i < fileDataCopy.length; i++) {
      if (!fileDataCopy[i].started) {
        uploadFile(fileDataCopy[i])
        fileDataCopy[i].started = true
      }
    }
    setFileData([...fileDataCopy]);
  }, [fileData]);


  const uploadFile = (file) => {
    const formData = new FormData();
    formData.append('file', file.file)
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = e => {
      let f = {...file};
      if (e.lengthComputable) {
        if (!f.completed) {
          const progress = Math.ceil(((e.loaded) / e.total) * 100);
          f.progress = progress;
          setFileProgress(f);
        }
      }
    };
    xhr.onreadystatechange = () => {
      let f = {...file};
      if (xhr.readyState !== 4) {
        return;
      }
      if (xhr.status !== 200) {
        console.log('Error' + xhr.status);
      }
      if (xhr.readyState == XMLHttpRequest.DONE) {
        const data = JSON.parse(xhr.responseText);
        f.progress = 100;
        f.completed = true;
        f.serverfilename = data.name;
        f.key = data.name;
        setFileProgress(f);
      }
    };
    const url = getConfig().wwwroot + '/local/platform/upload.php?upload=1&sesskey=' + getConfig().sesskey;
    xhr.open('POST', url); //'https://httpbin.org/post');
    xhr.send(formData)
    //console.log("Kicked off upload...")
  }
  
  const setFileProgress = (file) => {
    //console.log("Setting file progress");
    // File upload progressed. Update filedata which will trigger badge re-render.
    setFileData(prevFileData => {
      let fileDataCopy = [...prevFileData]
      if (fileDataCopy[file.index].started && (file.completed || fileDataCopy[file.index].progress < file.progress)) {
        // Replace this file obj.
        fileDataCopy[file.index] = {...file}
      }
      return fileDataCopy
    });
  }


  /***************
   * Handle Previews
   * *************/
  const handleRemove = (deleteIndex) => {
    setError('')
    // Remove the file from fileData.
    setFileData(fileData => {
      let copy = [...fileData]
      for (let i = 0; i < copy.length; i++) {
        if (copy[i].index == deleteIndex) {
          // Remove the temp file from server.
          if (!copy[i].existing && copy[i].completed && copy[i].serverfilename) {
            const url = getConfig().wwwroot + '/local/platform/upload.php?remove=1&fileid=' + copy[i].serverfilename + "&sesskey=" + getConfig().sesskey
            const xhr = new XMLHttpRequest()
            xhr.open("GET", url)
            xhr.send()
          }
          copy[i] = { ...copy[i], displayname: null, file: null, started: true, completed: true, removed: true, serverfilename: '' }
        } 
      }
      return copy
    });
  }

  const removeButton = (index) => (
    <ActionIcon size="xs" color="white" radius="xl" variant="transparent" onClick={() => { handleRemove(index) }}>
      <IconX size="10rem" />
    </ActionIcon>
  );

  // Another side effect of fileData changing during upload process.
  useEffect(() => {
    // Do not proceed with empty.
    if (!fileData.length) {
      return
    }

    // Generate new previews.
    const newPreviews = fileData.map((file, index) => {
      if (file.existing) {
        return false;
      }
      if (file.removed) {
        return false;
      }
      const color = file.completed ? "teal" : "gray";
      return (
        <Badge variant="filled" color={color} size="lg" pr={3} rightSection={removeButton(file.index)} key={file.index} sx={{boxShadow: theme.shadows.xs}}>
          <Flex gap={0} justify="flex-start" align="flex-start" direction="column">
            <Text tt="none">{file.displayname}</Text>
            { file.progress == 100 ? '' : <Progress size="xs" value={file.progress} w="100%" /> }
          </Flex>
        </Badge>
      )
    })
    const newWithoutEmpties = newPreviews.filter(badge => badge)

    const existingPreviews = fileData.map((file, index) => {
      if (!file.existing) {
        return false;
      }
      if (file.removed) {
        return false;
      }
      return (
        <Badge variant="filled" color="teal" size="lg" pr={3} rightSection={removeButton(file.index)} key={file.index} sx={{boxShadow: theme.shadows.xs}}>
          <Flex gap={0} justify="flex-start" align="flex-start" direction="column">
            <Text tt="none">{file.displayname}</Text>
          </Flex>
        </Badge>
      )
    })
    const existingWithoutEmpties = existingPreviews.filter(badge => badge)


    setPreviews([...existingWithoutEmpties, ...newWithoutEmpties]);
  }, [fileData]);


  /***************
   * Handle Filenames
   * *************/
  // Another side effect of fileData changing during upload process.
  useEffect(() => {
    // Do not proceed with empty.
    if (!fileData.length) {
      return
    }
    // Generate new filenames.
    //const onlyCompleted = fileData.filter(file => file.completed && !file.removed)
    const filenames = fileData.map((file, index) => {
      //console.log(file)
      let action = null
      if (file.existing) {
        action = file.removed ? "REMOVED" : "EXISTING"
      } else {
        action = file.completed && !file.removed ? "NEW" : null
      }
      return action ? action + '::' + file.key : null
    });
    const withoutEmpties = filenames.filter(instruct => instruct)
    setState({[inputName]: withoutEmpties.join(',')});
  }, [fileData]);

  return (
    <Fragment>
      <Dropzone
        accept={[IMAGE_MIME_TYPE, PDF_MIME_TYPE, MS_WORD_MIME_TYPE, MS_EXCEL_MIME_TYPE, MS_POWERPOINT_MIME_TYPE]}
        onDrop={handleDrop}
        onReject={(files) => {
          setError(
            files.map(
              file => file.errors.map(error => {
                return error.message.includes('File type must be') ? 'File type must be image, pdf, word, excel, or powerpoint' : error.message
              })
              .join(". ")
            )
            .filter((item, i, allItems) => {
              return i === allItems.indexOf(item);
            })
            .join(". ")
          );
        }}
        maxSize={maxSize * 1024 ** 2}
        maxFiles={maxFiles}
        openRef={openRef}
        activateOnClick={false}
        styles={{ inner: { pointerEvents: 'all' } }}
        sx={{
          cursor: "default", 
          borderWidth: "1px", 
          textAlign: "center", 
          backgroundColor: "#f4f6f8", 
          //'&:hover':{backgroundColor: "white"}
        }}
      >
        <div>
          <Group position="center">
            <Dropzone.Accept>
              <IconUpload
                size="2.2rem"
                stroke={1.5}
                color={theme.colors[theme.primaryColor][theme.colorScheme === 'dark' ? 4 : 6]}
              />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconX
                size="2.2rem"
                stroke={1.5}
                color={theme.colors.red[theme.colorScheme === 'dark' ? 4 : 6]}
              />
            </Dropzone.Reject>
            <Dropzone.Idle>
            </Dropzone.Idle>
          </Group>
          
          <Text color="dimmed" size="sm" mb={10} >{desc}</Text>
          <Button compact radius="xl"  onClick={() => openRef.current()}>Select file{maxFiles > 1 ? 's' : ''}</Button>
          {error.length ? <Text mt="xs" color="red" sx={{wordBreak: "break-all"}}>{error}</Text> : ''}
        </div>
      </Dropzone>

      <Group position="left" mt={previews.length > 0 ? 'sm' : 0} spacing="xs">
        {previews}
      </Group>
    </Fragment>
  );
};