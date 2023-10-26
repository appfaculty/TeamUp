import { Fragment, useEffect } from "react";

import { Header } from "../../components/Header/index.jsx";
import { Footer } from "../../components/Footer/index.jsx";
import { Box, Container } from '@mantine/core';
import { Grid } from '@mantine/core';
import { YourTeams } from "./components/YourTeams/index.jsx";
import { QRCode } from "./components/QRCode/index.jsx";
import { Messages } from "./components/Messages/index.jsx";
import { TeamManager } from "./components/TeamManager/index.jsx";
import { Calendar } from "./components/Calendar/index.jsx";
import { getConfig } from "../../utils/index.js";
import { OnToday } from "./components/OnToday/index.jsx";


export function Dashboard() {

  useEffect(() => {
    document.title = 'Teams Dashboard';
  }, []);

  const qrValue = getConfig().user.un + "," + getConfig().user.fn + " " + getConfig().user.ln

  return (
    <Fragment>
      <Header />
      <div className="page-wrapper">
        <div>
          <Container size="xl" mt={50} mb="xl">
            <Grid grow>
              <Grid.Col lg={9}>
                <Calendar />
              </Grid.Col>
                <Grid.Col lg={3}>
                  <Box>
                    <Grid grow>

                      <Grid.Col xs={12} sm={6} lg={12}>
                        <OnToday />
                      </Grid.Col>

                      <Grid.Col xs={12} sm={6} lg={12}>
                        <YourTeams />
                      </Grid.Col>
                      
                      <Grid.Col xs={12} sm={6} lg={12}>
                        <Messages />
                      </Grid.Col>
                      
                      { getConfig().roles.includes('student') &&
                        <Grid.Col xs={12} sm={6} lg={12}>
                          <QRCode value={qrValue} />
                        </Grid.Col>
                      }

                      { getConfig().roles.includes('manager') &&
                        <Grid.Col xs={12} sm={6} lg={12}>
                          <TeamManager />
                        </Grid.Col>
                      }
                    </Grid>
                    
                  </Box>
                </Grid.Col>
            </Grid>
          </Container>
        </div>
      </div>
      <Footer />
    </Fragment>
  );
};