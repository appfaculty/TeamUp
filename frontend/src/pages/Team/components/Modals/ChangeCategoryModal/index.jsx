
import { Box, Button, Flex, Modal, Tabs } from '@mantine/core';
import { useState } from 'react';
import { CategorySearch } from '/src/components/CategorySearch';
import { CategoryBrowser } from '/src/components/CategoryBrowser';
import { IconCheck, IconFolderSymlink, IconSearch } from '@tabler/icons-react';

export function ChangeCategoryModal({opened, close, category, callback}) {
  const [newCategory, setNewCategory] = useState(null)

  const selectAndClose = () => {
    callback(newCategory)
    setNewCategory(null)
    close()
  }

  return (
    <Modal 
      opened={opened} 
      onClose={close} 
      title="Select a category" 
      size="xl"
      styles={{
        content: {
          overflowY: 'visible !important',
        },
        header: {
          borderBottom: '0.0625rem solid #dee2e6',
        },
        title: {
          fontWeight: 600,
        }
      }}
      >
        <Box pt="md">
          <Tabs defaultValue="search"  orientation="vertical">
            <Tabs.List>
              <Tabs.Tab value="search" icon={<IconSearch size="0.8rem" />}>Search</Tabs.Tab>
              <Tabs.Tab value="browse" icon={<IconFolderSymlink size="0.8rem" />}>Browse</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="search" px="md" pb="md" mih={150}>
              <CategorySearch callback={setNewCategory} />
            </Tabs.Panel>
            <Tabs.Panel value="browse" px="md" pb="md" mih={150}>
              <CategoryBrowser category={opened ? category : null} callback={setNewCategory} />
            </Tabs.Panel>
          </Tabs>
          <Flex pt="sm" justify="end">
            <Button onClick={selectAndClose} disabled={!newCategory} type="submit" leftIcon={<IconCheck size="1rem" />} radius="xl" >{newCategory ? "Select " + JSON.parse(newCategory).name : "Select category"}</Button>
          </Flex>
        </Box>
    </Modal>
  );
};