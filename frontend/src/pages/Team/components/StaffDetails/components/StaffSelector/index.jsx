import { Fragment, useState, forwardRef, useEffect } from "react";
import { Group, Avatar, Text, MultiSelect, Loader, Badge, Flex, CloseButton } from '@mantine/core';
import { fetchData } from 'src/utils/index'
import { IconUser, IconUsers } from '@tabler/icons-react';
import { useStaffDetailsStore } from "../../../../store/formFieldsStore";

export function StaffSelector({valueprop, label, max}) {
  const staff = useStaffDetailsStore((state) => state[valueprop])
  const setStaff = useStaffDetailsStore(state => state.setState)
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const decorateStaff = (item) => ({
    value: JSON.stringify({ un: item.un, fn: item.fn, ln: item.ln }), // What we'll send to the server for saving.
    label: item.fn + " " + item.ln,
    username: item.un,
    image: '/local/platform/avatar.php?username=' + item.un
  })

  useEffect(() => {
    const initialData = staff.map((item) => decorateStaff(JSON.parse(item)));
    setSearchResults(initialData)
  }, [staff])


  const loadStaff = async (text) => {
    if (!text.length) {
      return;
    }
    setIsLoading(true);
    const response = await fetchData({
      query: {
        methodname: 'local_teamup-search_staff',
        text: text,
      }
    })
    const data = response.data.map(decorateStaff);
    const usernames = new Set(searchResults.map(u => u.username));
    const merged = [...searchResults, ...data.filter(u => !usernames.has(u.username))];
    setSearchResults(merged)
    setIsLoading(false)
  };

  const handleChange = (values) => {
    setStaff({[valueprop]: values})
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
        icon={max == 1 ? <IconUser size={18} /> : <IconUsers size={18} />}
        maxSelectedValues={max}
        label={label}
        placeholder="Search staff"
        itemComponent={MultiSelectItem}
        valueComponent={MultiSelectValue}
        limit={8}
        rightSection={isLoading ? <Loader size="xs" /> : ''}
        data={searchResults}
        searchable
        onSearchChange={(value) => loadStaff(value)}
        onChange={handleChange}
        value={staff}
        clearSearchOnChange={true}
        shadow="lg"
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