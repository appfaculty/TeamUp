import { Box, Button, Card, Center, Text } from "@mantine/core";
import { QRCodeCanvas } from "qrcode.react";
import { useRef } from "react";

export function QRCode({value}) {

  const qrRef = useRef();

  const downloadQRCode = () => {
    let canvas = qrRef.current.querySelector("canvas");
    let image = canvas.toDataURL("image/png");
    let anchor = document.createElement("a");
    anchor.href = image;
    anchor.download = `QRCode.png`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const qrcode = (
    <QRCodeCanvas
      id="qrCode"
      value={value}
      size={265}
      bgColor={"#ffffff"}
      fgColor={"#000000"}
      level={"H"}
      includeMargin={true}
    />
  );

  return (
    <Card withBorder radius="sm" pb="xl">
      <Card.Section withBorder p="md">
        <Text size="md" weight={500}>Your QR Code</Text>
      </Card.Section>
      <Card.Section>
        <Center>
          <Box 
            ref={qrRef}
          >
            {qrcode}
          </Box>
        </Center>
        <Center pb="sm">
          <Button onClick={downloadQRCode} radius="xl" >Download QR Code</Button>
        </Center>
      </Card.Section>
    </Card>
  )

}

