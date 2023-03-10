import {
  Toast,
  useAppBridge,
  useAuthenticatedFetch,
} from '@shopify/app-bridge-react';
import { ChevronDownMinor, ChevronUpMinor } from '@shopify/polaris-icons';
import {
  AlphaStack,
  Badge,
  Button,
  Collapsible,
  Columns,
  ContextualSaveBar,
  Frame,
  Icon,
  Inline,
  Layout,
  LegacyCard,
  Link,
  List,
  Loading,
  MediaCard,
  Page,
  SkeletonBodyText,
  Text,
  TextField,
  VideoThumbnail,
} from '@shopify/polaris';

import { toAdminPath } from '@shopify/app-bridge/actions/Navigation/Redirect';
import { useState } from 'react';
import { useAppQuery } from '../hooks';
import { videoThumbnail } from '../assets';

const emptyToastProps = {
  content: null,
};

export default function HomePage() {
  const [uiState, setUiState] = useState('loading'); // loading | idle | saving
  const [toastProps, setToastProps] = useState(emptyToastProps);
  const [urlText, setUrlText] = useState('');
  const [isInstructionsOpen, setInstructionsOpen] = useState(false);
  const fetch = useAuthenticatedFetch();
  const app = useAppBridge();

  const handleToggle = () => setInstructionsOpen((open) => !open);

  const { data: appSettingsData, refetch } = useAppQuery({
    url: '/api/app-settings',
    reactQueryOptions: {
      onSuccess: (data) => {
        setUrlText(data.url);
        setUiState('idle');
      },
      onError: () => {
        setToastProps({
          content: 'There was an error loading app settings',
          error: true,
        });
      },
      select: (data) => ({
        ...data,
        url: data.url ?? '',
      }),
    },
  });

  const handleChangeUrl = (value) => setUrlText(value);

  const handleClickSave = async () => {
    setUiState('saving');
    const response = await fetch('/api/app-settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: urlText,
      }),
    });

    await refetch();

    if (response.ok) {
      setToastProps({
        content: 'App settings were saved successfully',
      });
    } else {
      setToastProps({
        content: 'There was an error saving app settings',
        error: true,
      });
    }

    setUiState('idle');
  };

  const handleClickDismiss = () => {
    setUrlText(appSettingsData.url);
  };

  const handleClickCustomize = () => {
    app.dispatch(
      toAdminPath({
        path: '/admin/themes/current/editor',
        newContext: true,
      })
    );
  };

  const hasUnsavedChanges = appSettingsData && urlText !== appSettingsData.url;

  const isActionInProgress = uiState === 'loading' || uiState === 'saving';

  return (
    <Page title="App Settings" divider>
      <Frame>
        {hasUnsavedChanges && (
          <ContextualSaveBar
            alignContentFlush
            message="Unsaved changes"
            saveAction={{
              onAction: handleClickSave,
              loading: uiState === 'saving',
            }}
            discardAction={{
              onAction: handleClickDismiss,
            }}
          />
        )}
        {isActionInProgress && <Loading />}
        {toastProps.content && (
          <Toast
            {...toastProps}
            onDismiss={() => setToastProps(emptyToastProps)}
          />
        )}
        <Layout>
          <Layout.AnnotatedSection
            id="storeDetails"
            title="Global settings"
            description="Provide the default settings to be used across all App Blocks in your theme."
          >
            <LegacyCard>
              <LegacyCard.Section>
                {uiState === 'loading' ? (
                  <SkeletonBodyText />
                ) : (
                  <TextField
                    label="WordPress blog URL"
                    type="url"
                    value={urlText ?? ''}
                    onChange={handleChangeUrl}
                    placeholder="e.g. https://blog.myshopifystore.com"
                  />
                )}
              </LegacyCard.Section>
              <LegacyCard.Section
                title={
                  <Text variant="headingXs" as="h3">
                    <Inline gap="2">
                      {'Theme Configuration'.toUpperCase()}
                      <Badge status="info">Online Store 2.0</Badge>
                    </Inline>
                  </Text>
                }
                subdued
              >
                <Columns columns={'1fr auto'} gap="4">
                  <AlphaStack gap="2">
                    <Text variant="bodyMd" as="p">
                      <strong>VistonWP WordPress Feed</strong> app block was
                      added to your theme.
                    </Text>
                    <Text variant="bodyMd" as="p">
                      Use it to add a new WordPress recent posts section to your
                      store and change its appearance. Follow these
                      instructions:
                    </Text>
                    <Link
                      onClick={handleToggle}
                      ariaExpanded={isInstructionsOpen}
                      ariaControls="basic-collapsible"
                    >
                      <Inline gap="1" blockAlign="baseline">
                        <Icon
                          source={
                            isInstructionsOpen
                              ? ChevronUpMinor
                              : ChevronDownMinor
                          }
                          color="interactive"
                        />
                        Installation instructions
                      </Inline>
                    </Link>
                    <Collapsible
                      open={isInstructionsOpen}
                      id="instructions"
                      transition={{
                        duration: '500ms',
                        timingFunction: 'ease-in-out',
                      }}
                      expandOnPrint
                    >
                      <List type="number">
                        <List.Item>
                          Click <em>"Configure Theme"</em> button to go to your
                          theme editor.
                        </List.Item>
                        <List.Item>
                          In your page template, click <em>"Add section"</em>{' '}
                          and select <em>"VistonWP Wordpress Feed"</em> from the
                          Apps list.
                        </List.Item>
                        <List.Item>
                          Change the feed and post settings to fit your theme.
                          <br />
                          <em>
                            Note: Make sure to provide a Blog URL in case you
                            haven't set one above or you want to use a different
                            one.
                          </em>
                        </List.Item>
                      </List>
                    </Collapsible>
                  </AlphaStack>
                  <div>
                    <Button onClick={handleClickCustomize}>
                      Configure Theme
                    </Button>
                  </div>
                </Columns>
              </LegacyCard.Section>
            </LegacyCard>
          </Layout.AnnotatedSection>
          <Layout.AnnotatedSection
            id="storeDetails"
            title="Get Help"
            description={
              <AlphaStack gap="2">
                <Text variant="bodyMd" as="p">
                  Watch this walkthrough video to learn how to integrate the app
                  with Online Store 2.0 themes.
                </Text>
                <Text variant="bodyMd" as="p">
                  For further assistance{' '}
                  <Link url="mailto:vincas.stonys@proton.me">contact us</Link>
                </Text>
              </AlphaStack>
            }
          >
            <MediaCard
              title="How to Setup the App Theme Sections"
              primaryAction={{
                content: 'Watch the Guide',
                url: 'https://www.loom.com/share/46e7482ae41b44afbad2a56a53ea4de4',
              }}
              description={`Learn to quickly add a recent posts section to your store from your WordPress blog using our app.`}
            >
              <VideoThumbnail thumbnailUrl={videoThumbnail} />
            </MediaCard>
          </Layout.AnnotatedSection>
        </Layout>
      </Frame>
    </Page>
  );
}
