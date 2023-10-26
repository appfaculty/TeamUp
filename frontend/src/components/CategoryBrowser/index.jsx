import { LoadingOverlay, Checkbox, Group, Stack, Text, UnstyledButton, Box, Breadcrumbs, Anchor, Flex } from "@mantine/core";
import { IconFolderFilled } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { fetchData } from 'src/utils/index'

export function CategoryBrowser({category, callback}) {

  useEffect(() => {
    openCat(category)
  }, [category]);

  const [dirCache, setDirCache] = useState({})

  const decorateChildren = (item) => ({
    value: JSON.stringify({id: item.id, name: item.name}),
    type: item.type,
    label: item.name,
  })

  const decoratePath = (item, i) => (
    <Anchor key={i} onClick={() => handleItemSelect(JSON.stringify({id: item.id, name: item.name}))}>
      {item.name}
    </Anchor>
  )

  const [dirInfo, setDirInfo] = useState({});
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
    response.data.children = response.data.children.filter((child) => (child.type == 'category'))
    response.data.children = response.data.children.map(decorateChildren)
    response.data.breadcrumbs = response.data.path.map(decoratePath)
    setDirInfo(response.data)
    setIsLoading(false)
    setDirCache((current) => ({...current, [cat]: response.data}))
  };

  const handleItemSelect = (value) => {
      openCat(JSON.parse(value).id)
      callback(value)
  };

  return (
    <Box pos="relative" mih={50}>
      <LoadingOverlay visible={isLoading} overlayBlur={2} />
      {dirInfo.breadcrumbs && dirInfo.breadcrumbs.length
        ? <Flex justify="start" align="center" wrap="wrap" gap="sm" pt="sm" pb="sm" sx={{borderBottom: "0.0625rem solid #dee2e6"}}>
            <Breadcrumbs fz="sm">{dirInfo.breadcrumbs}</Breadcrumbs>
            / <Text tt="capitalize" fz="sm" fw={600}>{dirInfo.name}</Text>
          </Flex>
        : null
      }
      <Stack pb="xs" spacing={0}>
        {dirInfo.children && dirInfo.children.map((item, i) => (
          <UnstyledButton 
            key={i} 
            onClick={() => handleItemSelect(item.value)}
            fz="sm"
            py={5}
            sx={{borderBottom: "0.0625rem solid #dee2e6"}}
            >
            <Group>
              <IconFolderFilled size={17} />
              <Text>{item.label}</Text>
            </Group>
          </UnstyledButton>
        ))}
      </Stack>
    </Box>
  );
};