import {
  Toast,
  useAppBridge,
  useAuthenticatedFetch,
} from '@shopify/app-bridge-react';
import {
  Button,
  Columns,
  ContextualSaveBar,
  Frame,
  Layout,
  LegacyCard,
  Page,
  Text,
  TextField,
  Loading,
  SkeletonBodyText,
} from '@shopify/polaris';

import { toAdminPath } from '@shopify/app-bridge/actions/Navigation/Redirect';
import { useState } from 'react';
import { useAppQuery } from '../hooks';

const emptyToastProps = { content: null };

export default function HomePage() {
  const [uiState, setUiState] = useState('loading'); // loading | idle | saving
  const [toastProps, setToastProps] = useState(emptyToastProps);
  const [urlText, setUrlText] = useState('');
  const fetch = useAuthenticatedFetch();
  const app = useAppBridge();

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
      body: JSON.stringify({ url: urlText }),
    });

    await refetch();

    if (response.ok) {
      setToastProps({ content: 'App settings were saved successfully' });
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
    <Page
      title="WordPress Feed App"
      primaryAction={{
        primary: true,
        onAction: handleClickCustomize,
        content: 'Edit Theme Sections',
      }}
      divider
    >
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
            description="These settings will by default be used across all App Blocks in your theme."
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
                    {'Theme Configuration'.toUpperCase()}
                  </Text>
                }
                subdued
              >
                <Columns columns={'1fr auto'} gap={4}>
                  <Text variant="bodyMd" as="p">
                    In the theme editor add an app section -{' '}
                    <em>Wordpress Feed</em>. <br /> You can also customize the
                    appearance there.
                  </Text>
                  <Button onClick={handleClickCustomize}>Customize</Button>
                </Columns>
              </LegacyCard.Section>
            </LegacyCard>
          </Layout.AnnotatedSection>
        </Layout>
      </Frame>
    </Page>
  );
}
