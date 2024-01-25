"use client";

import {Image, Space, Typography} from 'antd';

const {Title, Text, Link} = Typography;

export default function RaycastExtensionContent() {
  return (
    <div>
      <Space direction="vertical">
        <Title>RayCast Extension: Shortcuts Search</Title>
        <Image.PreviewGroup>
          <Space direction="horizontal" wrap={true}>
            <Image alt="List of all aps in Raycast extension" width={380} src="media/shortcuts-search-1.png"/>
            <Image alt="App search in Raycast extension" width={380} src="media/shortcuts-search-2.png"/>
            <Image alt="Application specific shortcuts in Raycast extension" width={380} src="media/shortcuts-search-3.png"/>
            <Image alt="Shortcut sarch in Raycast extension" width={380} src="media/shortcuts-search-4.png"/>
          </Space>
        </Image.PreviewGroup>
        <Text><Link href="https://www.raycast.com" target="_blank">RayCast</Link> is a productivity tool,
          basically Spotlight on steroids.</Text>
        <Text>Allows to list, search and run shortcuts for different applications.</Text>
        <Text>By selecting shortcut extension actually runs the shortcut using AppleScript.</Text>
        <Text>You can download extension from the <Link
          href="https://www.raycast.com/solomkinmv/shortcuts-search" target="_blank">RayCast
          Store</Link>.</Text>
        <a title="Install shortcuts-search Raycast Extension"
           href="https://www.raycast.com/solomkinmv/shortcuts-search"
           style={{
             display: "flex",
             justifyContent: "center"
           }}>
          <img
            src="https://www.raycast.com/solomkinmv/shortcuts-search/install_button@2x.png?v=1.1"
            height="64"
            alt="" style={{
            height: "64px"
          }}/>
        </a>
      </Space>
    </div>
  );
}
