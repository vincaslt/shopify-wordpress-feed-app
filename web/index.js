// @ts-check
import { join } from 'path';
import { readFileSync } from 'fs';
import express from 'express';
import serveStatic from 'serve-static';

import shopify from './shopify.js';
import GDPRWebhookHandlers from './gdpr.js';
import { GraphqlQueryError } from '@shopify/shopify-api';

const APP_DATA_QUERY = `
  query GetAppData($namespace: String, $key: String!) {
    currentAppInstallation {
      id
      metafield(namespace: $namespace, key: $key) {
        id
        key
        value
        namespace
      }
    }
  }
`;

const SET_METAFIELD_MUTATION = `
    mutation CreateAppDataMetafield($metafieldsSetInput: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafieldsSetInput) {
        metafields {
          id
          key
          value
          namespace
        }
      }
    }
  `;

const DELETE_METAFIELD_MUTATION = `
  mutation metafieldDelete($input: MetafieldDeleteInput!) {
    metafieldDelete(input: $input) {
      deletedId
    }
  }
`;

const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT, 10);

const STATIC_PATH =
  process.env.NODE_ENV === 'production'
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: GDPRWebhookHandlers })
);

// All endpoints after this point will require an active session
app.use('/api/*', shopify.validateAuthenticatedSession());

app.use(express.json());

app.get('/api/app-settings', async (_req, res) => {
  const session = res.locals.shopify.session;
  const client = new shopify.api.clients.Graphql({ session });

  const url = await client
    .query({
      data: {
        query: APP_DATA_QUERY,
        variables: {
          namespace: 'app_settings',
          key: 'blog_url',
        },
      },
    })
    .then(({ body }) => body.data.currentAppInstallation.metafield?.value);

  res.status(200).send({ url });
});

app.put('/api/app-settings', async (req, res) => {
  const {
    body: { url },
  } = req;
  const session = res.locals.shopify.session;
  const client = new shopify.api.clients.Graphql({ session });

  let status = 200;
  let error = null;

  try {
    const currentAppInstallation = await client
      .query({
        data: {
          query: APP_DATA_QUERY,
          variables: {
            namespace: 'app_settings',
            key: 'blog_url',
          },
        },
      })
      .then(({ body }) => body.data.currentAppInstallation);

    if (url) {
      await client.query({
        data: {
          query: SET_METAFIELD_MUTATION,
          variables: {
            metafieldsSetInput: [
              {
                namespace: 'app_settings',
                key: 'blog_url',
                type: 'single_line_text_field',
                value: url,
                ownerId: currentAppInstallation.id,
              },
            ],
          },
        },
      });
    } else if (currentAppInstallation.metafield?.id) {
      await client.query({
        data: {
          query: DELETE_METAFIELD_MUTATION,
          variables: {
            input: {
              id: currentAppInstallation.metafield.id,
            },
          },
        },
      });
    }
  } catch (e) {
    if (e instanceof GraphqlQueryError) {
      error = `${e.message}\n${JSON.stringify(e.response, null, 2)}`;
    } else {
      error = e;
    }
  }

  res.status(status).send({ success: status === 200, error });
});

app.use(serveStatic(STATIC_PATH, { index: false }));

app.use('/*', shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set('Content-Type', 'text/html')
    .send(readFileSync(join(STATIC_PATH, 'index.html')));
});

app.listen(PORT);
