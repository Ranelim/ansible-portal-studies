import {
  ScmIntegrationsApi,
  scmIntegrationsApiRef,
  ScmAuth,
} from '@backstage/integration-react';
import {
  AnyApiFactory,
  configApiRef,
  createApiFactory,
  discoveryApiRef,
  fetchApiRef,
  identityApiRef,
  oauthRequestApiRef,
} from '@backstage/core-plugin-api';
import { OAuth2 } from '@backstage/core-app-api';
import { rhAapAuthApiRef } from '@ansible/plugin-backstage-self-service';
import { ScaffolderClient } from '@backstage/plugin-scaffolder';
import { scaffolderApiRef } from '@backstage/plugin-scaffolder-react';

const isStaticDeployment =
  typeof window !== 'undefined' &&
  !['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname);

const noopScaffolderApi = {
  scaffold: async () => ({ taskId: 'noop' }),
  getTemplateParameterSchema: async () => ({ title: '', steps: [] }),
  getTask: async () => ({}),
  streamLogs: async function* () {},
  listActions: async () => [],
  cancelTask: async () => {},
  listTasks: async () => ({ tasks: [] }),
  getIntegrationsList: async () => ({ integrations: [] }),
  event$: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
};

export const apis: AnyApiFactory[] = [
  createApiFactory({
    api: scmIntegrationsApiRef,
    deps: { configApi: configApiRef },
    factory: ({ configApi }) => ScmIntegrationsApi.fromConfig(configApi),
  }),
  ScmAuth.createDefaultApiFactory(),
  createApiFactory({
    api: rhAapAuthApiRef,
    deps: {
      discoveryApi: discoveryApiRef,
      oauthRequestApi: oauthRequestApiRef,
      configApi: configApiRef,
    },
    factory: ({ discoveryApi, oauthRequestApi, configApi }) =>
      OAuth2.create({
        configApi,
        discoveryApi,
        oauthRequestApi,
        provider: {
          id: 'rhaap',
          title: 'RH AAP',
          icon: () => null,
        },
        environment: configApi.getOptionalString('auth.environment'),
        defaultScopes: ['read'],
      }),
  }),
  isStaticDeployment
    ? createApiFactory({
        api: scaffolderApiRef,
        deps: {},
        factory: () => noopScaffolderApi as any,
      })
    : createApiFactory({
        api: scaffolderApiRef,
        deps: {
          discoveryApi: discoveryApiRef,
          scmIntegrationsApi: scmIntegrationsApiRef,
          fetchApi: fetchApiRef,
          identityApi: identityApiRef,
        },
        factory: ({
          discoveryApi,
          scmIntegrationsApi,
          fetchApi,
          identityApi,
        }) =>
          new ScaffolderClient({
            discoveryApi,
            scmIntegrationsApi,
            fetchApi,
            identityApi,
          }),
      }),
];
