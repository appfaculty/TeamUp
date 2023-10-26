import { Fragment, useState, forwardRef, useEffect } from "react";
import { Group, Avatar, Text, MultiSelect, Loader, Badge, Flex, CloseButton } from '@mantine/core';
import { fetchData } from 'src/utils/index'
import { IconUser, IconUsers } from '@tabler/icons-react';

export function StudentSelector({students, setStudents}) {

  const decorateUser = (item) => ({
    value: JSON.stringify({ un: item.un, fn: item.fn, ln: item.ln }), // What we'll send to the server for saving.
    label: item.fn + " " + item.ln,
    username: item.un,
    image: '/local/platform/avatar.php?username=' + item.un
  })

  useEffect(() => {
    const initialData = students.map((item) => decorateUser(JSON.parse(item)));
    setSearchResults(initialData)
  }, [students])

  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchStudents = async (text) => {
    if (!text.length) {
      return;
    }
    setIsLoading(true);
    const response = await fetchData({
      query: {
        methodname: 'local_teamup-search_students',
        text: text,
      }
    })
    const data = response.data.map(decorateUser);
    setSearchResults(data)
    setIsLoading(false)
  };

  const handleChange = (values) => {
    setStudents(values)
  };

  const MultiSelectItem = forwardRef(({ label, username, image, ...others }, ref) => {
    return (
      <div ref={ref} {...others}>
        <Group noWrap spacing="xs">
          <Avatar alt={label} size={24} mr={5} src={image} radius="xl"><IconUser size={14} /></Avatar>
          <Text>{label} ({username})</Text>
        </Group>
      </div>
    )
  });

  function MultiSelectValue({value, label, onRemove, classNames, ...others}) {
    return (
      <div {...others}>
        <Badge variant='filled' p={0} color="gray.2" size="lg" radius="xl" leftSection={
          <Avatar alt={label} size={24} mr={5} src={others.image} radius="xl"><IconUser size={14} /></Avatar>
        }>
          <Flex gap={4}>
            <Text sx={{textTransform: "none", fontWeight: "400", color: "#000"}}>
              {label}
            </Text>
            <CloseButton
              onMouseDown={onRemove}
              variant="transparent"
              size={22}
              iconSize={14}
              tabIndex={-1}
            />
          </Flex>
        </Badge>
      </div>
    );
  };

  return (
    <Fragment>
      <MultiSelect 
        icon={<IconUsers size={18} />}
        placeholder="Search students"
        itemComponent={MultiSelectItem}
        valueComponent={MultiSelectValue}
        limit={8}
        rightSection={isLoading ? <Loader size="xs" /> : ''}
        data={searchResults}
        searchable
        onSearchChange={(value) => searchStudents(value)}
        onChange={handleChange}
        value={students}
        clearSearchOnChange={true}
        shadow="lg"
        dropdownPosition="bottom"
        styles={{value: {display:"flex"}, values: {paddingTop:"0.12rem", paddingBottom:"0.12rem"}}}
        filter={(value, selected, item) => {
          return (value 
            ? (!selected && item.label.toLowerCase().includes(value.toString().toLowerCase().trim()))
            : false
          )
        }}
      />
    </Fragment>
  );
};