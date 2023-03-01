import { Toast, useAuthenticatedFetch } from '@shopify/app-bridge-react';
import {
  ContextualSaveBar,
  Frame,
  Layout,
  LegacyCard,
  Page,
  Text,
  TextField,
} from '@shopify/polaris';

import { useState } from 'react';
import { useAppQuery } from '../hooks';

const emptyToastProps = { content: null };

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [toastProps, setToastProps] = useState(emptyToastProps);
  const [urlText, setUrlText] = useState('');
  const fetch = useAuthenticatedFetch();

  const { data: appSettingsData, refetch } = useAppQuery({
    url: '/api/app-settings',
    reactQueryOptions: {
      onSuccess: (data) => {
        setUrlText(data.url);
        console.log(data);
        setIsLoading(false);
      },
      onError: (error) => {
        console.log('yep, error', error);
      },
      select: (data) => ({
        ...data,
        url: data.url ?? '',
      }),
    },
  });

  const handleChangeUrl = (value) => setUrlText(value);

  const handleClickSave = async () => {
    setIsLoading(true);
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
        content: 'There was an error saving the app settings',
        error: true,
      });
    }

    setIsLoading(false);
  };

  const handleClickDismiss = () => {
    setUrlText(appSettingsData.url);
  };

  const hasUnsavedChanges = appSettingsData && urlText !== appSettingsData.url;

  return (
    <Page title="WordPress Feed App" divider>
      <Frame>
        {hasUnsavedChanges && (
          <ContextualSaveBar
            alignContentFlush
            message="Unsaved changes"
            saveAction={{
              onAction: handleClickSave,
              loading: isLoading,
            }}
            discardAction={{
              onAction: handleClickDismiss,
            }}
          />
        )}
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
                <TextField
                  label="WordPress blog URL"
                  type="url"
                  value={urlText ?? ''}
                  onChange={handleChangeUrl}
                  placeholder="e.g. https://blog.myshopifystore.com"
                />
              </LegacyCard.Section>
              <LegacyCard.Section
                title={
                  <Text variant="headingXs" as="h3">
                    {'Theme Configuration'.toUpperCase()}
                  </Text>
                }
                subdued
              >
                <p>TODO: button link to theme</p>
              </LegacyCard.Section>
            </LegacyCard>
          </Layout.AnnotatedSection>
        </Layout>
      </Frame>
    </Page>
  );
}
