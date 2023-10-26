import { LoadingOverlay, Checkbox, Group, Stack, Text, UnstyledButton, Box, Breadcrumbs, Anchor, Flex, Badge } from "@mantine/core";
import { IconFolderFilled } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { fetchData } from 'src/utils/index'

export function TeamBrowser({category, callback, showCheckbox = true}) {

  const [dirCache, setDirCache] = useState({})

  useEffect(() => {
    openCat(category)
  }, [category]);

  const decorateChildren = (item) => ({
    ...item,
    value: JSON.stringify({id: item.id, name: item.name}),
    type: item.type,
    label: item.name,
  })

  const decoratePath = (item, i) => (
    <Anchor key={i} onClick={() => handleItemSelect(JSON.stringify({id: item.id, name: item.name}), 'category')}>
      {item.name}
    </Anchor>
  )

  const [dirInfo, setDirInfo] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const openCat = async (cat) => {
    // If cached, use cache.
    if (dirCache[cat]) {
      setDirInfo(dirCache[cat])
      return
    }
    setIsLoading(true);
    const response = await fetchData({
      query: {
        methodname: 'local_teamup-get_category_dir',
        category: cat ? cat : '-1',
      }
    })
    response.data.children = response.data.children.map(decorateChildren)
    response.data.breadcrumbs = response.data.path.map(decoratePath)
    setDirInfo(response.data)
    setIsLoading(false)
    setDirCache((current) => ({...current, [cat]: response.data}))
  };

  const handleItemSelect = (value, type) => {
    console.log("item clicked: " + value)
    if (type == 'category') {
      setSelectedItem(null)
      openCat(JSON.parse(value).id)
    } else {
      setSelectedItem(JSON.parse(value).id)
      callback(value)
    }
  };

  return (
    <Box pos="relative" mih={50}>
      <LoadingOverlay loaderProps={{size:"sm"}} visible={isLoading} overlayBlur={2} />
      {dirInfo.breadcrumbs && dirInfo.breadcrumbs.length
        ? <Flex justify="start" align="center" wrap="wrap" gap="sm" py="sm" sx={{borderBottom: dirInfo.children.length ? "0.0625rem solid #dee2e6" : "0 none"}}>
            <Breadcrumbs fz="sm">{dirInfo.breadcrumbs}</Breadcrumbs>
            / <Text tt="capitalize" fz="sm" fw={600}>{dirInfo.name}</Text>
          </Flex>
        : null
      }
      <Stack py={5} spacing={0}>
        {dirInfo.children && dirInfo.children.map((item, i) => (
          <UnstyledButton 
            key={i} 
            onClick={() => handleItemSelect(item.value, item.type)}
            fz="sm"
            py="xs"
            sx={{borderBottom: (i + 1 === dirInfo.children.length) ? "0 none" :  "0.0625rem solid #dee2e6"}}
            >
            <Group>
              {item.type == 'category'
              ? <IconFolderFilled size={17} />
              : showCheckbox 
                ? <Checkbox size={15} checked={selectedItem == item.id ? true : false} onChange={() => {}}/>
                : ''
              }
              <Text color={item.type == 'team' ? 'tablrblue' : null}>{item.label}</Text>
            </Group>
          </UnstyledButton>
        ))}
      </Stack>
    </Box>
  );
};